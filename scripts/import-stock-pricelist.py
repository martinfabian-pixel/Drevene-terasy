"""Extract a JAF stock PDF into a reviewable, exact article manifest.

Usage: python scripts/import-stock-pricelist.py input.pdf --output src/data/jaf-stock-2026-10-10.json
Requires pdfplumber. No web scraping, discounts, VAT assumptions or mounting rules.
Unknown layouts, missing icons, duplicate articles and inconsistent prices fail closed.
"""
import argparse
import csv
import hashlib
import json
import re
from collections import Counter
from decimal import Decimal
from pathlib import Path

import pdfplumber


def clean(value):
    return re.sub(r"\s+", " ", re.sub(r"(?<=\w)-\n", "-", value or "")).strip()


def price(value):
    match = re.fullmatch(r"([\d ]+,\d{2})\s*€/\s*(ks|balenie|bm)", clean(value))
    if not match:
        raise ValueError(f"Unrecognised exact gross price: {value!r}")
    return int(Decimal(match[1].replace(" ", "").replace(",", ".")) * 100), match[2]


def extract(pdf_path, first=3, last=8):
    articles = []
    with pdfplumber.open(pdf_path) as document:
        if len(document.pages) < last:
            raise ValueError("Required stock pages missing")
        date_match = re.search(r"aktualizovan[ýy]:\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})", document.pages[1].extract_text())
        if not date_match:
            raise ValueError("Cannot confirm the pricelist date")
        day, month, year = map(int, date_match.groups())
        date = f"{year:04d}-{month:02d}-{day:02d}"
        previous_headers = {}
        for page_number in range(first, last + 1):
            page = document.pages[page_number - 1]
            expected_ids = set(re.findall(r"\b\d{5}/\d{4}\b", page.extract_text()))
            page_ids = set()
            for table in page.find_tables():
                rows = table.extract()
                category = clean(rows[0][0])
                if not category.startswith(("Terasy", "WPC terasy", "Príslušenstvo")):
                    continue
                header_index = next((i for i, row in enumerate(rows) if clean(row[0]) == "Artiklové číslo"), None)
                if header_index is not None:
                    headers = [clean(cell) for cell in rows[header_index]]
                    previous_headers[category] = headers
                else:
                    headers = previous_headers.get(category)
                if not headers or len(headers) != len(rows[0]):
                    raise ValueError(f"Unknown table layout on page {page_number}: {category}")
                for row_index, row in enumerate(rows):
                    article = clean(row[0])
                    if not re.fullmatch(r"\d{5}/\d{4}", article):
                        continue
                    cells = dict(zip(headers, map(clean, row)))
                    stock_column = headers.index("Skladový program")
                    stock_cell = table.rows[row_index].cells[stock_column]
                    if stock_cell is None:
                        raise ValueError(f"Missing stock status cell: {article}")
                    x0, top, x1, bottom = stock_cell
                    icons = [shape for shape in page.curves if 3 < shape['width'] < 7 and 3 < shape['height'] < 7
                             and x0 < (shape['x0'] + shape['x1']) / 2 < x1
                             and top < (shape['top'] + shape['bottom']) / 2 < bottom]
                    if len(icons) != 1:
                        raise ValueError(f"Unrecognised stock icon: {article}")
                    main_cents, main_unit = price(cells['Cena za predajnú jednotku (vr. DPH)'])
                    info_cents, info_unit = price(cells['Cena za mernú jednotku (vr. DPH)'])
                    if main_unit not in ('ks', 'balenie'):
                        raise ValueError(f"Unsupported sale unit: {article}")
                    if not re.fullmatch(r"R\d+", cells['RS']):
                        raise ValueError(f"Missing rebate group: {article}")
                    articles.append({
                        'article': article, 'name': cells['Popis'], 'sourceCategory': category, 'page': page_number,
                        'thickness': cells['Hrúbka'], 'format': cells['Formát'], 'salesUnit': main_unit,
                        'priceGrossCents': main_cents, 'referenceUnit': info_unit, 'referenceGrossCents': info_cents,
                        'rebateGroup': cells['RS'],
                        'stockStatus': 'Skladový program' if icons[0]['fill'] else 'Skladom do vypredania zásob',
                        'dimensionsText': cells.get('Rozmer') or None, 'quality': cells.get('Kvalita') or None,
                        'packageContent': cells.get('Obsah balenia') or None, 'packageUnit': cells.get('Jednotka balenia') or None,
                    })
                    page_ids.add(article)
            if page_ids != expected_ids:
                raise ValueError(f"Incomplete page {page_number}: {sorted(expected_ids - page_ids)}")
    ids = [article['article'] for article in articles]
    if len(set(ids)) != len(ids) or not articles:
        raise ValueError("Duplicate or empty article list")
    return {
        'version': 1, 'source': {
            'id': f'jaf-stock-{date}', 'title': 'Skladový program – Cenník', 'date': date, 'supplier': 'JAF HOLZ',
            'sha256': hashlib.sha256(Path(pdf_path).read_bytes()).hexdigest(), 'pages': list(range(first, last + 1)),
            'vatRate': None, 'pricesIncludeVat': True, 'liveAvailability': False,
        },
        'audit': {'articleCount': len(articles), 'pageCounts': dict(Counter(a['page'] for a in articles)),
                  'grossChecksumCents': sum(a['priceGrossCents'] for a in articles),
                  'clearanceCount': sum(a['stockStatus'] == 'Skladom do vypredania zásob' for a in articles)},
        'articles': articles,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--previous', type=Path, help='Previous manifest, for a reviewed price/identity diff')
    parser.add_argument('--first-page', type=int, default=3)
    parser.add_argument('--last-page', type=int, default=8)
    args = parser.parse_args()
    manifest = extract(args.pdf, args.first_page, args.last_page)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    csv_path = args.output.with_suffix('.csv')
    with csv_path.open('w', newline='', encoding='utf-8-sig') as stream:
        writer = csv.DictWriter(stream, fieldnames=list(manifest['articles'][0]), delimiter=';')
        writer.writeheader()
        writer.writerows(manifest['articles'])
    if args.previous:
        before = {a['article']: a for a in json.loads(args.previous.read_text(encoding='utf-8'))['articles']}
        after = {a['article']: a for a in manifest['articles']}
        changes = [{'article': key, 'before': before.get(key), 'after': after.get(key)}
                   for key in sorted(before.keys() | after.keys()) if before.get(key) != after.get(key)]
        args.output.with_suffix('.diff.json').write_text(json.dumps(changes, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'output': str(args.output), 'source': manifest['source'], 'audit': manifest['audit']}, ensure_ascii=True))


if __name__ == '__main__':
    main()
