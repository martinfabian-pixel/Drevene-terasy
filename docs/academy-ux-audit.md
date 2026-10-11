# POD POVRCHOM — UX audit a reorganizácia

## Stav pred úpravou

- Vstupná stránka súčasne zobrazovala dominantný manuál 04, šesť manuálov, desať článkov a rozsiahle predstavenie autora. Chýbala jasná voľba úrovne a kategórie.
- Manuály zobrazovali všetky kapitoly naraz. Obsah na mobile tvoril dlhý zoznam bez viditeľného aktuálneho kroku.
- Tabuľka 51 variantov dosiek so zdrojmi dominovala manuálu 04; ďalšie manuály opakovali jej podmnožiny.
- Zdroje a odborné odseky prerušovali praktický postup. Šesť prepínačov vrstiev bolo trvalo otvorených.
- Zväčšenie SVG iba vytvorilo vodorovný posuvník v malej oblasti. Súvisiace produkty boli prezentované ako množstvo samostatných rámčekov.

## Implementované zmeny

- Jedna knižnica a dve úrovne čítania; tri kategórie, vyhľadávanie v celom existujúcom texte s normalizáciou diakritiky a odkazom na zodpovedajúcu kapitolu, indexované URL.
- Obrazovkový čítač všetkých šiestich manuálov z pôvodných dát: kapitoly, montážny postup, protokol, výrobky, zdroje. URL `chapter` a `level` zachovajú výber a históriu.
- Navigácia kapitol na desktope; kompaktný výber a predchádzajúci/ďalší krok na mobile. Bez hromadného vykresľovania všetkých kapitol. Priamy odkaz otvorí a posunie na zodpovedajúcu kapitolu; montážny postup manuálu 04 je uvedený iba raz.
- Odborné detaily a zdroje sú rozbaliteľné. Podstatné obmedzenia a rozpory z odborných odsekov zostávajú viditeľné aj v základnom režime.
- Samostatný technický katalóg z `boardRows`/`technicalProfile`. Vyhľadávanie názvu, SKU, rozmeru, dreviny a systému; iba údaje pôvodného registra.
- Vybraný variant v manuáli, zdroje jednotlivých pravidiel, presný odkaz do plánovača. Katalógová cena sa nezamieňa za potvrdenú dostupnosť.
- Jednotné ovládanie SVG, rozbaliteľné vrstvy, zväčšenie do dialógu s dotykovým posunom, zoomom, Escape a návratom focusu.
- Články majú čitateľnú šírku, obsah a sekundárne zdroje; texty zostali zachované.
- Pôvodné úplné tlačové renderery ostávajú pod `?print=1`. Šesť PDF na pôvodných adresách obsahuje celý odborný text, tabuľky a protokoly.

## Ochrana dát a hranice

Žiadna zmena katalógu, cien, košíka, výpočtov ani technických pravidiel. Pôvodné dátové súbory manuálov a článkov sa nemenia. Nové schémy ani technické kóty nepribudli. Odborné schválenie a existujúce neoverené montážne detaily zostávajú otvorené.

## Kontrola

Automatizované scenáre v `scripts/qa-academy-ci.mjs`: 320, 375, 402 (WebKit), 430, 820, 1440, 1920 px; všetky manuály, články, SVG, zdroje, presné SKU odkazy, PDF a overflow. Výstup a screenshoty sú v artefakte GitHub Actions. WebKit je emulácia; fyzický iPhone sa bez pripojeného zariadenia nepovažuje za otestovaný.
