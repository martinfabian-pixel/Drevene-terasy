# POD POVRCHOM 3.0 — interaktívny sprievodca

## Zmena spôsobu používania

Úvodná stránka ponúka iba štyri ciele: vybrať drevo, postaviť terasu, vyhnúť sa chybám a otvoriť profesionálne podklady. Manuály a články sa na úvode nevypisujú. Sprievodca vykresľuje jeden krok, jednu dominantnú schému a najviac jeden hlavný spôsob jej ovládania. Zväčšenie je samostatná pomôcka na čítanie výkresu.

Šesť ciest obsahuje spolu 39 krokov: drevo (6), stavba (8), podkonštrukcia (6), kotvenie (6), WPC (4), chyby (9). Úplná technická knižnica obsahuje pôvodných šesť manuálov, desať článkov, osem technických detailov, register a PDF. Jej rozsah nie je súčasťou základnej navigácie krokom.

## Spoločné dáta a hranice

`src/academy/journeys.ts` obsahuje odkazy na kapitoly a odseky existujúcich `manual.ts`, `library.ts` a `editorial.ts`. Krátke vysvetlenie je výberom existujúceho textu; úplný text a zdroje sú v natívnom odbornom detaile. Dôležité obmedzenia sú viditeľné pred jeho otvorením. Nevzniká druhý register montážnych hodnôt.

Kótované schémy čelného spoja a polohy skrutky používajú spoločný príklad Lunawood 55987/0230. Rozsah použitia je viditeľný pri schéme. WPC je zobrazené neutrálne a označené ako princíp, nie schválený detail Gardin. Schéma pohybu nemá vymyslenú číselnú škáru. Porovnanie Cumaru/Ipé používa konkrétne skladové varianty zo spoločného katalógu; nie sú doplnené tvrdenia o životnosti ani rebríček drevín.

## URL, história a čitateľnosť

- Vstup: `#/pod-povrchom`.
- Knižnica: `#/pod-povrchom/kniznica`.
- Sprievodca: `#/pod-povrchom/sprievodca/podkonstrukcia?step=celne-spoje`.
- Pôvodné URL manuálov, článkov, detailov, katalógu a PDF zostávajú platné. Staré vstupné query `category`/`level` sa presmerujú do knižnice.
- Späť/Pokračovať zapisujú krok do histórie. Obnovenie a priamy odkaz zachovávajú tému a krok. Výber obsahu sa pri zmene kroku zavrie a focus sa presunie na aktuálny obsah.
- Statické HTML v `academy-guides/` poskytuje každý krok, celý súvisiaci text, upozornenia a zdroje bez JavaScriptu. Generuje sa z rovnakej vrstvy, má kanonické URL, textovú navigáciu a samostatný sitemap. `noscript` vstup smeruje na tento index. Ide o doplnok existujúceho HashRouter, nie zmenu routingu e-shopu.

## Overenie

`scripts/test-academy-guide.mjs` kontroluje dátové referencie a skutočne generované statické stránky. `scripts/qa-academy-guide-ci.mjs` kontroluje 39 krokov, päť používateľských scenárov A–E, históriu, obnovu, priame odkazy, schémy, focus, ovládanie klávesnicou, stránky bez JavaScriptu a PDF. Viewporty: 320, 375, 402 (WebKit), 430 a 1440 px. Pôvodná rozsiahla kontrola knižnice pokrýva aj 820 a 1920 px.

Screenshoty a reporty sú v `qa/ci-academy-guide` a v artefakte GitHub Actions. WebKit je emulácia; fyzický iPhone bez pripojenia nie je označený za otestovaný. Úspech konkrétneho behu potvrdzuje až stav Actions, nie tento dokument.

Pôvodné produktové dáta, ceny, skladové označenia, košík, plánovač, technické pravidlá a úplné PDF renderery sa nemenia. Existujúce neoverené pravidlá a rozpory zostávajú na odborné potvrdenie.
