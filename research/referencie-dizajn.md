# Dizajnové a odborné referencie — Etapa 0

Dátum pozorovania: **10. október 2026**. Rozsah: iba analýza verejných primárnych stránok; nič sa na nich nemenilo.

## Metóda a hranice overenia

Všetkých päť zadaných stránok sa podarilo načítať nástrojom webového vyhľadávania v textovej podobe. To umožnilo overiť obsah, poradie tém, nadpisovú hierarchiu, odkazy, popisy fotografií a textovo sprístupnené formuláre. Nie je to vizuálny audit vykresleného webu. Pripojený prehliadač nebol dostupný; inventár počítačového nástroja neobsahoval žiadny prehliadač ani aplikáciu. Samostatné obrázkové URL vrátili chybu načítania. Priamy sieťový prístup shellu bol zablokovaný.

**Nemožno preto tvrdiť, že boli vizuálne overené konkrétne fonty, farebné hodnoty, rozmery medzier, animácie, prechody, mobilný layout alebo kontrast.** Prírodný a architektonický vizuálny smer sú požiadavky používateľa na nové koncepty. Pozorované obsahové princípy nižšie sú odlíšené od našich odporúčaní. Neuskutočnili sa objednávky, dopyty ani odoslania kontaktných údajov. Textové údaje z indexovaných stránok nemusia zachytiť najnovšiu zmenu stránky.

## 1. Betterwood — Terrassenholz

