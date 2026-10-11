# Pravidlá plánovača — 2026-10-11.1

## Rozsah a dôveryhodnosť

Verejný výsledok je vždy **predbežný materiálový návrh, nie staticky overená realizačná dokumentácia**. Overený cenník neznamená overenú montáž ani aktuálnu skladovú zásobu. Register je oddelený od nezmeneného obchodného katalógu. Každá hodnota má status verified / requiresReview / unknown a dokument, fyzickú stranu PDF a rok, ak je známy.

Priradenie kontroluje presný artikel, ID detailu, šírku, hrúbku, dĺžku a profil voči sku-signatures.json. Iný rozmer alebo profil rovnakého čísla vypne pravidlo. Žiadne zoskupovanie pravidiel iba podľa názvu dreviny. Nejednoznačné SKU (napr. kvalita B termoborovice, niektoré dĺžky JuAn alebo garapy mimo technickej tabuľky) ostávajú unknown. Do nárezu vstupujú iba zhodné profily/farby s doloženým priradením.

## Konkrétne zdroje rozstupov

Číslovanie nižšie je fyzická strana PDF Terasy_2_2026_SK.pdf, rok 2026 (dvojstrany katalógu).

| Presný profil / rodina uvedených SKU | Osová vzdialenosť | PDF strana |
| --- | ---: | ---: |
| Cumaru 21 × 145, uvedené 55954/... | 400 mm | 7 |
| Ipé 21 × 140, 55973/7275 | 400 mm | 8 |
| Bangkirai 25 × 145, 55921/0305 a /0336 | 500 mm | 6 |
| Garapa 21 × 145, iba uvedené varianty | 400 mm | 7 |
| Smrekovec európsky 25 × 145, 55903/1330 | 500 mm | 9 |
| Douglaska 26 × 140, 55991/1942 a /1948 | 500 mm | 10 |
| Cancun Max 28 × 145, 55990/2640 | 600 mm | 11 |
| Termoborovica Profix 2, 26 × 117 / 140, priradené SKU kvality A | 450 mm | 4 |
| Termojaseň Profix 2 / JuAn, priradené SKU | 400 mm | 5 |
| Gardin Natur 23 × 146 | 350 mm | 14 |
| Gardin Deco X 22 × 145 | 400 mm | 13 |

Úplný konkrétny zoznam je v src/planner/technical/rules.ts. Hodnota z produktovej tabuľky nie je univerzálna vlastnosť dreviny. Všeobecný vzorec 20 × hrúbka sa nepoužíva namiesto produktovej tabuľky (napr. Cancun 600 vs. všeobecne 560 mm); konečnú aplikáciu treba potvrdiť pre zaťaženie.

## Lunawood 2023 — len priradená termoborovica

- PDF s. 6 určuje profily; s. 10–11 rozstupy a režim používania. Minimálne tri podpory dosky; príklady rozpätí nosného rámu sú výslovne orientačné. Prierezy 45 × 95 / 145 sa nesmú preniesť na skladové 42 × 68 ani 45 × 70.
- S. 23: čelné spoje na dvoch hranoloch, čistá medzera medzi nimi minimálne 50 mm. V modeli sa počíta vzdialenosť osí mínus polovice oboch šírok, nie škára dosiek.
- S. 26–30: bočná škára 6 mm, pri viditeľnom kotvení aj čelná 6 mm; skrutka aspoň 50 mm od čela a 20 mm od bočnej hrany. Predvŕtanie čiel povinné. Hlavy lícujú, max. 2 mm, pri povrchovej úprave max. 1 mm. Presah 36 mm sa meria od vonkajšej strany rámu, nie od osi.
- S. 28: dĺžka skrutky 2,5 × (hrúbka dosky + dištancia). Nedostatočne dlhá skladová skrutka sa nevyberie.
- S. 19: voľná medzera 50 mm nad nepriepustným podkladom, 100 mm nad zeminou. S. 5 žiada všeobecne 100 mm: rozpor evidujeme a neoznačujeme 50 mm za univerzálne schválené.
- S. 9 pripúšťa jednovrstvový rám pri obmedzenej výške, preferuje dvojúrovňový; tento konfigurátor modeluje jednu kolmú vrstvu s potrebou potvrdenia konkrétnej skladby. Nízka výška vedie na individuálne posúdenie.
- S. 26 požaduje konkrétne skrutky a kompatibilnú hlavicu Lunawood. JAF X/X2 nie sú automatickou licenciou na zámenu všetkých generácií Profix 2/Plus.
- S. 33: nezakryť odvetranie bokov; s. 35–37 fasáda, odvod vody, bazén a vymeniteľnosť. Pri bazéne samostatné upozornenie.

