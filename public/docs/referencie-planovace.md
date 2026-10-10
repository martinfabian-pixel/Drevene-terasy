# Analýza plánovačov a kalkulátorov terás

Dátum prieskumu: 10. október 2026. Účel: ETAPA 0, návrh vlastného rozhrania; nejde o implementáciu výpočtového modulu.

Verejné stránky boli preskúmané cez webový nástroj a jeho indexovaný obsah. Dostupný nástroj na ovládanie prehliadača neponúkol žiadny prehliadač ani aplikáciu, preto neboli vykonané živé interakcie ani snímky mobilných obrazoviek. Označenie tlačidla alebo poľa v texte dokladá jeho prítomnosť, nie funkčnosť. Neboli odoslané dopyty, e-maily ani objednávky. Hodnotenie UX a navrhované zlepšenia sú naše dizajnérske závery z dostupných podkladov.

## 1. JAF HOLZ — Plánovač terás

Zdroj: [JAF plánovač terás](https://www.jafholz.sk/planovacteras#outline).

- **Dostupnosť:** Priamy pokus skončil odpoveďou HTTP 403 Forbidden. Vyhľadanie v oficiálnej doméne neposkytlo použiteľný opis aktuálneho plánovača. Staršie katalógy na iných doménach neboli použité ako dôkaz dnešného rozhrania.
- **UI a funkcie:** Aktuálne ovládanie, vizuálny vzhľad a jednotlivé kroky nebolo možné overiť.
- **Rozmery:** Počet polí, jednotky, voľné kreslenie a validácia neoverené.
- **Výpočet a výsledky:** Algoritmus, materiálový zoznam, nárezový plán, export a podmienky prístupu neoverené.
- **Silné/slabé stránky:** Bez prístupu nie je podklad na spoľahlivé hodnotenie.
- **Náš návrh:** Neskôr overiť s používateľom alebo prístupným verejným demom. Naše rozhranie musí mať viditeľné numerické rozmery, výber konkrétneho variantu, súpis predpokladov výpočtu a vysvetlenie chýb. Toto je požiadavka projektu, nie tvrdenie o nedostatku JAF.

## 2. ThermoWood Master — Terasový kalkulátor

Zdroj: [Terasový kalkulátor ThermoWood Master](https://thermowoodmaster.sk/terasovy-kalkulator/).

- **UI a funkcie:** Textová stránka v širšom produktovom webe obsahuje vysvetlenie, kontakty, montážne PDF a vložený kalkulátor cez iframe. Obsah iframe sa nepodarilo načítať.
- **Rozmery:** Sprievodný text žiada množstvo a rezervu; odporúča 5–10 %. Presné polia, rozmery a jednotky neoverené.
- **Výpočet:** Stránka deklaruje dosky/obklad, podklad, klipy alebo skrutky. Postup výpočtu a pravidlá konkrétnych profilov neoverené.
- **Výsledky:** Ceny sú deklarované ako informatívne, s DPH; presná ponuka sa žiada od dodávateľa. Aktuálny výstup iframe neoverený.
- **Silná stránka:** Prepojenie kompletného materiálu s montážnymi návodmi a jasné upozornenie na orientačný charakter.
- **Limit:** Verejný text nestačí na porovnanie vizuálneho rozhrania a geometrickej presnosti. Nefunkčnosť kalkulátora pre skutočného návštevníka z nášho obmedzeného prístupu nevyplýva.
- **Náš návrh:** Krokový panel s pôdorysom, rezervou vysvetlenou samostatne a vždy viditeľným materiálovým súpisom; návod priradený konkrétnemu variantu.

## 3. Woodplastic — Kalkulátor

Zdroj: [Woodplastic kalkulátor](https://kalkulator.woodplastic.cz/sk/).

- **UI/funkcie:** Číslovaný postup: tvar, rozmery, séria/povrch/profil/odtieň/pokládka, lišty, termín inštalácie. Štyri obrázkové voľby tvarov sú v obsahu; ich presný vzhľad nebol odfotografovaný.
- **Rozmery:** Numerické strany označené a–f, v metroch podľa vybraného pôdorysu.
- **Výpočet:** Výstup obsahuje plochu, dosky v bm a ks, odpad v bm a %, nosníky, štartovacie/štandardné/dvojité klipy. K dispozícii je rozpis rozmerov dosiek a nosníkov. Skutočný algoritmus nebol auditovaný.
- **Výsledky:** Oddelené nákresy pokládky a nosnej konštrukcie, detail kalkulácie a rozpis materiálu. Viditeľné predvyplnené čísla sú stav stránky, nie nami overený výpočet. Stránka označuje výpočet ako orientačný.
- **Silné stránky:** Prepojenie povrchu s podkonštrukciou a ukončením; vysvetliteľný podrobný rozpis, samostatný odpad.
- **Slabiny/limity:** Označenia a–f vyžadujú orientáciu v nákrese; dlhá konfiguračná štruktúra môže sťažovať priebežnú kontrolu. Mobilné rozloženie, vlastný pôdorys, zoom a 3D neoverené.
- **Náš návrh:** Rozmery zadávať priamo pri kótach aj v paneli. Výsledok ponechať vedľa editora; zvýrazniť zvolený profil a montážne predpoklady.

## 4. Terasové centrum / SVET DREVA — Kalkulácia

Zdroj: [Cenový porovnávač Terasové centrum](https://terasovecentrum.sk/kalkulacia/).

- **UI/funkcie:** Porovnáva celkové náklady materiálov počas zvolenej doby, obsahuje karty TERAFEST, duté WPC a drevené alternatívy. Dostupný obsah opisuje porovnanie investície a údržby, nie pôdorysný editor.
- **Rozmery:** Vstup plochy v m² a plánované roky používania. Polia dĺžky/šírky v načítanom obsahu nie sú.
- **Výpočet:** Náklady terasy, inštalácie/prepravy/príslušenstva, údržby, výmeny, ročný náklad a čas údržby. Použité ekonomické predpoklady ani presnosť neoverené.
- **Výsledky:** Paralelné materiálové karty s rozpisom nákladov. Počiatočné nuly nie sú vypočítaná ponuka.
- **Silná stránka:** Rozširuje rozhodovanie z obstarávacej ceny na dlhodobé vlastníctvo a starostlivosť.
- **Slabina:** Vstup m² neumožňuje v dostupnom obsahu overiť dosky, rezy a nosnú konštrukciu. Kategórie a východiská sú zvolené predajcom; bez ich vysvetlenia môže byť porovnanie jednostranné.
- **Náš návrh:** Voliteľný porovnávač údržby vedľa overeného materiálového súpisu. Zobraziť predpoklady, časový horizont a možnosti upraviť náklady; technické množstvá rátať z geometrie.

## 5. Liderwood — Kalkulačka terás

Zdroj: [Liderwood kalkulačka terás](https://liderwood.sk/kalkulator-terasy/).

- **UI/funkcie:** Postup plocha/tvar → doska → nosník → klipy → príslušenstvo → súhrn. Obsah ponúka rezervu, PDF, e-mail, odkaz a košík; tieto akcie neboli spustené.
- **Rozmery:** Plocha v m² alebo strany A–D v metroch, ovládanie plus/mínus. Presná práca s nepravidelným pôdorysom neoverená.
- **Výpočet:** Konkrétna séria, farba a dĺžka dosky; nosníky, klipy, terče a krycie lišty. Text pracuje s rozstupom 35 cm a upozorňuje na zdvojené nosníky pri spojoch. Výpočty označuje ako orientačné; rezerva +5 % je voľba.
- **Výsledky:** Tabuľka produkt/SKU/množstvo/cena/celkom a prenos materiálu do košíka.
- **Silné stránky:** Materiálový balík s doplniteľnými množstvami, vysvetlenie montážnych súvislostí, praktické zdieľanie.
- **Slabiny/limity:** Obsah mieša slovenčinu, češtinu a angličtinu. Správnosť rozstupu pre každý variant, optimalizácia odrezkov a geometrická vizualizácia neoverené.
- **Náš návrh:** Úplná slovenská lokalizácia; automatické množstvá oddeliť od ručných prídavkov. Rozstupy viazať na overené montážne pravidlá produktu, zmeny vysvetliť a zakresliť.

## 6. invoice24 / i24app — Výpočet terasových dosiek

Zdroj: [Výpočet terasových dosiek invoice24](https://i24app.com/sk/tools/kalkulacka-terasovych-dosiek).

- **Dostupnosť:** Priamy fetch zlyhal; dostupný bol indexovaný obsah tej istej stránky. Živé vykreslenie a reakcie formulára neoverené.
- **UI/funkcie:** Jednoduchý formulár, metrické/imperiálne jednotky, rozmery terasy a dosky, spôsob upevnenia, predvoľba šírky a percento odpadu. Sprievodca opisuje aj vlastnú cenu dosky.
- **Rozmery:** Dĺžka/šírka terasy a dĺžka/šírka jednej dosky, bez voľného pôdorysu v dostupnom obsahu.
- **Výpočet:** Plocha terasy s percentuálnou rezervou delená plochou dosky, zaokrúhlená nahor. Spoje sú odhadnuté všeobecnou sadzbou na m² podľa spôsobu kotvenia.
- **Výsledky:** Text deklaruje počet dosiek, kotvenie a materiálové náklady. Výsledok zadanej konfigurácie nebol odskúšaný.
- **Silná stránka:** Krátky formulár a verejne vysvetlený vzorec.
- **Slabina:** Plošný odhad nereprezentuje reálne rady, škáry, rozstupy podkonštrukcie ani podopreté čelné spoje; všeobecná sadzba kotvenia nie je pravidlo konkrétneho výrobcu.
- **Náš návrh:** Zachovať jednoduchosť prvého kroku, potom výpočet založiť na radení konkrétnych profilov a prienikoch dosiek/nosníkov. Orientačný výsledok jasne odlíšiť od technicky schváleného zoznamu.

## Závery pre dizajn ETAPY 0

1. **Krátky začiatok:** prvé ovládanie iba tvar, dĺžka, šírka a materiál; pokročilé nastavenia pod rozbaľovacím panelom.
2. **Presnosť viditeľná v rozhraní:** numerické kóty, jednotky pri každom vstupe, vrstvy dosiek/podkonštrukcie a vysvetlenie montážnych obmedzení.
3. **Priebežný výsledok:** vedľa pôdorysu súpis plochy, konkrétneho produktu, rezervy a položiek. Na mobile samostatná spodná lišta s otvorením súpisu.
4. **Dve cesty dokončenia:** materiálový balík pre vlastnú montáž alebo dopyt na realizáciu, odvodené od toho istého projektu.
5. **Pôvod výpočtu:** v budúcej implementácii ku každému pravidlu evidovať výrobcu, technický list, dátum kontroly a verziu. Pri chýbajúcom pravidle výpočet neoznačovať za overený.
6. **Ukážková ETAPA 0:** vizuálny pôdorys, numerické vstupy a 2D/3D prepínač môžu ukazovať UX. Hodnoty a vizualizácie musia byť označené ako demonštrácia; žiadny nákup, potvrdená technická kalkulácia alebo obchodná objednávka.

Neoverené prvky nie sú automaticky chybami konkurenčných stránok. Na ich zodpovedné posúdenie treba prístupné živé rozhranie a riadené skúšobné konfigurácie.
