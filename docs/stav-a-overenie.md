# Stav Etapy 0 a rozsah overenia

10. 10. 2026

## Pripravené

- Tri odlišné responzívne koncepty A/B/C: titulka, katalóg, šesť produktových detailov, plánovač, realizácia, poradňa a paleta s typografiou.
- Spoločné porovnanie s prepnutím konceptu a desktopového/mobilného náhľadu.
- Samostatná React/TypeScript aplikácia a oddelené demo produkty; návrh dátového kontraktu, backendu, administrácie a výpočtového modulu pre budúce schválené etapy.
- Aktualizované titulky podľa preferencie atmosféry a fotografií Holz und Design. Štyri originálne AI vizuály, jasne označené. Nejde o zákaznícke realizácie ani dodávateľské fotografie.
- GitHub Actions workflow pre TypeScript, produkčný Vite build a GitHub Pages. Skutočný názov nového samostatného repozitára je martinfabian-pixel/Drevene-terasy; base aplikácie zodpovedá veľkému D.
- Offline export 43 stránok. Je určený na posúdenie dizajnu; plné demo ovládanie je v React zdrojoch.

## Lokálne overenie

- Esbuild spracoval TS/TSX zdroje a vyrenderoval statické náhľady.
- Headless Chrome skontroloval 22 základných stránok pri šírkach 1440, 768, 390 a 320 px: 88 kombinácií. Bez pretekania celej stránky, chýbajúcich obrázkov a JS chýb. Horizontálne kategórie na mobile sa posúvajú zámerne.
- Prepnutie konceptov a mobilného náhľadu, mobilné menu a lokálne odkazy sú funkčné.
- Trinásť izolovaných kontrol handlerov s hook stubmi pokrýva plochu, validáciu rozmerov, 2D/3D, materiál, vrstvy, reset, vyhľadávanie, prázdne kategórie, príslušenstvo, všetky produktové detaily a prepnutie C titulky.
- Vizuálne kontrolované desktopové a mobilné screenshoty. Kontrola zdrojov nenašla konkrétnu zrejmú chybu strict TypeScriptu; doplnené sú landmarky a klávesové ovládanie tabov.

## Hranice overenia

- Npm registry je v lokálnom prostredí neprístupná. Plný TypeScript semantic check a produkčný build musí potvrdiť GitHub Actions. Hook stubs nenahrádzajú test v reálnom React DOM.
- Mobilné šírky boli overené v Chrome; skutočný iPhone/Safari zatiaľ nebol testovaný.
- Ceny, dostupnosť a technické údaje JAF nie sú overené: päť kategórií vrátilo HTTP 403. Sociálne profily neboli dostupné. Potrebujeme existujúce logo a autorizované fotografie značky.
- Pri referenciách sa hodnotí dostupný verejný obsah. Presné vizuálne rozloženie, fonty, animácie a interné algoritmy sa nepodarilo overiť.
- Plánovač počíta iba geometrickú plochu obdĺžnika. Počet ilustrovaných dosiek nie je kusovník; ceny a materiálové pravidlá čakajú na overené produkty.

## Nasadenie a schválenie

Repozitár s vetvou main je dostupný. Nahrávame zdroje Etapy 0 a následne overíme workflow a verejné stránky. Zverejnenie potvrdí až úspešné nasadenie. Ak Pages ešte nie je zapnuté, vlastník musí v Settings → Pages zvoliť Source: GitHub Actions; konektor nemá nástroj na zmenu tohto nastavenia.

Po sprístupnení konceptov sa práca zastaví a čaká na výber a pripomienky používateľa. Etapa 1 sa nezačala; každý ďalší schvaľovací krok vyžaduje výslovné povolenie.
