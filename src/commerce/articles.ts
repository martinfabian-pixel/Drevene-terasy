export interface Article { id: string; title: string; topic: string; lead: string; sections: { title: string; text: string }[]; sources: { title: string; url: string }[] }
const luna = { title: 'Lunawood — montážny návod 2024', url: 'https://lunawood.com/wp-content/uploads/2024/04/Installation-Guide-for-Lunawood-Deckings_0424_ENG_WEB.pdf' };
const upm = { title: 'UPM ProFi — produktová a montážna dokumentácia', url: 'https://www.upmprofi.com/siteassets/documents/brochures/upm-profi-family-brochure-en.pdf' };
const sources = { luna, upm };
export const articles: Article[] = [
  { id: 'vyber-dosiek', title: 'Ako vybrať terasové dosky', topic: '01 / MATERIÁL', lead: 'Začnite miestom, spôsobom používania a montážnym systémom. Farba je iba jedna časť rozhodnutia.', sections: [
    { title: 'Posudzujte celý systém', text: 'Doska, nosný rošt, spojovací materiál a odvodnenie musia fungovať spolu. Dostupná dĺžka ovplyvní nárezy a napojenia. Pri výbere si vyžiadajte technický list konkrétneho profilu a aktuálny montážny návod.' },
    { title: 'Vzorka pred objednávkou', text: 'Prírodné drevo má rozdielnu kresbu a odtieň. Fotografia a vizualizácia nenahrádzajú skutočnú vzorku. Porovnajte povrch, komfort pri chôdzi, odporúčanú údržbu a spôsob výmeny poškodenej dosky.' },
  ], sources: [luna, upm] },
  { id: 'drevo-thermo-wpc', title: 'Masívne drevo, Thermowood alebo WPC?', topic: '02 / POROVNANIE', lead: 'Tri skupiny materiálov, rozdielne montážne pravidlá. Žiadna z nich nie je univerzálnou odpoveďou.', sections: [
    { title: 'Drevo a tepelne upravené drevo', text: 'Vzhľad aj správanie masívneho dreva závisia od dreviny a profilu. Pri Thermowood sledujte presnú triedu úpravy a odporúčania výrobcu. Tepelná úprava neznamená, že všetky profily môžu mať rovnaký rozstup roštu alebo kotvenie.' },
    { title: 'Kompozit nie je jeden výrobok', text: 'WPC dosky sa líšia zložením, profilom a ochrannou vrstvou. Rôzne systémy môžu mať rozdielne rozstupy, klipy aj pravidlá dilatácie. Ani kompozitná terasa neznamená nulovú potrebu čistenia.' },
  ], sources: [luna, upm] },
  { id: 'podklad', title: 'Podkladová konštrukcia bez kompromisov', topic: '03 / KONŠTRUKCIA', lead: 'Nosný rošt prenáša zaťaženie do podkladu. Musí zároveň umožniť odvetranie a odtok vody.', sections: [
    { title: 'Jedna premyslená nosná vrstva', text: 'Bežný ilustračný princíp je doska, kolmý rošt, podpera a stabilný podklad. Konkrétna skladba závisí od výšky, únosnosti podkladu a montážneho systému. Podloženie hliníkových profilov nemožno určiť iba podľa rozstupu terasových dosiek.' },
    { title: 'Oddeľte vodu od dreva', text: 'Zabráňte zadržiavaniu vody, sledujte odvetranie a kontakt jednotlivých prvkov. Výrobca môže požadovať separačné pásy medzi doskou a roštom. Betónový podklad, drenáž a statické riešenie posudzuje projektant alebo odborný montážnik.' },
  ], sources: [luna] },
  { id: 'rozstupy', title: 'Rozstup hranolov určuje konkrétny profil', topic: '04 / TECHNIKA', lead: 'Jedna univerzálna vzdialenosť pre drevo aj WPC by bola nesprávna.', sections: [
    { title: 'Hrúbka a systém rozhodujú', text: 'Overte osový rozstup nosných prvkov pre konkrétnu hrúbku dosky, spôsob kotvenia a využitie terasy. Hodnota pre obytnú terasu nemusí byť prípustná pre verejnú prevádzku alebo šikmé kladenie.' },
    { title: 'Každé napojenie potrebuje podporu', text: 'Konce napojených dosiek majú vlastnú oporu podľa návodu systému. Niekedy je potrebná dvojica rovnobežných hranolov v jednej nosnej vrstve. To je iné riešenie než viacnásobný krížový rošt. Plánovač bez overených pravidiel poskytuje iba demonštračný výpočet.' },
  ], sources: [luna, upm] },
  { id: 'kotvenie', title: 'Viditeľné skrutky a skryté klipy', topic: '05 / MONTÁŽ', lead: 'Kotvenie vyberajte spolu s doskou. Univerzálny klip nemusí byť kompatibilný s jej drážkou.', sections: [
    { title: 'Materiál spojovacieho prvku', text: 'Riaďte sa požadovanou koróznou odolnosťou a návodom výrobcu. Prostredie pri bazéne môže vyžadovať iný materiál než bežná záhrada. Pri dreve dodržte odporúčané predvŕtanie a vzdialenosti od okrajov.' },
    { title: 'Začiatok, koniec a napojenie', text: 'Prvé a posledné dosky, ukončenia a čelné spoje môžu vyžadovať odlišné prvky. Skryté kotvenie nesmie zabrániť predpísanému pohybu materiálu. Materiálový zoznam má obsahovať aj systémové skrutky a štartovacie prvky, ak ich systém vyžaduje.' },
  ], sources: [luna, upm] },
  { id: 'dilatacie', title: 'Dilatácie: miesto na pohyb materiálu', topic: '06 / DETAIL', lead: 'Škáry medzi doskami, pri stenách aj na koncoch sa určujú samostatne.', sections: [
    { title: 'Nezamieňajte bočnú a čelnú škáru', text: 'Rozmerové zmeny závisia od materiálu a prostredia. Pri WPC môže návod viazať čelné medzery na montážnu teplotu a dĺžku dosky. Drevo reaguje aj na vlhkosť. Použite presný aktuálny návod vybraného výrobku.' },
    { title: 'Pevné prekážky', text: 'Pri stene, stĺpe a obrube nechajte predpísaný odstup. Zohľadnite odvetranie a odvodnenie. Zmena medzery v plánovači je návrhový parameter, nie automatické schválenie montáže.' },
  ], sources: [luna, upm] },
  { id: 'udrzba', title: 'Údržba terasy v priebehu roka', topic: '07 / STAROSTLIVOSŤ', lead: 'Čistý povrch a voľný odtok vody sú základom starostlivosti o každú terasu.', sections: [
    { title: 'Pravidelné čistenie', text: 'Odstráňte lístie, nečistoty a usadeniny. Čistiaci prostriedok a spôsob použitia tlakovej vody vyberte podľa návodu výrobcu. Pri neznámom materiáli najskôr overte postup na malej nenápadnej ploche.' },
    { title: 'Náter je materiálovo špecifický', text: 'Olej môže pomôcť udržiavať požadovaný vzhľad vhodného dreveného povrchu, no interval obnovy závisí od expozície a náterového systému. WPC automaticky neošetrujte olejom na drevo. Výrobca UPM ProFi pre svoje dosky opisuje čistenie bez brúsenia, olejovania a lakovania; toto pravidlo nemožno preniesť na všetky výrobky.' },
  ], sources: [luna, upm] },
  { id: 'zivotnost', title: 'Čo ovplyvňuje životnosť terasy', topic: '08 / PREVÁDZKA', lead: 'Materiál, konštrukčný detail aj údržba. Samotný názov dreviny neposkytuje záruku životnosti celej terasy.', sections: [
    { title: 'Dlhodobé vysychanie', text: 'Zadržiavaná voda, obmedzené odvetranie a nevhodný podklad zvyšujú riziko porúch. Kontrolujte aj spoje, podpery a voľné odvodnenie. Rozsah kontroly prispôsobte používaniu terasy.' },
    { title: 'Záruka má podmienky', text: 'Deklarácie trvanlivosti a záruky sú viazané na konkrétny produkt a jeho podmienky. Pred nákupom si vyžiadajte záručné pravidlá, návod na údržbu a montáž. Na tejto stránke neuvádzame neoverený počet rokov životnosti.' },
  ], sources: [luna, upm] },
  { id: 'chyby', title: 'Najčastejšie chyby pri montáži', topic: '09 / KONTROLA', lead: 'Problémy často vznikajú v detailoch, ktoré po dokončení prestanú byť viditeľné.', sections: [
    { title: 'Kontrolný zoznam pred montážou', text: 'Overte únosnosť a drenáž podkladu, rovinu a rozstupy roštu, podporu čelných spojov, kompatibilitu klipov, potrebné škáry a odvetranie. Skontrolujte, či je materiál vhodne skladovaný a pripravený podľa návodu výrobcu.' },
    { title: 'Plán je podklad na konzultáciu', text: 'Výpočet množstva nenahrádza projekt nosnej konštrukcie. Nejasné napojenie, vysoká terasa, schody alebo verejné používanie vyžadujú odborný návrh. Neoverený systém objednávajte až po technickej kontrole.' },
  ], sources: [luna, upm] },
];
export { sources as articleSources };
