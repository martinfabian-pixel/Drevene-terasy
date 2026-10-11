# POD POVRCHOM / etapa 2

Základ: main c3efe882e9f3029cf76e8950aac14bc4874c7155. Audit 11. 10. 2026: publikovaný manuál 04, ostatných päť iba pripravené karty. Manuál 04, jeho route a odborný obsah zostávajú zachované. Doplnené samostatné routy 01, 02, 03, 05, 06 a desať redakčných článkov. Nevytvára sa druhá databáza montážnych hodnôt.

## Dátové hranice

`manual.ts` načítava presné SKU cez technicalProfile. Nové manuály filtrujú tú istú tabuľku; schéma koncových odstupov načítava overené pravidlá konkrétneho Lunawood variantu. Katalóg, ceny, košík a výpočtový modul bez zmien. Sortiment 137 artiklov / 83 detailov / 13 označení do vypredania zásob sa kontroluje regresne.

`library.ts`: redakčný obsah piatich manuálov, postupy, kontrolné zoznamy a chýbajúce podklady. `editorial.ts`: desať samostatných článkov. `LibraryPage.tsx`: čítačka, úrovne, protokol, presné produktové varianty a planner deep links. `Detail.tsx`: vlastné SVG hlavy skrutky, odstupov od čela, odvetrania, drevo/hliník a rezu; existujúce tri detaily zachované.

## Zdroje a nové overenie

Použité existujúce evidované PDF a pravidlá: JAF 2026, Lunawood 2023, pokyny pre odborníkov, UPM a HPM TEC 08/2026. Pri rozšírení znova skontrolované relevantné texty údržby Lunawood s. 43–44, opracovania s. 41, starších pokynov s. 2–4, JAF PDF 27 a register presných vrutov. Manuály neopakujú cudzie obrazové schémy.

Smerové zosychanie: USDA Forest Products Laboratory, Wood Handbook FPL-GTR-282 (2021), kap. 4, tlačené s. 4–7 až 4–9, https://research.fs.usda.gov/download/treesearch/62243.pdf. Ide o všeobecný fyzikálny princíp, nie triedenie konkrétnej dodávky. Neuvádzajú sa vlastné druhové koeficienty ani tvrdenie, že tangenciálny rez vždy tvorí triesky.

Majiteľom poskytnuté údaje: štúdium drevených konštrukcií, profesionálne terasy od 2017, bývalý produktový špecialista JAF, vlastné zákazky, projektovanie SEMA. Publikované ako údaje majiteľa, bez nových certifikácií alebo počtov realizácií. Skúsenosť s niektorými doskami Cumaru označená ako pozorovanie, bez generalizácie. Existujúci súbor commerce/articles.ts nie je doloženým archívom autorských článkov majiteľa; nové texty sa nevydávajú za ich odbornú revíziu.

## Na odborné doplnenie

- Triedenie, tolerancie, presná identita a údržbové predpisy dodávok exotického dreva; vzorky a okolnosti pozorovania Cumaru.
- Lunawood: rozpor voľnej výšky s. 5 / 19; starší postup tlakového čistenia vs zákaz odporúčania v novšom návode s. 43. Novší šetrný postup je východiskom, nie univerzálny návod pre všetky dreviny.
- Gardin: úplné teplotné škáry, pevné body, štarty, konce, výmena a čistenie. UPM pravidlá sa na Gardin neprenášajú.
- Profix/JuAn/DILA/LIGO: presné generácie a kompletné okrajové prvky pre konkrétne skladové profily.
- ALU spoj: tvar a stena skladového profilu, rozpory HPM a konkrétny spoj; agresívne a bazénové prostredie.
- Statické údaje nosníkov, podpier, zaťaženia a podložia; individuálne prahy, izolácie a odtoky.
- Autorské fotografie, výkresy, staršie články a schválenie vydaní zodpovednou odbornou osobou. Dátum redakčnej kontroly nie je vydávaný za odborné schválenie.

## PDF a testovanie

PDF vznikajú v CI zo skutočnej webovej profesionálnej verzie, rovnakých dat a vlastných SVG. Každý manuál má stabilný download pod manuals/pod-povrchom-NN.pdf. Tlačový režim bez ovládacích prvkov, A4, titulná strana, obsah, kapitoly, tabuľky, postup, protokol, zdroje. Odkazy smerujú na verejný web, nie localhost.

Výsledky konkrétneho behu sa zaznamenávajú do QA reportov; mobilný WebKit je emulácia Safari, nie test fyzického iPhonu. Neúspešné alebo nespustené testy sa neoznačujú ako hotové.
