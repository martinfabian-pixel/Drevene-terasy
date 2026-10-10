# Drevené terasy — Etapa 0

Samostatný projekt pre slovenskú značku Drevené terasy. Tri dizajnové návrhy na schválenie; tento projekt zatiaľ nevykonáva objednávky, platby ani materiálové kalkulácie.

## Návrhy

- A — Premium Nature: prirodzená farebnosť, serifová typografia, veľké ilustračné fotografie.
- B — Architectural Studio: výrazná typografia, architektonický rytmus, technické grafické prvky.
- C — Interactive Design Experience: návrh terasy ako prvý krok, interaktívne vizuálne rozhranie.

Každý obsahuje titulku, katalóg, produktový detail, rozhranie plánovača, realizáciu, návrh poradenskej sekcie a paletu s typografiou. Spoločná stránka obsahuje porovnanie a mobilný náhľad.

Po výbere konceptu nasleduje Etapa 1 a druhé schválenie. Bez výslovného súhlasu sa ďalšia etapa nezačne.

### Aktuálna dizajnová preferencia

Používateľ doplnil [Holz und Design](https://holzunddesign-holzterrasse.de/) a označil jeho celkovú atmosféru a fotografie za obľúbený smer. V Etape 0 preto posilňujeme fotografické sekcie a prirodzenú atmosféru vo všetkých troch návrhoch. Žiadny koncept zatiaľ nebol vybraný. Podrobnosti: `docs/dizajnovy-smer.md` a `research/holzunddesign.md`.

## Obsah a dôveryhodnosť

- Existujúce profily Instagram/Facebook sa nepodarilo načítať. Logo a farebnosť sú pracovným návrhom, nie overenou existujúcou identitou.
- Kategórie JAF vrátili HTTP 403. Produkty sú označené DEMO. Ceny, rozmery, výrobca, dostupnosť a technické listy zostávajú prázdne. Žiadna technická hodnota sa neodvodzuje z ilustračného obrázka.
- Štyri vizuály terás boli vytvorené nástrojom Imagegen a nie sú fotografiami našich realizácií.
- Materiálové ilustrácie sú vlastné CSS/SVG kresby. Nepreberáme fotografie či databázu dodávateľa.
- Rozhranie plánovača počíta iba geometrickú plochu obdĺžnika. Počet zobrazených dosiek a nosníkov je dekoratívny, nie výpočet kusovníka.
- Dopytový formulár je lokálna ukážka; žiadny obsah sa neodosiela a fotografie sa nenahrávajú na server.

## Technológie prototypov

React, TypeScript, Vite, React Router (hash trasy kompatibilné s GitHub Pages), vlastné responzívne CSS. Three.js/R3F, Zustand a výpočtový modul sú navrhnuté pre neskoršie schválené etapy. V Etape 0 nepridávame obchodný backend ani plnohodnotný 3D engine.

## Lokálne spustenie

Node.js 24:

```sh
npm install
npm run dev
npm run build
```

Produkčné závislosti sú zafixované na konkrétne verzie. Pred Etapou 2 doplníme a commitneme aj lockfile pre reprodukovateľné tranzitívne závislosti. V pracovnom prostredí Codex bol prístup k npm registry blokovaný; lokálny kompletný build preto nebol vykonaný. Workflow vykonáva kontrolu TypeScriptu a produkčný build na GitHub Actions. Oba kroky aj nasadenie úspešne prešli v [run 38060697149](https://github.com/martinfabian-pixel/Drevene-terasy/actions/runs/38060697149). Rozsah a hranice overenia sú v docs/stav-a-overenie.md.

## GitHub Pages

Samostatný repozitár: `martinfabian-pixel/Drevene-terasy`, predvolená vetva `main`.

1. Repozitár je založený samostatne; zdrojové súbory Etapy 0 sú nahraté vo vetve main.
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. Workflow `.github/workflows/pages.yml` vytvorí a nasadí frontend po každom push do `main`.

Vite používa base `/Drevene-terasy/`. Verejné adresy (GitHub Actions build aj deploy úspešné 10. 10. 2026):

- Porovnanie: `https://martinfabian-pixel.github.io/Drevene-terasy/`
- A: `https://martinfabian-pixel.github.io/Drevene-terasy/#/a/domov`
- B: `https://martinfabian-pixel.github.io/Drevene-terasy/#/b/domov`
- C: `https://martinfabian-pixel.github.io/Drevene-terasy/#/c/domov`

## Analýza a architektúra

- `research/referencie-dizajn.md`
- `research/referencie-planovace.md`
- `research/znacka-sortiment.md`
- `docs/architektura.md`
- `docs/vizualy.md`
- `public/docs/analyza.html`

Analýzy odlišujú dostupný obsah od neovereného správania. Statické offline exporty sú určené na posúdenie vzhľadu; ich ovládacie prvky nemenia návrh. Funkčné demo ovládanie je súčasťou React zdrojov a musí sa overiť po dostupnosti závislostí.
