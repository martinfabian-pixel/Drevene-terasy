# Drevené terasy

Existujúci projekt **martinfabian-pixel/Drevene-terasy**. Dizajnový smer Experimental Architectural Commerce 2027: biela, čierna, limetkovozelená, monumentálna typografia a technické 2D/3D zobrazenie.

Používateľ schválil pokračovanie z titulky na katalóg, plánovač, košík a ďalšie stránky. Predchádzajúce koncepty sú zachované v archíve; ich historické schvaľovacie pravidlá neopisujú aktuálny stav.

## Aktuálny rozsah

- Responzívna titulka a jednotná navigácia, menu, košík a pätička.
- Opravená ilustračná konštrukcia: dosky → jeden kolmý nosný rošt → terče → betón. Fotorealistický prvý pohľad a samostatný Three.js model.
- Katalóg desiatich kategórií, vyhľadávanie, filtre, zoradenie a porovnanie.
- Detail produktu: profily, výrobné dĺžky, množstvo, plošný prepočet a plánovač s vybraným variantom.
- Interaktívny 2D editor s presnými číselnými súradnicami, vrcholmi, výrezmi, kótami, vrstvami, zoomom a posúvaním. 3D model používa rovnaký vypočítaný návrh.
- Oddelený deterministický výpočtový modul, materiálový zoznam a optimalizácia nárezov. Uloženie/otvorenie projektu, export JSON, tlač/uloženie PDF a košík.
- Lokálny košík a dopytová pokladňa s fakturačnými údajmi, firmou, dopravou/odberom a rekapituláciou.
- Realizácia na kľúč, kontakt, galéria označených vizualizácií, O nás a deväť poradenských článkov s primárnymi zdrojmi.
- Funkčné lokálne administračné demo: produkty, varianty, ceny, fotografie/náhľady, dostupnosť, CSV/JSON, explicitné lokálne zálohy a príprava obsahu.
- Pripravený oddelený backend a API klient. Server, produkčná administrácia, prijímanie zákazníckych údajov, platby a reálne objednávky **nie sú aktivované**.

## Trasy