Primárny zdroj: [kategória terasového dreva](https://betterwood.de/terrassenholz/).

**Overené UI a obsah:** stránka prepája produktové skupiny, odbornú poradňu, plánovacie nástroje a galérie podľa dreviny. Po úvode nasledujú kategórie a katalóg. Filtre zahŕňajú druh produktu, materiál, farbu, dĺžku, šírku a hrúbku. Produktové zápisy uvádzajú dĺžky, certifikáciu, cenu od, DPH, hodnotenie a stručné výhody, nevýhody a odporúčanie. Ďalší obsah vysvetľuje pôvod dreva, podkonštrukciu a príslušenstvo; fotografie sú opísané ako produkty, realizácie a les. Presný vizuálny štýl textový výstup nepotvrdzuje.

**Funkcie, rozmery a výsledky:** samotná kategória poskytuje výber cez filtre, nie rozmerový editor. Vedie na samostatný kalkulátor a plánovač. Obchodný výsledok má podobu výberu konkrétneho produktu; rozloženie dosiek sa v tejto kategórii nezobrazuje.

**Naše hodnotenie:** silnou stránkou je spojenie nákupu s vysvetlením dôsledkov materiálovej voľby. Rozsiahla navigácia a veľa parametrov môžu zvýšiť rozhodovaciu záťaž; ide o odhad z obsahovej štruktúry, nie výsledok používateľského testu.

**Návrh pre Drevené terasy:** začať tromi zrozumiteľnými materiálovými rodinami. Pokročilé filtre rozbaliť až v katalógu. Pri každej karte pevne ukázať jednotku predaja a možnosť vložiť variant do návrhu. Obmedzenia materiálu prezentovať rovnako otvorene ako výhody. Certifikácie zobrazovať iba pri overenom produkte.

### Doplnkové overenie Betterwood — kalkulátor a plánovač

Primárne zdroje: [kalkulátor](https://betterwood.de/beratung/terrassenrechner/), [oficiálny opis doskového plánovača](https://betterwood.de/terrassenplaner/terrassendielen/), [aplikácia plánovača](https://planer.betterwood.de/).

Kalkulátor začína plochou v m² a výberom povrchu. Ďalej ponúka dosky, podkonštrukciu, upevnenie a údržbu. Výsledné položky sú v bežných metroch, kusoch a litroch; nasleduje odhad nákladov a možnosť žiadať presnejšiu ponuku. Zdroj výslovne opisuje odhad ako priemerné hodnoty bez zliav a dopravy. Správnosť algoritmu ani aktualizáciu výsledkov sa nepodarilo interaktívne otestovať.

Oficiálny opis plánovača deklaruje štandardný aj vlastný tvar, výrezy, zmenu dreviny, otočenie alebo diagonálne kladenie, vzor, podkonštrukciu a výšku. Deklaruje priebežný materiálový zoznam a cenu. Ide o funkcie opísané prevádzkovateľom; aplikácia v textovom prístupe vrátila požiadavku zapnúť JavaScript. Presné numerické zadávanie, ovládanie, 3D režim, export a optimalizácia algoritmu nie sú priamo overené.

**Návrh:** oddeliť rýchly odhad od technického projektu viditeľným označením presnosti. Rozmerový náhľad a materiálový súhrn udržať vedľa seba. Každý výsledok musí niesť predpoklady, jednotku a variant produktu. Pre náš prototyp ukázať tento vzťah bez predstierania hotového výpočtového jadra.

## 2. Plan Birke — Forsch voran

Primárne zdroje: [úvodná stránka](https://planbirke.fib-ev.de/index.html), [spoznanie brezy](https://planbirke.fib-ev.de/kennenlernen/index.html).

**Overené UI a obsah:** ide o vzdelávací projekt o breze. Úvod člení príbeh na spoznanie, zážitok, výskum a využitie, prepája články, udalosti a virtuálnu výstavu. Podstránka kombinuje krátke charakteristiky, vecný profil, obrazové popisy a rozšírené vysvetlenia. Hierarchia nadpisov je výrazne členená. Presný font, veľkosť nadpisov, farby, priestor medzi blokmi ani prechody nie sú vizuálne overené.

**Funkcie, rozmery, výpočet a výsledky:** na dostupných stránkach nebol nájdený terasový editor, zadávanie geometrie ani materiálová kalkulácia. Výsledkom je odborné poznanie prostredníctvom článkov. Odkaz na virtuálnu výstavu sa nepodarilo načítať, preto jej interaktivitu nemožno hodnotiť.

**Naše hodnotenie:** osobne formulované témy a obsahové kapitoly sú vhodným príkladom zrozumiteľnej prezentácie technickej látky. Pre obchod by samotný príbeh potreboval stále dostupnú konkrétnu akciu; ide o naše UX odporúčanie.

**Návrh pre koncept B:** architektonické kapitoly 01 Materiál, 02 Návrh, 03 Realizácia. Výrazná typografia, pokojný raster a technické kresby budú originálnym návrhom. Použiť krátke vysvetlenie v hlavnom toku a podrobnosti na vyžiadanie. Montážne pravidlá čerpať od výrobcu konkrétneho produktu, nie z tohto projektu o breze.

## 3. Holz vom Fach

Primárny zdroj: [domovská stránka portálu](https://holzvomfach.de/).

**Overené UI a obsah:** domov prezentuje sezónne témy, námety, abecedu drevín, znalostnú databázu a environmentálne články. Textový výstup obsahuje obrazové položky aj uvedenie autorov fotografií. Nadpisy a krátke perexy vedú na odborný obsah. Vyhľadávanie odborného predajcu používa poštové smerovacie číslo a tlačidlo vyhľadania. Dostupné je aj všeobecné obsahové vyhľadávanie. Vizuálny vzhľad, menu a správanie na mobile neboli overené.

**Rozmery, materiál a výsledky:** zadaná domovská stránka neobsahuje meranie terasy ani výpočet materiálu. Overený vstup PSČ slúži na hľadanie predajcu. Výsledkovú stránku tohto hľadania sme neotestovali; články a tematické odkazy sú dostupným výsledkom obsahovej navigácie.

**Naše hodnotenie:** poradenské témy reagujú na konkrétnu sezónnu potrebu. Široký záber portálu môže odvádzať od jednej nákupnej úlohy; to nie je potvrdená metrika správania.

**Návrh pre Drevené terasy:** poradňa má viesť k rozhodnutiu o drevine, údržbe alebo podklade. Na konci článku prepojiť súvisiaci materiál a plánovač s uchovaným výberom. Kľúčové rady ukázať tiež vedľa príslušného nastavenia plánovača. Použiť vlastné alebo oprávnene licencované fotografie s evidovaným pôvodom.

## 4. proHolz — Decke

Primárny zdroj: [tematická stránka stropných konštrukcií](https://www.proholz.at/bauen-mit-holz/bauteile/decke).

**Overené UI a obsah:** tematický úvod vedie na články o systémoch, konštrukciách, plánovaní a normách. Nasledujú objekty s lokalitou a rokom dokončenia, publikácie a externé odborné služby. Text sprístupňuje obrazy pri témach a objektoch. Navigácia je štruktúrovaná podľa zdroja dreva, stavebných procesov, častí stavby a stavebnej fyziky. Prítomný je odkaz na preskočenie k hlavnému obsahu. Presná typografia a obrazový raster neboli vizuálne overené.

**Funkcie, rozmery, výpočet a výsledky:** ide o odborný obsahový rozcestník. Na zadanej stránke sa nenachádza rozmerový formulár ani terasová kalkulácia. Výsledok je navigácia k znalostiam a príkladom, nie materiálový zoznam. Odkazovaný dataholz.eu je odborný katalóg stavebných častí; jeho výpočtové funkcie sa v tomto audite neoverovali.

**Naše hodnotenie:** prepájanie konštrukčného systému, článkov a pomenovaných realizovaných objektov podporuje technickú dôveryhodnosť. Rozsah tém môže byť pre maloobchodného zákazníka náročný.

**Návrh:** poradňu rozdeliť na jednoduché rozhodnutia a technické podklady. Pri realizácii neskôr uviesť iba skutočne známy materiál, miesto, rok a riešenie. Rovnakú schému „čo vidím / ako sa to montuje / technický list“ preniesť na produktový detail. Prototyp nesmie použité ilustračné priestory označovať ako vlastné realizácie.

## 5. DLH Slovakia — Drevené terasy

Primárny zdroj: [kategória drevených terás](https://www.dlhslovakia.sk/terasy/drevene-terasy/).

**Overené UI a obsah:** kategória je súčasťou širokého sortimentu. Rozlišuje exotické a ihličnaté dreviny, termo drevo, bambus, WPC aj montážne a údržbové doplnky. Produkty v dostupnom výstupe používajú názov, cenu a pri niektorých zľavu alebo výpredaj. Kategória má stránkovanie. Rozšírené vyhľadávanie ponúka značky, ale v textovej podobe aj možnosti vykurovania a použitia v kuchyni či kúpeľni. To poukazuje na spoločné filtre širšieho sortimentu; neoverilo sa, ktoré sú v konkrétnom zobrazení aktívne. Vzhľad a fotografie sa neoverili screenshotom.

**Rozmery, výpočet a výsledky:** kategória nemá nájdený rozmerový editor. Výsledkom je zoznam produktov. Pri zachytených cenách nie je priamo v textovom zápise karty vždy uvedená jednotka predaja, preto sa tieto ceny neprenášajú do našej dátovej vrstvy. Detail termo jasena sa nepodarilo otvoriť.

**Naše hodnotenie:** odborné delenie sortimentu a prítomnosť príslušenstva sú užitočné. Všeobecné filtre a nejasná jednotka v zachytenom zápise môžu sťažiť porovnanie; vizuálny audit by musel potvrdiť, či ide aj o skutočný problém rozhrania.

**Návrh:** filtre prispôsobiť terasám. Každú cenu zobraziť s DPH, jednotkou a variantom. Príslušenstvo viazať na montážny systém. V prototypoch použiť „Cena na vyžiadanie“ a označenie demo tam, kde chýbajú overené dodávateľské dáta.

## Prenos do troch návrhov — vlastné dizajnové rozhodnutia

Tieto odporúčania sú návrhom pre nový projekt, nie opisom neoverených vlastností referencií.

| Koncept | Prvý dojem | Katalóg a produkt | Plánovač |
|---|---|---|---|
| A — Premium Nature | Teplý svetlý podklad, prírodná fotografia, elegantný nadpis a dva jasné vstupy: návrh alebo materiál | Materiálový príbeh a veľké náhľady; technické údaje v pokojnej hierarchii | Jemné rozhranie, jasné číselné polia, stále viditeľný súhrn |
| B — Architectural Studio | Výrazná typografia, číslované kapitoly, architektonický raster, tenké kótovacie prvky | Editorialové prezentovanie materiálu s technickými prílohami | Pracovná plocha inšpirovaná jednoduchým CAD; presnosť komunikovaná jednotkami a vrstvami |
| C — Interactive Design Experience | Návrh terasy ako hlavný zážitok; priame prepnutie ilustračného 2D/3D pohľadu | Materiálové vzorky prepojené s náhľadom a zachovaným výberom | Zjednotený pracovný priestor so záložkami, numerickými rozmermi a materiálovým súhrnom |

Spoločné pravidlá: jednoznačne označený dizajnový prototyp; bez falošných hodnotení, obchodnej dostupnosti a cien; bez tvrdenia o technicky overenom výpočte. Výsledok budúcej kalkulácie musí obsahovať predpoklady a verziu montážnych pravidiel produktu. Obsahové fotografie referencií sa nepreberajú.

## Čo ešte doplniť pred finálnym dizajnom

- Vizuálny desktopový a mobilný audit dvoch hlavných referencií, ak bude dostupný prehliadač alebo screenshoty.
- Skutočné logo a vlastné realizácie značky, ak ich dodá používateľ alebo sú oprávnene sprístupnené.
- Interaktívny audit konkurentov s porovnaním identického zadania; tento dokument sám neoveruje ich matematiku.
- Montážne listy a variantové údaje hlavného dodávateľa. Kategorické marketingové tvrdenia nie sú výpočtovou špecifikáciou.

**Schvaľovacia hranica:** tento dokument je súčasťou Etapy 0. Nerozhoduje o výbere konceptu a neoprávňuje začať implementačnú etapu.
