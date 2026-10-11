import { productCatalog } from '../commerce/catalog';
import type { Chapter } from './manual';

export type DetailKind = 'assembly'|'orientation'|'joint'|'head'|'end'|'air'|'frame'|'grain';
export type Lesson = Omit<Chapter,'diagram'> & {diagram?:DetailKind};
export type Publication = {id:string;slug:string;title:string;intro:string;categories:string[];chapters:Lesson[];steps:string[];checks:string[];pending:string[]};
export const edition='2026-10-11.2';
export const refs={
 jaf:'JAF HOLZ, Terasy 2026, fyzické PDF s. 6–8 a 27 (tlačené 52–53).',
 thermo:'JAF HOLZ, Terasy 2026, PDF s. 4–5; Lunawood, návod 2023, s. 23–30.',
 luna:'Lunawood, návod 2023, s. 5, 19, 23–30, 33, 41 a 43–44; Pokyny pre odborníkov, nedatované, s. 2–4.',
 wpc:'JAF HOLZ, Terasy 2026, PDF s. 13–14 a 25; UPM ProFi, montážny text, vydanie neurčené, s. 2–4. UPM je iba porovnávacia referencia.',
 hpm:'HPM TEC, katalóg RAPI-TEC 08/2026, s. 3–5, 7, 10–12, 16, 18–19 a 47. Presné obmedzenia: register konfigurátora.',
 wood:'USDA Forest Products Laboratory, Wood Handbook FPL-GTR-282 (2021), kapitola 4, s. 4–7 až 4–9: smerové zosychanie. https://research.fs.usda.gov/download/treesearch/62243.pdf',
 owner:'Pozorovanie majiteľa Drevené terasy poskytnuté pre akadémiu, 2026. Nie kontrolovaná skúška ani všeobecná vlastnosť dreviny.',
 project:'Redakčná syntéza montážnej kontroly na základe JAF 2026, PDF s. 27 a Lunawood 2023, s. 19, 23–30. Konkrétne zaťaženie, podložie a detaily určuje projekt.'
};
const lesson=(id:string,title:string,lead:string,basic:string[],pro:string[],evidence:string[],diagram?:DetailKind):Lesson=>({id,title,lead,basic,pro,evidence,diagram});
export const publications:Publication[]=[
 {id:'01',slug:'01-exoticke-drevo',title:'Masívne exotické drevo',intro:'Ipé. Cumaru. Garapa. Bangkirai. Najskôr posúďte dosku, potom navrhnite spoj.',categories:['massive'],chapters:[
 lesson('vyber','01 / Drevina nie je celý výrobok','Rozhoduje konkrétny profil, rozmer, kvalita dodávky a podmienky použitia.',[
 'Ipé, Cumaru, Garapa a Bangkirai sú v katalógu samostatné dreviny. Názov exotické drevo neoprávňuje použiť rovnaký raster, škáru alebo skrutku. Pri prevzatí porovnajte artikel a rozmery s objednávkou, skontrolujte čelá, plochy, zakrivenie a poškodenie pri doprave.',
 'Rozložte dosky nanečisto. Farebné rozdiely rozmiestnite vedome a s odsúhlasením zákazníka. Dosku s poškodeným koncom možno skrátiť len vtedy, keď zostane správna podpora a kotvenie. Trhlinu alebo uvoľnené vlákno v pochôdznej ploche neukrývajte náterom.',
 'Zmerajte vlhkosť metódou vhodnou pre danú drevinu. Šírku škár nemožno zvoliť iba podľa fotografie hotovej terasy. Mokrá a suchá doska majú odlišný priestor pre ďalší pohyb.'
 ],['Triedu kvality, tolerancie, prípustné vady a identitu dreviny potvrďte v dodacích podmienkach. Ak dokumentácia neposkytuje limity, manuál ich nenahrádza vlastnými číslami. Reklamované kusy označte a zdokumentujte pred opracovaním.','Porovnávacia tabuľka nižšie používa výhradne presné varianty zo spoločného registra. Pri nepriradenom variante zostáva rozstup neoverený.'],[refs.jaf]),
 lesson('rez','02 / Čo prezradí čelo dosky','Letokruhy opisujú rez. Samy osebe nerozhodnú o vhodnosti celej dosky.',[
 'Pri radiálnom reze prebieha široká plocha približne v radiálnom smere kmeňa; pri tangenciálnom približne po dotyčnici k letokruhom. Bežné rezivo obsahuje aj prechodné orientácie. Pozrite čelo aj priebeh vlákien na ploche.',
 'Drevo pri zmene vlhkosti pracuje rozdielne v jednotlivých smeroch. Tangenciálna zmena býva väčšia než radiálna; nerovnomerné zosychanie môže prispieť ku korýtkovaniu. Tento princíp nie je dôkazom, že každá tangenciálna doska bude chybná.',
 'Majiteľ pri niektorých doskách Cumaru pozoroval výraznejšie lokálne zdvíhanie vlákien a triesky. Ide o praktickú skúsenosť s konkrétnymi doskami, nie o hodnotenie všetkého Cumaru alebo všetkých tangenciálnych rezov. Pri výbere preto kontrolujte súdržnosť povrchu a bezpečnosť pochôdznej plochy.'
 ],['Príčinu vady určujte podľa konkrétneho kusu, vlhkosti, orientácie vlákien, opracovania a prevádzky. Bez vzoriek a dokumentácie nemožno spätne potvrdiť príčinnú súvislosť. Pri uvoľnených vláknach zvoľte odbornú opravu alebo výmenu; nesľubujte trvalé vyriešenie samotným olejom.'],[refs.wood,refs.owner],'grain'),
 lesson('rost','03 / Rám a čelné spoje','Každý koniec potrebuje podporu a miesto pre spoj.',[
 'Nosníky veďte kolmo na dosky. Raster stanovte podľa presného artikla v tabuľke. Rozstup nosníkov pod doskou nie je rozpätie nosníka medzi terčmi; jeho únosnosť sa overuje osobitne.',
 'Napojenia dosiek plánujte pred nárezom. Dve samostatné podpory čiel umožnia kotviť mimo koncov a odviesť vodu medzi nosníkmi. Konkrétny odstup a presah musia vychádzať z predpisu vybraného systému.',
 'Drevený aj hliníkový rám potrebuje voľný odtok a odvetranie. Pri lepených hranoloch rešpektujte orientáciu lamiel podľa výrobcu. Hranol naležato nie je univerzálne zakázaný.'
 ],['Široká styčná plocha bez oddelenia môže udržiavať vlhkosť. Prierezy, uloženie a podpery treba posúdiť aj staticky. Schéma skladby je principiálna, bez číselného návrhu nosnosti.'],[refs.jaf],'assembly'),
 lesson('spoj','04 / Kotvenie a opracovanie','Vhodnosť skrutky určuje doska, rošt aj prostredie.',[
 'Predvŕtanie, odstupy a zapustenie hlavy posudzujte spolu. Hlava nemá vytvoriť hlbokú jamku pre vodu. Tvrdé drevo nekotvite nadmerným momentom namiesto prípravy otvoru.',
 'HPM pri Cumaru a Garape smeruje výber k A4. Pri Ipé a Bangkirai uvádza pri oceli C podmienky závislé aj od pôvodu. Nevyvodzujte vhodnosť skrutky iba z tvrdosti dreva. Pri bazéne je potrebné samostatné posúdenie agresivity.',
 'Pri rezaní používajte ostrý vhodný nástroj, podoprite kus a dodržte ochranu očí a dýchania podľa pracovného postupu. Rezné čelá ošetrujte iba prípravkom a postupom určeným pre daný materiál; olej na plochu nemusí byť prípravkom na čelá.'
 ],['Viditeľné kotvenie a bočná drážka pre klip nie sú zameniteľné. Presný klip, generácia, nosník a štartovací detail musia tvoriť overený systém. Pri rozpore návodu dosky a skrutky nepoužite iba benevolentnejšiu podmienku.'],[refs.jaf,refs.hpm],'head'),
 lesson('udrzba','05 / Vzhľad, voda a údržba','Náter je súčasť starostlivosti, nie náhrada konštrukcie.',[
 'Odstraňujte lístie a nečistoty zo škár a odtokov. Sledujte uvoľnené spoje, triesky a mokré styky. Pri riziku poranenia dotknutú časť nepoužívajte, kým sa porucha neodstráni.',
 'Pred čistením alebo olejovaním identifikujte pôvodný náter a stav povrchu. Skúška na malej nenápadnej ploche odhalí nežiaduce farebné zmeny. Neuvádzame univerzálny tlak čističa, koncentráciu chémie ani interval olejovania.',
 'Výtok z dreva nesmerujte na citlivé svetlé povrchy bez vyriešeného odvodu. Pri škvrnách najprv určite zdroj: výluh, kovové nečistoty, náter alebo biologické znečistenie vyžadujú odlišný zásah.'
 ],['Od dodávateľa vyžiadajte aktuálny údržbový predpis presnej dreviny a povrchovej úpravy. Záruky na farbu, životnosť a beztrieskovosť bez podkladov nemožno doplniť.'],[refs.jaf,refs.hpm])
 ],steps:['Prevezmite a označte presné artikle; oddeľte poškodené kusy.','Zmerajte pôdorys, výšky a vlhkosť; odsúhlaste rozloženie dosiek.','Overte rám, podpory, odvetranie a napojenia.','Pripravte nárez a čelá podľa výrobcu.','Predvŕtajte a kotvite s kontrolou odstupov a hláv.','Skontrolujte škáry, odtok, povrch a odovzdajte plán údržby.'],checks:['Skontrolovaná kvalita a vlhkosť dodávky.','Odsúhlasené farebné rozloženie a pochôdzna strana.','Samostatne podopreté napojenia a správne skrutky.','Bez nebezpečných uvoľnených vlákien.'],pending:['Dodať triedenie a tolerancie konkrétnych dodávok.','Zdokumentovať vzorky Cumaru a okolnosti pozorovania majiteľa.','Potvrdiť údržbu, čelné ošetrenie a škáry pre konkrétne dreviny a vlhkosť.']},
 {id:'02',slug:'02-termodrevo',title:'Termodrevo',intro:'Tepelná úprava nemení každý profil na rovnaký montážny systém.',categories:['thermo'],chapters:[
 lesson('material','01 / Borovica a jaseň','Drevina, modifikácia a profil sú tri samostatné údaje.',[
 'Termoborovicu a termojaseň rozlišujte podľa presného artikla. Tepelná úprava znižuje rovnovážnu vlhkosť a mení správanie dreva, neodstraňuje však potrebu odvodnenia a správneho kotvenia. Údaje Lunawood neprenášajte na ľubovoľný tepelne upravený jaseň.',
 'Pri preberaní chráňte hrany a drážky. Kontrolujte trhliny, lokálne poškodenie a profil pre klipy. Dosku nepoužívajte ako páku pri narovnávaní. So zmenenou krehkosťou treba počítať pri manipulácii a opracovaní.',
 'Lunawood v pokynoch pre odborníkov určuje pohľadovú stranu borovice smerom k dreni; tento pokyn neplatí automaticky pre jaseň alebo inú značku. Pred montážou overte označenie konkrétneho profilu.'
 ],['Konkrétne rozstupy termoborovice a termojaseňa sú v tabuľke priradené podľa SKU, hrúbky, profilu a dĺžky. Trieda B bez jednoznačného priradenia nemá automaticky rovnaké schválenie ako trieda A.'],[refs.thermo,refs.luna]),
 lesson('system','02 / Profix je systém','Drážka, klip, skrutka a nosník musia byť kompatibilné.',[
 'Pri skrytom kotvení identifikujte generáciu Profix a tvar drážky. Rôzne generácie, Profix pre iný profil a JuAn nemožno považovať za rovnocenné náhradné diely.',
 'Pred začiatkom musí byť vyriešený prvý a posledný rad, čelné napojenie, okraj pri stene a prípadná výmena dosky. Bez doložených systémových prvkov nie je zoznam bežných klipov kompletnou montážnou sadou.',
 'Viditeľné kotvenie vyžaduje prípravu otvoru a kontrolu hlavy. Nespoliehajte sa na to, že samozávrtná špička nahrádza predvŕtanie požadované výrobcom dosky.'
 ],['Register označuje neúplné štartovacie a koncové detaily na kontrolu. Katalógová kompatibilita drážky nie je dôkazom úplnosti montážneho postupu. Pre skrutku do hliníka treba poznať aj stenu a tvar nosného profilu.'],[refs.thermo,refs.hpm]),
 lesson('detail','03 / Koniec dosky pod kontrolou','Doložený príklad Lunawood, nie univerzálne pravidlo termodreva.',[
 'Každé čelo sa kotví na svojej podpore. Medzera medzi nosníkmi zostáva priechodná pre vodu. Rozlišujte čelnú škáru dosiek, čistú medzeru hranolov a vzdialenosť skrutky od čela.',
 'Nižšie uvedený detail číta hodnoty pre konkrétny variant Lunawood zo spoločných pravidiel. Platí v rozsahu viditeľného kotvenia. Ostatné systémy musia mať vlastný detail.'
 ],['Dĺžka skrutky sa kontroluje spolu s doskou a dištanciou. Pri Lunawood sa do posúdenia zahŕňa celá pripájaná skladba podľa jeho návodu. Dostupná hĺbka nosníka môže obmedziť použiteľnú dĺžku.'],[refs.luna],'joint'),
 lesson('vetranie','04 / Priestor pre vzduch','Voľná výška a otvorené okraje patria k jednej skladbe.',[
 'Neuzavrite obvod terasy tak, aby sa pod doskami držala vlhkosť. Odstráňte prekážky na ceste vody a ponechajte prístup na čistenie. Nízkemu prahu prispôsobte celý detail, nie iba výšku terča.',
 'Návod Lunawood obsahuje odlišné údaje odvetrania v všeobecnej a podrobnej časti. Nižšiu hodnotu nemožno automaticky zvoliť ako výhodnejšiu. Rozpor je v registri označený na odborné potvrdenie.'
 ],['Projektant musí rozlíšiť celkovú výšku terasy, výšku nosníka a voľný vetrací priestor. Riešenie nad zeminou, betónom a hydroizoláciou sa posudzuje podľa konkrétnej situácie.'],[refs.luna],'air'),
 lesson('povrch','05 / Opracovanie a údržba','Chráňte povrch pri montáži aj pri čistení.',[
 'Podoprite dosku pri rezaní a nastavte nástroj tak, aby nedochádzalo k vytrhávaniu a otláčaniu. Lunawood upozorňuje na tlak podávacích valcov a na opatrnú manipuláciu. Prach odsávajte a používajte primerané ochranné pomôcky.',
 'Povrch vystavený počasiu mení farbu; pigmentovaná úprava je voľbou vzhľadu podľa predpisu náteru. Obnovu určujte podľa stavu, expozície a náterového systému, nie pevným sľubom na počet rokov.',
 'Staršie pokyny pripúšťajú opatrné tlakové čistenie, novší montážny návod ho neodporúča. Ako východisko zvoľte šetrné čistenie podľa aktuálneho pokynu pre dodaný výrobok; rozporný postup si nechajte potvrdiť.'
 ],['Údržbový list a montážny návod majú rôzne dátumy a rozsah. Zaznamenajte dokument, podľa ktorého sa bude terasa udržiavať. Nepreberajte všeobecné tvrdenia o certifikácii na konkrétnu dodávku bez dokladu.'],[refs.luna])
 ],steps:['Overte drevinu, profil a generáciu kotvenia.','Skontrolujte pohľadovú stranu a poškodenie.','Vyriešte výšku, odvetranie a raster podľa SKU.','Pripravte čelné podpory a kompletné okrajové prvky.','Predvŕtajte a montujte podľa predpisu profilu.','Odovzdajte údržbový plán s vyriešenými rozpormi.'],checks:['Presne určená generácia klipu.','Doložený štart a koniec každého radu.','Samostatné podpory čelných spojov.','Potvrdený vetrací detail.'],pending:['Potvrdiť rozpor odvetrania s. 5 / 19 Lunawood.','Doplniť úplné detaily Profix pre skladové profily a konkrétne nosníky.','Potvrdiť aktuálny postup čistenia dodanej terasy.']},
 {id:'03',slug:'03-wpc-terasy',title:'WPC terasy',intro:'Tepelný pohyb a systémové kotvenie. Jeden názov materiálu, viac technických riešení.',categories:['wpc'],chapters:[
 lesson('system','01 / Vyberte systém, nie iba farbu','Doska a jej príslušenstvo tvoria jeden výrobok v prevádzke.',[
 'Gardin Natur a Gardin Deco X majú vlastné rozmery, profily a limity. Ich osové rozstupy sa načítavajú z registra presných artiklov. Tvar a rozmery drážky rozhodujú o kompatibilite klipu.',
 'Z dodávky si uchovajte štítky a montážny návod. Identifikujte nosníky, klipy, štartovacie prvky, ukončenia a spôsob výmeny dosky. Rovnaký vzhľad klipu nie je dôkazom kompatibility.',
 'UPM je v podkladoch samostatný referenčný systém. Keďže nejde o dosky aktuálneho skladového programu, jeho teplotné tabuľky ani pevné body nepoužívame ako návod pre Gardin.'
 ],['Neoverené pravidlo je dôvodom doplniť dokumentáciu konkrétneho systému, nie použiť priemernú hodnotu z iného WPC. Sortiment ani ceny sa tým nerozširujú.'],[refs.wpc]),
 lesson('pohyb','02 / Kam sa môže doska pohnúť','Dilatácia potrebuje voľnú dráhu aj správne určený pevný bod.',[
 'Tepelná zmena dĺžky WPC sa rieši podľa výrobku, dĺžky a montážnych podmienok. Zaznamenajte teplotu pri montáži podľa návodu. Dlhá doska uzavretá medzi pevnými prekážkami môže pri zmene rozmeru tlačiť na okraje a spoje.',
 'Pevný bod určuje, odkiaľ sa pohyb rozdeľuje. Nemá sa svojvoľne nahradiť dotiahnutím všetkých klipov alebo skrutkou cez náhodné miesto. Montážny postup musí určiť polohu a typ fixácie.',
 'Pri stene, čelnom napojení a ukončení ponechajte systémový priestor. Neuvádzame univerzálnu škáru ani teplotný koeficient pre Gardin, pretože úplné podklady pre tieto detaily chýbajú.'
 ],['V UPM sa rieši stredový pevný bod a vlastné teplotné škáry. Táto informácia vysvetľuje princíp; nepredstavuje schválenie rovnakého bodu na inej doske.'],[refs.wpc]),
 lesson('nosnost','03 / WPC hranol nie je automaticky nosník','Raster dosiek nepreukazuje únosnosť vyvýšenej konštrukcie.',[
 'JAF pri Gardin upozorňuje, že WPC podkladové hranoly nie sú nosné konštrukčné prvky. Nevytvárajte z nich voľne premostený rám na vzdialených terčoch.',
 'Pre vyvýšenú terasu treba nosnú podkonštrukciu s doloženým uložením, rozpätím a spojmi. Aj hliníkový profil sa musí overiť pre konkrétne zaťaženie a kompatibilitu kotvenia.',
 'Pri otvoroch a čelných spojoch doplňte skutočné podpory koncov. Priemerný počet hranolov na m² nepreukazuje, že každá odrezaná doska má podporu.'
 ],['Únosnosť terča je iba časť reťazca: rozhoduje aj nosník, lokálny tlak do podkladu, stabilita a roznesenie síl. Chýbajúce údaje zostávajú v konfigurátore na odborné overenie.'],[refs.wpc],'frame'),
 lesson('voda','04 / Vetranie, voda a údržba','Kompozit nie je dôvod uzavrieť mokrú skladbu.',[
 'Ponechajte odtok, voľné škáry a servisný prístup. Ukončovací profil nesmie zablokovať pohyb ani odvod vody. Detail dutého a plného profilu sa môže líšiť.',
 'Odstráňte nečistoty a očistite skúšobnú plochu spôsobom povoleným výrobcom. Bez jeho súhlasu nebrúste ani neolejujte povrch WPC postupom pre drevo; môže sa zmeniť povrchová vrstva a vzhľad.',
 'Pri odovzdaní evidujte stav spojov, voľné dilatačné miesta a návod údržby. Bezúdržbovosť ani univerzálnu protišmykovosť nemožno sľúbiť bez konkrétnej skúšky a podmienok.'
 ],['Pred kompletnou montážou Gardin vyžiadajte aktuálny predpis pre teplotu, pevné body, moment klipov, ukončenia a čistenie. Neúplný register nie je kompletný realizačný návod.'],[refs.wpc],'air')
 ],steps:['Identifikujte dosku, klipy a generáciu systému.','Overte nosnú skladbu a pevný podklad.','Zaznamenajte montážne podmienky a systémové škáry.','Rozvrhnite podpory, napojenia a pevné body podľa návodu.','Namontujte štarty, rady a ukončenia bez blokovania pohybu.','Skontrolujte voľné škáry a odovzdajte údržbový predpis.'],checks:['Žiadne nepodložené premostenie WPC hranolov.','Klipy a okrajové prvky sú presne identifikované.','Teplotné škáry a pevné body potvrdené výrobcom.','Ukončenia neblokujú vodu ani pohyb.'],pending:['Doplniť aktuálne úplné návody Gardin Natur a Deco X.','Potvrdiť teplotné škáry, pevné body, štarty a konce.','Doplniť únosnosť vybranej nosnej skladby.']},
 {id:'05',slug:'05-kotvenie',title:'Kotvenie a spojovací materiál',intro:'Oceľ, geometria, podklad a prostredie musia vyhovovať súčasne.',categories:['fixings','accessories','aluminium'],chapters:[
 lesson('ocel','01 / Korózia a mechanika','Tvrdosť dreva sama nevyberie správnu oceľ.',[
 'Pri výbere posúďte dosku aj drevinu nosníka, vlhkosť, chemické látky a prostredie. A2, A4 a oceľ C nie sú len rôzne cenové úrovne rovnakej skrutky.',
 'TERASO a TERASO PLUS sa líšia materiálom a rozsahom použitia. PLUS je A4; výber nie je jednoduché delenie všetko ihličnaté / všetko exotické. HPM pri Cumaru, Garape a termodreve smeruje k A4, pri Ipé, Bangkirai či smrekovci uvádza pri C aj podmienené použitie.',
 'Bazén, chlór, soľ alebo agresívna atmosféra vyžadujú osobitné potvrdenie. Samotný nápis A4 nedáva univerzálny súhlas pre každú bazénovú konštrukciu.'
 ],['Použiteľnosť konkrétneho skladového artikla sa posudzuje v konfigurátore, nie podľa podobného výrobku z katalógu HPM. Technické referencie mimo sortimentu nemajú v e-shope cenu ani skladový status.'],[refs.hpm]),
 lesson('rozmer','02 / Priemer, dĺžka a závit','Dlhšia skrutka nemusí byť správne zvolená.',[
 'Dĺžka musí súčasne vyhovieť predpisu dosky, hrúbke dištancie, maximálnej pripájanej hrúbke a dostupnej hĺbke nosníka. Závit musí pracovať v podklade podľa určenia výrobku.',
 'HPM pri TERASO / PLUS rozlišuje terasové a pomocné spoje. Skladový vrut s priemerom 4 mm sa preto nesmie automaticky ponúknuť na kotvenie terasovej dosky iba preto, že má vhodnú dĺžku.',
 'Predvŕtanie nie je jediný univerzálny priemer. Rozlišujte otvor v doske, otvor v podklade a zahlbenie. Konkrétny predpis skrutky musí byť zlučiteľný s požiadavkou výrobcu dosky.'
 ],['Register obsahuje deväť presných skladových artiklov a kontroluje ich identitu a rozmery. Rozmerovo prípustný kandidát nie je staticky schválený spoj. Pri neznámom prostredí alebo podklade vyžaduje kontrolu.'],[refs.hpm]),
 lesson('drevo-alu','03 / Drevo a hliník','Zámena nosníka mení aj spoj.',[
 'Vrut do dreva a vrut do hliníka nie sú zameniteľné. Pri dreve treba hĺbku zakotvenia a dostupnú výšku; pri hliníku tvar profilu, hrúbku steny a postup vytvorenia otvoru.',
 'HPM pre ALU stanovuje osobitnú prípravu otvoru bez zahlbenia. V dokumente sú rozdielne podmienky rozsahu steny v texte a v tabuľke. Kým nie je doložený presný profil, automatický výber dĺžky nie je schválený.',
 'Dištančný prvok zväčšuje pripájanú hrúbku a ovplyvňuje vodu v styku. Použite prvok kompatibilný so spojom a zaťažením; nevkladajte náhodnú mäkkú podložku namiesto systémového prvku.'
 ],['Konfigurátor zachováva rozpor H/jekl a steny profilu na odborné potvrdenie. Hodnoty referenčného vrutu nemožno preniesť na iný artikel iba podľa označenia A4.'],[refs.hpm],'frame'),
 lesson('poloha','04 / Poloha a hlava skrutky','Správny vrut v nesprávnom mieste zostáva nesprávnym spojom.',[
 'Príliš blízke kotvenie pri čele môže vytvoriť trhlinu. Podporu umiestnite tak, aby zostal priestor pre predpísaný odstup, a otvor pripravte podľa výrobcu.',
 'Hlava má vyhovovať predpisu dosky. Príliš hlboké zapustenie poškodzuje okolie otvoru a vytvára miesto na vodu; vytŕčajúca hlava predstavuje riziko pri chôdzi. Dotiahnutie kontrolujte na skúšobnom spoji.',
 'Kótovaný detail nižšie je viazaný na konkrétne pravidlo Lunawood. Nie je predpisom pre všetky drevené alebo WPC dosky.'
 ],['Pri odlišných všeobecných a produktových odstupoch použite predpis konkrétneho výrobku. Nezameniteľná je vzdialenosť od čela, od boku a čistá medzera medzi nosníkmi.'],[refs.luna,refs.hpm],'end'),
 lesson('skryte','05 / Skryté kotvenie od prvého radu','Počet bežných klipov nie je kompletný kusovník.',[
 'Systémy Profix, DILA, JuAn, LIGO a UPM majú vlastné profily a podmienky. Potrebná je zhoda dosky, drážky, nosníka, skrutky a generácie prvkov.',
 'Overte štartovací a koncový rad, napojenie, ukončenie pri stene a demontáž. Ak tieto údaje chýbajú, nemožno tvrdiť, že montážna sada je kompletná.',
 'Spotrebu odvodzujte zo skutočných kontaktov dosiek a nosníkov. Viditeľné skrutky, bežné klipy, koncové prvky a pomocné skrutky majú odlišnú funkciu aj balenia.'
 ],['Výpočet nemá nahrádzať chýbajúce pravidlo koeficientom na m². Zaokrúhlenie na balenia sa uvádza samostatne od potrebných kusov. Skladom do vypredania zásob nie je potvrdená aktuálna dostupnosť.'],[refs.hpm,refs.thermo,refs.wpc],'head')
 ],steps:['Identifikujte presnú dosku, nosník a prostredie.','Overte oceľ a aplikačný rozsah konkrétneho vrutu.','Skontrolujte priemer, dĺžku, závit a dištanciu.','Pripravte skúšobný spoj s predvŕtaním.','Kontrolujte polohu a hĺbku každej hlavy.','Zdokumentujte artikle, balenia a nevyriešené systémové prvky.'],checks:['Oceľ vhodná pre drevinu aj prostredie.','Žiadny pomocný vrut zamieňaný za terasový.','Overené predvŕtanie a hĺbka nosníka.','Kompletné štarty a ukončenia skrytého systému.'],pending:['Potvrdiť ALU profil a rozpory predpisu HPM.','Doplniť kompletné okrajové prvky skrytých systémov.','Individuálne posúdiť bazén a agresívne prostredie.']},
 {id:'06',slug:'06-chyby-montaze',title:'Najčastejšie chyby pri montáži',intro:'Príznak na povrchu môže mať príčinu hlboko v konštrukcii.',categories:['joists','fixings','pedestals'],chapters:[],steps:['Zdokumentujte prejav poruchy a presný artikel.','Zistite priebeh vody, pohybu a prenosu síl.','Odkryte potrebný detail a porovnajte ho s predpisom.','Navrhnite opravu príčiny, nie iba prekrytie prejavu.','Overte skúšobný detail a bezpečnosť.','Zapíšte opravu, kontrolu a plán údržby.'],checks:['Určená príčina, nie iba viditeľný príznak.','Porovnaný skutočný detail s platným predpisom.','Nezamaskované poškodenie náterom.','Zdokumentovaná oprava a kontrola.'],pending:['Diagnostika konkrétnej poruchy vyžaduje obhliadku.','Autorské fotografie a výkresy budú doplnené samostatne.']}
];
const errors:[string,string,string,string,DetailKind?][]=[
 ['Orientácia hranola','Nevhodná poloha prierezu môže zväčšiť mokrý kontakt alebo zmeniť únosnosť.','Vlhkosť zostáva v styku; nevhodné rozpätie môže viesť k priehybu.','Overte orientáciu, lepené lamely, podopretie a odvodnenie. Naležato nie je všeobecne zakázané.','orientation'],
 ['Zadržaná voda','Nosník, podložka alebo uzavretý okraj prehradí odtok.','Dlhodobé vlhké styky a znečistenie sťažujú vysychanie.','Vyriešte priechodnú cestu k odtoku a servisný prístup; olej nenahradí konštrukčný detail.','air'],
 ['Dve čelá na jednom nosníku','Spoločná mokrá plocha a málo miesta pre odstupy skrutiek vytvárajú rizikový detail.','Môžu vzniknúť trhliny a zadržiavanie vody pri koncoch.','Podoprite každý koniec samostatne podľa systému. Iné riešenie musí byť konkrétne doložené.','joint'],
 ['Skrutky pri čele','Kotvenie bez potrebného odstupu a prípravy otvoru namáha koncovú časť dosky.','Vznik trhliny môže zhoršiť funkciu spoja a povrch.','Premiestnite podporu a dodržte predpis konkrétnej dosky; pri poškodení posúďte skrátenie alebo výmenu.','end'],
 ['Hlava príliš hlboko','Nadmerný moment vtlačí hlavu pod povrch a poškodí okolie otvoru.','Jamka zadržiava vodu; poškodenie nemožno považovať za správne dotiahnutie.','Nastavte montáž na skúšobnom spoji. Poškodený otvor posúďte, samotné povolenie skrutky nemusí napraviť poškodenie.','head'],
 ['Uzavreté odvetranie','Obvodové obklady alebo nízka skladba blokujú výmenu vzduchu.','Konštrukcia vysychá pomaly aj pri správnom lokálnom spoji.','Overte voľnú výšku a prúdenie podľa systému, vrátane výnimiek a rozporov návodov.'],
 ['Nesprávne dilatácie','Univerzálna škára ignoruje vlhkosť dreva alebo teplotný režim WPC.','Dosky môžu tlačiť na seba, okraje a kotvenie alebo vytvoriť nevhodné medzery.','Rozlišujte bočné, čelné a obvodové škáry; pri WPC overte pevné body a teplotu.'],
 ['Nevhodný spojovací materiál','Výber iba podľa ceny alebo dĺžky ignoruje oceľ, podklad a profil.','Hrozí korózia, nevhodné zakotvenie alebo nefunkčný systémový spoj.','Overte presný artikel, prostredie, závit, predvŕtanie a systémové príslušenstvo.'],
 ['Zlé triedenie a rozloženie dosiek','Montáž bez kontroly zakryje poškodené čelá alebo nevhodné plochy a vytvorí neplánované napojenia.','Objavia sa rizikové triesky, slabé konce alebo neodsúhlasená farebná kompozícia.','Dosky rozložte a skontrolujte pred montážou. Pozorovanie Cumaru neznamená univerzálnu chybu tangenciálneho rezu.','grain']
];
publications.find(p=>p.id==='06')!.chapters=errors.map((e,i)=>lesson('chyba-'+i,String(i+1).padStart(2,'0')+' / '+e[0],'Mechanizmus → následok → náprava.',['MECHANIZMUS / '+e[1],'MOŽNÝ NÁSLEDOK / '+e[2],'SPRÁVNY POSTUP / '+e[3]],['Pred opravou určte konkrétny výrobok a rozsah poškodenia. Schéma vysvetľuje princíp; nepredstavuje diagnózu každej podobne vyzerajúcej poruchy.'],[i===8?refs.owner:refs.project,...(i===7?[refs.hpm]:[])],e[4]));
export const manualPath=(id:string)=>'/pod-povrchom/'+(id==='04'?'04-podkonstrukcie':publications.find(p=>p.id===id)?.slug);
export const stockFor=(categories:string[])=>productCatalog.filter(p=>categories.includes(p.category));