Základ: [Drevené terasy](https://martinfabian-pixel.github.io/Drevene-terasy/). Hash smerovanie je kompatibilné s GitHub Pages.

| Trasa | Obsah |
| --- | --- |
| `#/` alebo `#/2027` | Domov |
| `#/terasove-dosky` | Katalóg dosiek |
| `#/masivne-drevo`, `#/thermowood`, `#/wpc-terasy` | Kategórie |
| `#/prislusenstvo` | Príslušenstvo |
| `#/produkt/demo-massive` | Demo detail a varianty |
| `#/planovac` | 2D/3D plánovač |
| `#/kosik`, `#/pokladna` | Košík a lokálny dopyt |
| `#/realizacie`, `#/realizacia-na-kluc` | Inšpirácia a služby |
| `#/poradna`, `#/o-nas`, `#/kontakt` | Obsah |
| `#/admin` | Jasne označené lokálne demo |
| `#/pravne-informacie` | Podklady na odborné schválenie |
| `#/archiv`, `#/atelier/domov`, `#/a/domov`, `#/b/domov`, `#/c/domov` | Staršie návrhy |

## Údaje a hranice výpočtov

- Päť zadaných kategórií JAF pri automatickom čítaní vracia HTTP 403. Bez CSV/cenníka a technických listov sa aktuálny sortiment, ceny a dostupnosť neuvádzajú ako overené.
- Seedovaný katalóg obsahuje **DEMO** produkty. Rozmery a montážne hodnoty sú demonštračné. Ceny, výrobca, dostupnosť a dokumenty sú nevyplnené, kým sa nedodajú overené údaje.
- Vložené architektonické a materiálové vizualizácie projektu sú označené AI ilustrácie, nie fotografie realizácií firmy. Obrázok vložený používateľom v lokálnom deme má samostatný neutrálny popis pôvodu.
- Instagram/Facebook neboli dostupné na automatickú analýzu. Firemné kontakty, vlastné fotografie, realizácie ani hodnotenia sa nevymýšľajú.
- Plánovač rozlišuje geometriu, demo výpočet a technicky overený montážny profil. Nepodporená geometria, podklad, neplatný pôdorys alebo nekompletné pravidlá vedú k vysvetleniu a zablokovaniu príslušného kusovníka. [Podrobné hranice](docs/calculations.html).
- Tlač do PDF využíva prehliadač; tento náhľad neposkytuje serverový PDF archív.
- Dopyty sú lokálne súbory na stiahnutie. Údaje ani fotografie sa neposielajú firme. Kontaktné údaje sa automaticky neukladajú v prehliadači.

## Moduly

| Súbor/modul | Zodpovednosť |
| --- | --- |
| `src/PlatformShell.tsx` | Navigácia, menu, pätička, právny náhľad |
| `src/Homepage2027.tsx`, `src/DeckScene2027.tsx` | Titulka a ilustračná konštrukcia |
| `src/PlatformPages.tsx`, `src/platform-pages.css` | Katalóg, detail, košík, pokladňa, obsah, lokálne admin |
| `src/commerce/catalog.ts` | Produkty, varianty, základné prepočty |
| `src/commerce/cart-core.ts`, `cart.tsx` | Košík, ceny/DPH, validácia množstiev |
| `src/commerce/csv.ts`, `catalog-import.ts`, `rules-import.ts` | CSV/JSON a montážne pravidlá |
| `src/commerce/api.ts` | Pripravený HTTPS klient; komerčné prepínače vypnuté |
| `src/engine/` | Geometria, kusovník, montážne pravidlá a nárezy |
| `src/Planner2027.tsx`, `src/PlannerScene2027.tsx` | 2D editor a synchronizovaný Three.js model |
| `server/` | Oddelené API a šifrovaný perzistentný dátový súbor |

Existujúci stack: React, TypeScript, Vite, React Router, Three.js a vlastné responzívne CSS. Ďalší stavový/CSS framework sa nepridáva iba kvôli prepisu fungujúceho projektu.

## Spustenie a testy

Node.js 24:

```sh
npm install
npm run dev
npm run build
npm run test:engine
npm run test:commerce
npm run test:server
npx playwright install --with-deps chromium webkit
npm run test:homepage
npm run test:platform
npm run test:platform-extra
```

Browser testy spúšťajú vlastný lokálny server nad `dist/`; najprv vykonajte build. Testujú responzivitu a hlavné používateľské interakcie. Čisté commerce testy overujú jednotky, DPH, blokovanie demo predaja, CSV, pravidlá a prílohy projektu. Backend testy používajú dočasnú konfiguráciu na loopback adrese; nevykonávajú produkčné operácie.

Priame závislosti sú zafixované verziami v `package.json`. Pracovné prostredie Codex nemá prístup k npm registry; úplný TypeScript/Vite build a skutočné React DOM testy sa vykonávajú v GitHub Actions. Zdrojové/static testy nie sú náhradou týchto kontrol.

## GitHub Pages

Workflow `.github/workflows/pages.yml` vykoná build, výpočtové/commerce/backend testy a Playwright overenie. Nasadenie prebehne až po úspešných kontrolách. Screenshoty a reporty sú CI artifact.

Vite base je **/Drevene-terasy/**. Veľkosť písmen názvu je dôležitá pre assety. Pages hostuje iba frontend, nikdy zákaznícku databázu ani platobný backend.

## Backend a aktivácia

Node.js builtins: scrypt heslá, náhodné HttpOnly/SameSite sessions, autorizácia správcu, CSRF pre zmeny, origin allowlist, rate limity, validácia, idempotencia a AES-256-GCM šifrovanie.

Server vyžaduje `DATA_ENCRYPTION_KEY`, `ADMIN_USER`, `ADMIN_PASSWORD_SCRYPT`, `ALLOWED_ORIGINS`; žiadne tajomstvá nie sú v projekte. Vývoj sa viaže iba na loopback. Produkčná administrácia má byť na rovnakom HTTPS origin ako backend. Verejné `#/admin` je iba lokálne demo bez prístupu k serverovým záznamom.

Reálne objednávky potrebujú zároveň `COMMERCE_OWNER_APPROVED=yes` a `COMMERCE_LIVE=yes`, potvrdený serverový katalóg, ceny, DPH a štruktúrované zásoby. Príjem dopytov vyžaduje `ACCEPT_INQUIRIES=yes`. Frontendové prepínače sú predvolene vypnuté; server rozhoduje autoritatívne. Platobná brána nie je nakonfigurovaná ani simulovaná.

Pred aktiváciou treba dodať produktový export/cenník, montážne listy a kompatibilitu, firemné kontakty/údaje, vlastné fotografie, právne texty, backend hosting/TLS, zálohy a monitoring. Reálny predaj vyžaduje výslovné schválenie majiteľa. [Prevádzkové kroky a hranice](docs/platform.html).

## Dokumentácia a archív

- [Aktuálna platforma a prevádzkové hranice](docs/platform.html)
- [Výpočtový modul](docs/calculations.html)
- [Analýza plánovačov](docs/planner-references-platform.html)
- [Pôvodná implementácia schválenej titulky](docs/homepage-2027.html)
- [Prompty titulky](docs/image-prompts-2027.json) a [aktualizovanej platformy](docs/image-prompts-platform2027.json)
- Historické analýzy v `research/` a podklady v `docs/` opisujú staršie fázy; nepotvrdzujú aktuálne ceny, produkty alebo realizácie.

## Overené nasadenie

Aplikačný commit `6f27110de54950c34344e8bafbca5e014a1c4e63`: build, 102 výpočtových/commerce/backend testov, 93 responzívnych rozložení a všetky rozšírené prehliadačové kontroly prešli. [CI beh](https://github.com/martinfabian-pixel/Drevene-terasy/actions/runs/38071471953) obsahuje screenshoty, PDF a reporty. [Podrobný záznam a prevádzkové hranice](docs/implementation-platform-2027.html).