## JAF všeobecné a systémové detaily

- Katalóg s. 27 (tlačené 52–53): pri vlhkosti 16 % bočná škára najmenej 6 % šírky. Nákres 7 mm nemá prednosť pred touto podmienkou. Pri inej/neznámej vlhkosti sa hodnota nedopočítava vymysleným koeficientom.
- Text 2026 uvádza minimálnu výšku 40 mm; nedatovaný doporuceni pro pokladku SK.pdf uvádza 70 mm, obrázky obsahujú rozdielne dimenzie. Výška ostáva na odborné potvrdenie.
- Viditeľné kotvenie: dve skrutky na skutočný prienik doska/nosník, odstup od čela 50–100 mm, od boku 15 mm; predvŕtanie, lícujúca hlava. S. 22 pre drevo/drevo dopĺňa dištanciu k 2,5 × hrúbke. Zodpovedajúca dĺžka, vloženie do nosníka a A4 sa kontrolujú; pri rozpore produktového odporúčania so skladbou ostáva upozornenie.
- S. 27 lepené hranoly: orientovať lepený spoj vodorovne; niektorý profil sa kladie naplocho. Plocha styku nad 50 mm potrebuje konštrukčné oddelenie. Žiadny univerzálny zákaz plochého hranola. Statická únosnosť zmenenej orientácie nie je odvodená z rozmeru dosky.
- S. 22–24: Profix X/X2 len drevená podkonštrukcia, skrutka šikmo 45°. JuAn vyžaduje konkrétne spodné drážky a geometriu Stab. DILA pre doložené profily/dreviny, nie automaticky pre cumaru. Montáž 2021 je starší podklad, jeho hrubé m² koeficienty nie sú algoritmom.
- S. 25: Gardin LIGO S47, bočná medzera približne 5–6 mm. WPC hranol nie je nosný prvok vyvýšenej terasy. Zostavu WPC hranol + terče nemožno automaticky vypočítať ako nosný systém.
- S. 18: balenia X 200 ks, X2 100 ks, LIGO S47 80 ks, vybrané A4 skrutky 200 ks. Ide o technické balenie doplnené v BOM, nie prepis produktových údajov/ceny za balenie.
- montaz_demontaz_7_2020_SK.pdf s. 1–2: Profix montáž a výmena poškodeného dielu môžu vyžadovať rez a následný detail uchytenia; nesľubujeme univerzálnu beznástrojovú výmenu.

## UPM — oddelené od Gardin

UPM text s. 2 rozlišuje Piazza Pro / One / Deck 150 / Terra 127, použitie, rozpätia, tri podpory a dvojice s čistou medzerou 40 mm. S. 3–4 rozlišujú Wing/T klipy, 6 mm bočnú škáru, pevný bod uprostred a teplotne závislé čelné škáry. Schémy Part 1 s. 4–11 boli porovnané s textom; poznámky a výnimky pre Alu Rail, schody a odvetranie nie sú univerzálne.

Piazza technical s. 1–2: koeficient 4 × 10^-5 /°C, teplota materiálu. 4000 × 40 × 0,00004 = 6,4 mm; tabuľka má zaokrúhlené približné hodnoty. Materiálové skúšobné hodnoty výslovne nie sú určené na návrh statiky. Testovaná funkcia nie je aplikovaná na Gardin. V uzamknutom katalógu nie sú UPM terasové dosky, preto sa nepridávajú; UPM príslušenstvo sa automaticky nepriraďuje ku Gardin.

## Geometrická metodika

