# Drevené terasy — jednotný neutrálny dizajnový systém

## Východisko

Vizuálna úprava nadväzuje na `e74f095` a zachováva obsah, adresy, ceny, obchodné pravidlá a technické výpočty. Referencia: [FIXINGGROUP Terrasse](https://www.fixinggroup.com/terrasse/), kontrolovaná 11. 10. 2026 pomocou Chromium pri šírkach 320, 375, 402, 430, 768, 1440 a 1920 px.

Priložené screenshoty uvedené v zadaní neboli v tejto správe dostupné. Použitá je živá stránka a [český katalóg](https://www.fixinggroup.com/wp-content/uploads/2026/01/FXG_Katalog_CZ.pdf): 116 strán, 21 503 247 bajtov, SHA-256 `891a06875bad005fa1e88859f57fc05d0361a6ffb861ecee08aa3d420bcfc459`. Katalóg a screenshoty referencie zostávajú v súkromných QA artefaktoch. Cudzie fotografie, logá, ilustrácie ani zdrojový kód sa nezaraďujú do webu.

## Zmerané hodnoty referencie

| Prvok | Desktop | Mobil |
| --- | --- | --- |
| Písmo | Open Sans, Helvetica/Arial fallback | rovnaké |
| Bežný text | 19 px / 28 px, 400 | 19 px / 28 px, 400 |
| Hlavný textový nadpis | 34 px / 44 px, 700 | 24 px / 34 px, 700 |
| Produktové nadpisy | 26 px / 40 px, 700 | 26 px / 30 px, 700 |
| Obsahová mriežka | 1120 px | fluidná |
| Pozadie hlavnej plochy | rgb(229,229,229) | rovnaké |
| Text | rgb(0,0,0) | rovnaké |

Pri 1440 px má produktová mriežka ľavý okraj 160 px; pri 1920 px 400 px. Štyri stĺpce majú po 272,5 px s 10 px medzerou. Na úzkych mobiloch sa menia na jeden stĺpec. Hlavička je biela; čierna a sivá sa používajú aj v technickom katalógu PDF.

Prvé snímky referencie obsahovali oneskorene načítaný Cookiebot. Audit bol preto opravený: čaká na tlačidlo iba potrebných cookies a následne vyžaduje skrytie dialógu. Prekrytú snímku nepovažuje za úspešné porovnanie.

## Spoločné tokeny

Autoritatívny súbor: `src/styles/design-system.css`.

- Farby: biela `#fff`, hlavná sivá `#e5e5e5`, jemná plocha `#f4f4f4`, čierna `#000`, sekundárny text `#555`, línie `#ccc`.
- Open Sans 400/600/700 zo samostatného balíka `@fontsource/open-sans` 5.2.7, licencia OFL-1.1; lokálne fonty, latinská aj rozšírená latinská sada pre slovenčinu. Font sa nekopíruje z referenčného webu.
- H1 24–34 px; H2 26 px; H3 20 px. Žiadne perspektívne transformácie nadpisov.
- Bežný text 16–19 px podľa priestoru; technické a pomocné texty spravidla 14 px.
- Kontajner 1120 px; vonkajšie okraje 32 px na desktope a 16 px na mobile.
- Medzery 4/8/12/16/24/32/48/64/96 px.
- Hlavné ovládacie prvky minimálne 44–48 px; ostré rohy, jednoduché čierne alebo obrysové tlačidlá.

Hodnoty sú vlastnou implementáciou zmeraného vizuálneho jazyka. Rozloženie formulárov, ovládanie plánovača a prístupnosť sa prispôsobujú existujúcemu obsahu Drevených terás.

## Vrstvy štýlov

1. Základný reset `src/styles.css` zachováva pôvodné predpoklady tlačových dokumentov; nepoužívané prezentačné štýly historických konceptov sa odstránili.
2. Samostatné súbory pre hlavičku/domov, platformu, plánovač a akadémiu používajú spoločné tokeny.
3. `src/styles/technical-drawings.css` sa načítava posledný. Má jednotné čierne línie, sivé výplne a vlastné šrafovanie. Označené sú iba technické SVG; fotografie a realistické materiály Three.js sa nepremaľujú.

Nový systém je určený pre obrazovku. Existujúce tlačové pravidlá, obsah PDF, technické SVG atribúty používané pri tlači a `academy-print-document` ostávajú zachované. Statické indexovateľné stránky sprievodcov používajú tiež rovnaký systém a lokálne fonty.

## Zachovanie práce

Regresná kontrola chráni 137 artiklov, 83 detailov, 13 označení do vypredania zásob, cenníkové ceny, údaje košíka, výpočty a spoločné pravidlá. Obsah manuálov, článkov, sprievodcov a PDF sa nemení. Dátová ani výpočtová vrstva sa nekopíruje.

Zostáva pôvodná pomocná veta plánovača „Ťahaj zelené body…“. Farba bodov je podľa zadania neutrálna; zmena tohto slova by vyžadovala súhlas so zmenou existujúceho textu.

## Overenie

`scripts/qa-site-design-ci.mjs` dopĺňa pôvodné regresné sady: inventár trás, všetky produkty, sprievodcovia, statické HTML bez JavaScriptu, monochrómne SVG, neprítomnosť neónovej farby a starých transformovaných nadpisov, sedem šírok, WebKit, košík, plánovač a PDF odkazy. Screenshoty sa ukladajú do `qa/ci-site-design`; výsledky vykonaných behov patria do odovzdávacieho reportu.
