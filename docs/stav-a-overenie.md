# Aktuálny stav Etapy 0 – nový tmavý návrh

10. 10. 2026

Používateľ odmietol pôvodné A/B/C a dodal screenshot a odkazy Ostrolucky. Nová hlavná stránka preto používa originálny tmavý remeselný smer. Pôvodné návrhy sú zachované v /archiv. Nejde o schválenie dizajnu ani Etapy 1.

## Nový prototyp

Titulka, katalóg s demo filtrami a vyhľadávaním, šesť produktových detailov, geometrické demo plánovača, realizácia s lokálnym formulárom a paleta/typografia.

Nové súbory: src/Atelier.tsx, src/atelier.css, public/images/atelier-grain-v1.webp.
Referencia a presný prompt nového vizuálu: docs/novy-smer-ostrolucky.md.
Zdrojový commit: 6e9617c7023d02821a1db3f0816503beac41bb25.
GitHub Actions: https://github.com/martinfabian-pixel/Drevene-terasy/actions/runs/38061954171.

## Overenie

- Statický export 55 stránok vrátane historických návrhov.
- Nový návrh: šesť hlavných stránok × šírky 1440, 768, 390 a 320 px = 24 kombinácií. Bez pretekania celej stránky, chýbajúcich obrázkov alebo JS chýb.
- Vizuálne prezreté desktopové a mobilné screenshoty novej titulky.
- Dvadsaťdva izolovaných kontrol zdrojových handlerov prešlo. Zahŕňajú pôvodnú geometriu a validácie, nové menu, galériu v oboch smeroch, kombináciu filtrov a vyhľadávania, prázdny výsledok, všetky produktové ID, dokumenty a lokálny formulár.
- GitHub Actions potvrdil úspešný tsc -b a produkčný Vite build.
- Job deploy úspešne dokončil nasadenie na GitHub Pages. Nasadený commit je 6e9617c7023d02821a1db3f0816503beac41bb25.

## Hranice

Kontroly handlerov používajú hook stubs; nenahrádzajú kompletný test v React DOM. Mobilné šírky boli overené v Chrome, skutočný iPhone/Safari zatiaľ nie. Priame otvorenie verejnej stránky je v tomto prostredí nedostupné; lokálna sieť nepovoľuje socket.

Materiály sú demo bez vymyslených cien a parametrov. Ilustrácie sú označené AI a nie sú fotografiami zákazníckych realizácií. Logo je pracovné. Overené produkty JAF, existujúce logo, kontakty a autorizované fotografie treba doplniť z podkladov značky.

Plánovač počíta plochu obdĺžnika; ilustrácie dosiek nie sú kusovník. Formulár nič neodosiela. Žiadne platby ani objednávky nie sú aktívne.

## Schválenie

Po odovzdaní tohto nového prototypu čakáme na pripomienky a výslovné rozhodnutie používateľa. Etapa 1 sa nezačala.

Adresa: https://martinfabian-pixel.github.io/Drevene-terasy/#/atelier/domov