1. Jednoduchý polygon, otvory striktne vnútri, bez prekrývania či samopriesekov. Odstup od vonkajších aj vnútorných okrajov. Šikmý obrys ostáva vizuálny s explicitným obmedzením výroby.
2. Orientácia sa prevedie na spoločné súradnice. Prienik pásu konkrétnej dosky s polygonom zachová výrezy. Materiálový polotovar je obalová dĺžka × plná šírka; plocha odpadu z výrezov a pozdĺžneho zúženia je zvlášť.
3. Čelné delenie porovná rovnomerné diely a najdlhšie prípustné diely. Rozhodujú skutočné skladové dĺžky, zarovnanie oboch čiel a škára. Pri rovnosti preferuje dlhé diely s opätovne využiteľným zvyškom. Nasleduje best-fit balenie v troch deterministických poradiach. Je to heuristika, nie dôkaz globálneho optima.
4. Každá skladová doska má kontrolovateľnú rovnicu: dĺžka = súčet rezov + strata píly + zarovnanie čiel + zvyšok. Pri doreze na konci môže fyzický zvyšok byť užší než pílový kotúč; do straty sa účtuje len materiál, ktorý existuje. Rezerva zostáva celá, neorezaná.
5. Nosníky sú kolmé, koncové polohy povinné, medzery doplnené tak, aby neprekročili produktový limit. Dvojice sú samostatné. Kontroluje sa kolízia profilov, koncové podopretie, počet a rozstup podpôr. Pri výrezoch sa kontakt zisťuje z reálneho polygónu, nie iba zo stredu dosky.
6. Nosník sa reže z presného kompatibilného SKU. Ak je príliš dlhý a chýba predpis napojenia, jeho nákupné množstvo sa nevymyslí. Pedestaly sa bez overenej únosnosti/rozpätia nepočítajú.
7. Skrutky pri viditeľnom spoji: dva kusy na geometrický prienik, balenia nahor. Vnútorný Profix/LIGO klip: jeden na spoločnú škáru dvoch susediacich radov pri jednom nosníku. Začiatky, konce, odrezané drážky a presné skrutky sú samostatne na potvrdenie. JuAn a DILA nemajú v dodaných podkladoch úplné pravidlá na automatický počet všetkých dielov; nezamieňajú sa za hrubý koeficient.
8. Presné SKU sú prenesené do kusovníka a košíka. Jednotka balenia je bal, počet = ceil(potreba / obsah balenia). Cena ostáva cenníková s DPH. Súčet je len za vypočítané položky; neznáme položky nie sú zadarmo.

## Neoverené hranice a potrebné rozhodnutia

- Projektové zaťaženie, statické rozpätia/únosnosť konkrétnych nosníkov a Lifto, podložie, stabilita rámu, kotvenie do podkladu.
- Konkrétne montážne potvrdenie SKU s nejednoznačným priradením a rozdielnymi artiklami technického katalógu/cenníka.
- Gardin teplotná dilatácia, pevné body, okraje; klipy a skrutky pre presný podklad.
- Presný JuAn rozstup/krátenie Stab, DILA počet a skrutky, Profix generácia, štarty a konce.
- Rohové/ripované dosky, otvory, ukončenia, bazén, prahy, nízke výšky, odvetranie. Materiál sa dá vyčísliť, detail sa tým neschvaľuje.
- Prémiová/ekonomická skladba sa neoznačuje za prípustnú pred overením oboch. Alternatívne profily sú predbežné voľby s kontrolou kompatibility.

## Ďalšie prečítané zdroje

Lunawood údržba (3 s.) a Guideline for Professionals CZE (4 s.) slúžia na hranice použitia a budúci obsah. Rozpor v odporúčaní tlakovej vody sa nevyriešil publikovaním univerzálnej rady; novší terasový návod ju neodporúča. ADLER aplikačný list (1 s.) obsahuje pracovné a údržbové postupy vrátane zaobchádzania s olejovými handrami. Neodvodzujeme z neho spotrebu oleja bez výdatnosti konkrétneho výrobku. Žiadne odborné články teraz nepublikujeme.

Úplný zoznam 11 súborov, počty strán a SHA-256: technical-source-inventory.json. Originály, renderované schémy a plné texty nie sú súčasťou publikovaného repozitára.
