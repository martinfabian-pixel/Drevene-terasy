# POD POVRCHOM — manuál 04

## Architektúra

- `/pod-povrchom`: register šiestich manuálov. Publikovaný je iba 04; ostatné majú názov, rozsah a jasný stav prípravy.
- `/pod-povrchom/04-podkonstrukcie`: sedem kapitol, základná/profesionálna úroveň, tri vlastné SVG detaily, prepínanie rizika, vrstvy, zväčšenie, kontrolný protokol a zdroje.
- `src/academy/manual.ts`: redakčný obsah, zdroje a metadata. Produktové hodnoty sa neduplikujú: boardRows aj lunaExample používajú technicalProfile z existujúceho registra.
- Žiadne zmeny obchodného katalógu, cien, skladu, košíka ani výpočtových pravidiel. Odkaz do plánovača obsahuje presné product a variant.
- Protokol zostáva iba v pamäti stránky; neodosiela osobné údaje a nepredstiera odborné schválenie.

## PDF

`scripts/qa-academy-ci.mjs` otvorí skutočný produkčný manuál s `?print=1`, profesionálnou úrovňou a všetkými artiklami. Chromium z rovnakého DOM vytvorí A4 dokument `dist/manuals/pod-povrchom-04.pdf` s číslovanými stranami, vektorovými SVG a textom. Nie je tu druhá ručne udržiavaná databáza PDF obsahu. Súbor sa vytvára pred uploadom Pages. Neúspešné testy blokujú nasadenie. Tlač aktuálneho protokolu je samostatná funkcia prehliadača.

## Technická dôveryhodnosť

Podkladom sú existujúce docs/planner-rules.md, docs/rapitec-rules.md, technický register a súkromná evidencia pôvodných PDF. Číslovanie JAF je fyzická strana PDF (dvojstrany), nie zameniteľné tlačené číslo. Originálne schémy ani texty výrobcov sa nekopírujú na web.

40 × 70 mm je výslovne modelový príklad, nie statický návrh SKU. Dvojica nosníkov a kóty Lunawood majú obmedzený rozsah použitia. Neprenášajú sa na WPC ani všetky skryté systémy. Rozstup nosníkov pod doskou nie je rozpätie nosníka ani raster terčov.

Redakčná kontrola: 11. 10. 2026. Nezávislá odborná revízia, meno a dátum schvaľujúcej osoby nie sú doložené a verejný manuál to uvádza.

## Otvorené rozhodnutia

Statika konkrétnych nosníkov/podpier a podložia; konflikty výšky a odvetrania; kompletné štarty/koncovky skrytých systémov; Gardin dilatácie a pevné body; projektové detaily prahov, bazénov a hydroizolácie. Potrebné potvrdenie príslušného výrobcu/projektanta, nie automatická voľba priaznivejšej hodnoty.

## Testy

Integračný test pracuje s reálnym Vite buildom v Chromium a WebKit: index, kapitoly, úrovne, vrstvy, riziko, checklist, tabuľka 51 variantov, presná hodnota 450 mm pre 55987/0230, odkazy variantov, stiahnutie PDF a horizontálne pretečenie. Šírky 375, 402, 820, 1440 a 1920 px. WebKit nie je test fyzického iPhonu.

Existujúce testy katalógu, cien, geometrie, košíka, backendu, homepage a mobilného plánovača pokračujú nezmenené. Výsledky konkrétneho behu sú v GitHub Actions a artefakte qa/ci-academy/report.json; dokumentácia sama nepredstiera ich úspech.
