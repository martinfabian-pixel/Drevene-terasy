# Stav dokončenia plánovača — 11. 10. 2026

Nadväzuje na a780470, zachováva doplnok HPM TEC aj predchádzajúcu geometriu. Sortiment, ceny, import cenníka, objednávky a platby sa nemenia.

## Dokončené v tomto kroku

- Presný register všetkých 9 skladových terasových vrutov JAF: 55013/0277, /0569, /0148, /0155, /0107, /0109, /0290, /0291, /0134. Každý má rozmer, dĺžku závitu, balenie, predvŕtanie a dôvody vhodnosti/zamietnutia. Referencia HPM sa mapuje len na označenú rodinu Rapi-Tec a zhodný rozmer; nie na ľubovoľný A4 vrut.
- Automatický výber podľa ceny celých balení spomedzi rozmerovo prípustných variantov, alebo explicitný artikel. Nevhodný explicitný artikel sa ticho nenahradí iným.
- TOP 50/60/70 a ANTIK 60 sú posudzované vrátane závitu, dosky, dištancie a nosníka. 4 mm sú len pomocné. ALU 40 ostáva na potvrdenie steny a tvaru profilu.
- Kotvenie pri lokálnom výreze overuje zostávajúcu šírku skutočného kontaktu, nie iba menovitú šírku dosky.
- Skryté kotvenie zobrazuje vnútorné spoje a počet bočných okrajových polôh: 2 × prieniky mínus 2 × spoločné vnútorné škáry. Tieto polohy nie sú objednateľné štartovacie klipy.
- Porovnanie drevených a hliníkových kandidátov používa ten istý výpočtový model. Zobrazuje voľnú výšku, čiastkový súčet s DPH a prekážky. Žiadna skladba nemá potvrdenú statiku. Najlacnejší čiastkový súčet sa neoznačuje za cenu kompletnej terasy.
- Pri skrytom systéme je výška klipu explicitne neoverená; nemožno ju zameniť za nulovú. Nízka dostupná výška blokuje technické označenie skladby, nie zobrazenie pôdorysu.

## Overené podklady a zostávajúce hranice

JAF 2026 fyzické s. 18,22–25 a HPM 2026 s. 10–12,47; presné pravidlá a rozpory sú v planner-rules.md a rapitec-rules.md. Tiga je fasádny systém. UPM Piazza štartovací klip nemožno preniesť na Gardin. Profix X/X2 má spočítané vnútorné klipy, ale úplná generácia skrutiek a okrajový detail nie sú jednoznačne doložené. DILA/JuAn takisto nemajú v dostupných podkladoch uzavretý zoznam presných SKU všetkých prvkov. Preto žiadny neúplný skrytý systém neoznačujeme za kompletný.

NTP hodnoty únosnosti HPM sa nesmú preniesť na JAF Lifto. Chýbajú overené rozpätia a zaťaženia konkrétnych nosníkov, únosnosť základov a kotvenie. Počet podpier ostáva nevyčíslený. Porovnanie preto neposkytuje dve staticky schválené prémiové/ekonomické zostavy; zobrazuje dostupné kandidáty a dôvody, ktoré bránia schváleniu.

Od majiteľa alebo technika potrebujeme: montážny list presnej generácie Profix/LIGO/DILA/JuAn so štartmi/koncami a skrutkami; list hliníkového JAF profilu s hrúbkou steny a tvarom; tabuľky rozpätí nosníkov a terčov pre zaťaženie a podložie; potvrdenie rizikových expozícií a detailov nízkych terás.

## Reprodukovateľné kontroly

Cumaru 4 × 2,5 m: 176 prienikov, 352 skrutiek, dve balenia po 200. Auto vyberie TOP 60; explicitný ANTIK 60 zachová presný artikel aj v košíku. TOP 50 nevyhovie dĺžke, 4 mm nevytvorí nákupnú položku. Chlór nevytvorí automatické skladové kotvenie. Výška 30 mm v porovnaní neoznačí žiadnu skladbu za prípustnú.

Lokálne prešlo 21 nových kontrol, 30 HPM a 50+62+22+495 predchádzajúcich kontrol. CI spúšťa produkčný build, audit137/83, commerce/backend, Chromium, mobilné dotyky a WebKit. Fyzický Safari na iPhone nie je v tomto prostredí dostupný; automatizovaný WebKit nie je tvrdením o teste na reálnom telefóne.
