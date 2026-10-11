import { productCatalog } from '../commerce/catalog';
import { technicalProfile, RULE_VERSION } from '../planner/technical/rules';

export const manualVersion = '04 / 2026-10-11.1';
export const reviewedOn = '11. 10. 2026';
export const manualRoute = '/pod-povrchom/04-podkonstrukcie';
export const manuals = [
 {id:'01',title:'Masívne exotické drevo',description:'Drevina, vlhkosť a pohyb materiálu.'},
 {id:'02',title:'Termodrevo',description:'Profily, odvetranie a montážne systémy.'},
 {id:'03',title:'WPC terasy',description:'Tepelný pohyb a systémová kompatibilita.'},
 {id:'04',title:'Podkonštrukcie drevených terás',description:'Od podkladu po detail čelného spoja.'},
 {id:'05',title:'Kotvenie a spojovací materiál',description:'Konkrétny spoj. Konkrétny predpis.'},
 {id:'06',title:'Najčastejšie chyby pri montáži',description:'Voda, podopretie a kritické detaily.'},
];
export const sources = [
 {id:'jaf',title:'JAF HOLZ — Terasy 2026',edition:'2026',pages:'4–14, 17–18, 22–27',note:'Terasy_2_2026_SK.pdf. Fyzické strany PDF; katalóg obsahuje dvojstrany. PDF 27 = tlačené 52–53.'},
 {id:'luna',title:'Lunawood — montáž drevených terás',edition:'2023',pages:'5, 9–11, 19, 23, 25–30, 33, 35–37, 41',note:'LUNAWOOD-navod-k-montazi-drevenych-teras-2023-CZ.pdf. Len pre zodpovedajúci výrobok a systém.'},
 {id:'jaf-sheet',title:'JAF — odporúčania pre pokládku',edition:'Nedatované',pages:'1',note:'doporuceni pro pokladku SK.pdf. Rozpor výšky s katalógom 2026 ostáva na potvrdenie.'},
 {id:'upm',title:'UPM ProFi — montážne predpisy a schémy',edition:'Vydanie v evidencii neurčené',pages:'Text 2–4; schémy 4–11',note:'upm-profi-decking-installation-instructions-en.pdf a upm-profi-decking-installation-images-en.pdf. Nepoužívať ako predpis pre Gardin.'},
 {id:'hpm',title:'HPM TEC — RAPI-TEC, nerezové vruty',edition:'08/2026',pages:'3–19 a 47',note:'2604-00021_Katalog_nerezove-vruty_08-2026.pdf. Technická referencia, nie rozšírenie sortimentu.'},
];
export type Chapter = {id:string; title:string; lead:string; basic:string[]; pro:string[]; evidence:string[]; diagram?:'assembly'|'orientation'|'joint'};
export const chapters: Chapter[] = [
 {id:'a',title:'01 / Podklad rozhoduje',lead:'Najskôr cesta vody a prenos zaťaženia. Až potom rozmer hranola.',basic:[
 'Zamerajte plochu, prahy, vpuste, obruby a miesta, kde sa môže voda uzavrieť. Zaznamenajte dostupnú výšku od nosného podkladu po hotový povrch. Hrúbka dosky nie je celá konštrukčná výška.',
 'Betón skontrolujte z hľadiska trhlín, nerovností, odvodnenia a možnosti kotvenia. Podpery nesmú vytvoriť hrádzu cez cestu vody. Sklon a skladbu odvodnenia určuje konkrétny projekt; tento manuál nepredpisuje univerzálny spád.',
 'Na zhutnenom podloží treba preveriť skladbu, sadanie, mráz a odtok. Voľne položená podpera na neoverenej zemine nie je preukázaný základ.',
 'Nad hydroizoláciou riešte roznášanie tlaku a chemickú kompatibilitu ochranných podložiek s výrobcom izolácie. Kotvenie nesmie svojvoľne porušiť vodotesnú vrstvu.',
 'Existujúci balkón, strecha alebo stará terasa vyžadujú posúdenie nosnej konštrukcie. Pri nízkom prahu môže byť vhodná iná skladba alebo individuálny detail; nízka výška sama osebe neznamená automatický zákaz terasy.'
 ],pro:[
 'Do protokolu zapíšte výškové body, polohu vpustí, smer odtoku, typ izolácie a údaje o podloží. Únosnosť, zaťaženie a stabilitu musí preveriť zodpovedný projektant; osová rozteč pod doskami túto kontrolu nenahrádza.',
 'Pri fasáde a prahu koordinujte odstupy, vetranie, odvodnenie a servisný prístup. Dilatáciu ani kotvenie nemožno odvodiť iba z hrúbky dosky. Bazénové prostredie mení aj požiadavky na koróznu odolnosť.'
 ],evidence:['JAF 2026, PDF s. 27; Lunawood 2023, s. 19 a 35–37. Existujúca konštrukcia a hydroizolácia: projektové posúdenie, bez univerzálneho číselného predpisu.'],diagram:'assembly'},
 {id:'b',title:'02 / Drevo alebo hliník',lead:'Dve cesty. Rovnaká požiadavka na overený detail.',basic:[
 'Hliníková podkonštrukcia je preferovaná prémiová voľba tam, kde vyhovuje systém dosiek, kotvenie, výška a nosný návrh. Presná geometria profilu uľahčuje kontrolu skladby. Hliník neodstraňuje potrebu odvodnenia, podopretia a dilatácie.',
 'Drevený rošt je legitímna ekonomická alternatíva. Vyberajte vhodnú drevinu a prierez, zabezpečte vysychanie a oddeľte kritické styky. Cena celku zahŕňa aj spoje, podpory a prácu; lacnejší hranol nemusí znamenať lacnejšiu terasu.',
 'Životnosť neurčuje jediný materiál. Rozhodujú vlhkostné podmienky, kontakt s vodou, použitie a údržba. Bez konkrétneho podkladu tu neuvádzame garantovaný počet rokov ani percentuálnu úsporu.'
 ],pro:[
 'Pre hliník overte geometriu a hrúbku steny, uloženie, prípustné rozpätie a predvŕtanie konkrétnej skrutky. Označenie „do hliníka“ samo osebe nepreukazuje vhodnosť spoja.',
 'Prémiovú a ekonomickú skladbu porovnávajte až po kontrole oboch. Konfigurátor rozlišuje čiastkovú cenu vypočítaných položiek od kompletnej ceny technicky schválenej skladby.',
 'WPC hranoly Gardin nie sú nosné konštrukčné prvky vyvýšenej terasy. Osová vzdialenosť pod doskami nie je povolenie uložiť tieto hranoly na vzdialené terče.'
 ],evidence:['JAF 2026, PDF s. 17, 22–25 a 27; HPM TEC 08/2026, s. 12 (konkrétny spoj do hliníka).']},
 {id:'c',title:'03 / Prierez má orientáciu',lead:'40 mm a 70 mm: príklad styčnej plochy, nie univerzálny recept.',basic:[
 'Užšia horná plocha spravidla zmenšuje oblasť kontaktu, v ktorej môže zostať voda. Schéma porovnáva ten istý modelový hranol 40 × 70 mm v dvoch polohách. Samotná šírka nedokazuje garantovanú životnosť.',
 'Hranol nastojato má inú výšku a statické správanie než naležato. Pri nízkej dostupnej výške môže byť poloha naležato opodstatnená, ak je overené podopretie, odvodnenie, styčná plocha a montážny predpis.',
 'Konštrukčné oddelenie dosky a hranola vytvára priestor pre odvod vody a vysychanie. Nesmie zmenšiť potrebnú opornú plochu ani zmeniť spoj bez posúdenia.'
 ],pro:[
 'Orientáciu nemožno meniť bez kontroly ohybovej tuhosti, únosnosti a uloženia. Modelový rozmer nie je návrhom skladového SKU ani výpočtom prípustného rozpätia.',
 'JAF opisuje špecifické požiadavky na lepené hranoly: lepený spoj má byť vodorovne; niektorý profil sa kladie naplocho. Pravidlo neprenášajte na každý hranol. Overte výrobné usporiadanie lamiel konkrétneho artikla.',
 'JAF pri styčnej ploche nad 50 mm požaduje konštrukčné oddelenie. To nenahrádza preverenie vody na hornej ploche a odvetrania celej skladby.'
 ],evidence:['JAF 2026, PDF s. 27 (tlačené s. 52–53). Rozmer 40 × 70 mm je výlučne ilustračný príklad.'],diagram:'orientation'},
 {id:'d',title:'04 / Dva konce. Dve podpory.',lead:'Čelný spoj potrebuje priestor na kotvenie aj odtok vody.',basic:[
 'Každý koniec napájanej dosky podoprite samostatne podľa systému výrobcu. Dvojica oddelených nosníkov umožňuje umiestniť kotvenie mimo oslabeného čela a ponechať cestu vode.',
 'Spoločný široký nosník môže vytvoriť mokrú styčnú plochu a zvádzať ku kotveniu príliš blízko čela. Taký detail je rizikový; nejde o univerzálny zákaz každého systémovo overeného spoločného uloženia.',
 'Prepínač ukazuje princíp rizika a doložené rozmery pre priradené dosky Lunawood pri viditeľnom kotvení. Na iné dreviny, skryté spoje alebo WPC tieto hodnoty automaticky neplatia.'
 ],pro:[
 'Čistá medzera medzi hranolmi sa meria medzi ich hranami, nie osami a nie medzi čelami dosiek. Odstup skrutky od čela a od bočnej hrany sú odlišné vzdialenosti.',
 'Predvŕtajte čelné otvory podľa predpisu. Hlava skrutky nemá vytvoriť nekontrolované hlboké miesto na vodu. Materiál, priemer, dĺžku a povrchovú úpravu posudzujte spoločne.',
 'Detail je vzdelávací výrez bez výpočtu statiky. Skryté systémy majú vlastné štartovacie, koncové a výmenné detaily. Profix X/X2, JuAn, DILA a LIGO nie sú vzájomne zameniteľné.'
 ],evidence:['Lunawood 2023, s. 23 a 26–30; JAF 2026, PDF s. 22–27. Číselné kóty sa načítavajú zo spoločného registra plánovača.'],diagram:'joint'},
 {id:'e',title:'05 / Nechajte skladbu vyschnúť',lead:'Dištancia je detail kontaktu. Odvetranie je vlastnosť celej terasy.',basic:[
 'Dištančný prvok oddeľuje dosku od roštu v oblasti spoja. Jeho hrúbka vstupuje do voľby skrutky a konštrukčnej výšky. Nezamieňajte ho s bočnou škárou medzi doskami.',
 'Voda musí odtiecť po podklade a vzduch musí mať prístup do skladby. Uzavreté čelá, zanesené medzery a prekážky pri vpusti môžu znehodnotiť aj správny lokálny spoj.',
 'Po montáži skontrolujte bočné otvory, miesta pri fasáde a možnosť čistenia. Ochranný olej nenahrádza konštrukčnú ochranu ani odvodnenie.'
 ],pro:[
 'Lunawood s. 19 rozlišuje voľný priestor nad nepriepustným podkladom a zeminou; všeobecná požiadavka s. 5 sa s nižšou hodnotou nezhoduje. Register zachováva rozpor ako „vyžaduje kontrolu“. Nižšia hodnota nie je automaticky schválená.',
 'JAF 2026 a nedatovaný pokladací list uvádzajú rozdielne minimálne výšky. Konkrétnu skladbu musí potvrdiť výrobca alebo projektant. Voľný vetrací priestor nie je celková výška od betónu po vrch dosky.',
 'Pri bazéne posúďte chemickú agresivitu a konkrétnu oceľ. A4 nie je univerzálny súhlas pre všetky chloridové prostredia. HPM TEC rozlišuje drevinu, prostredie aj konkrétnu skrutku.'
 ],evidence:['Lunawood 2023, s. 5, 19, 28, 33 a 35–37; JAF 2026, PDF s. 27; nedatovaný pokladací list, s. 1; HPM TEC 08/2026, s. 3–5 a 47.']},
 {id:'f',title:'06 / Tri rôzne vzdialenosti',lead:'Rozstup pod doskou ≠ rozpätie nosníka ≠ rozstup podpier.',basic:[
 'Tabuľka uvádza osovú vzdialenosť nosníkov pod konkrétnou doskou. Vychádza zo zhodného artikla, profilu a rozmeru v registri plánovača. Neznáme priradenia zostávajú výslovne neoverené.',
 'Rozpätie nosníka závisí od prierezu, orientácie, materiálu, uloženia a zaťaženia. Rozstup podpier sa navrhuje pre tento nosník a podklad. Nie je to rovnaká hodnota ako rozstup nosníkov pod doskou.',
 'Katalógová cena ani názov „skladový program“ nepotvrdzujú aktuálnu zásobu. Prechod do plánovača zachováva presný produktový variant.'
 ],pro:[
 'Tabuľka nie je statický návrh. Pre skladové nosníky a podpery nie sú doložené všetky potrebné rozpätia a únosnosti; manuál preto nevypočítava záväzný raster terčov.',
 'UPM má vlastné teplotné dilatácie, pevné body a podmienky podpier. Pravidlá nemožno preniesť na Gardin. Únosnosť terča iného výrobcu nemožno preniesť na JAF Lifto.',
 'Pri čelných spojoch kontrolujte aj samostatné uloženie koncov. Pri otvore je rozhodujúci skutočný kontakt, nie priemerná spotreba hranolov na meter štvorcový.'
 ],evidence:['Presný zdroj je pri každom artikli v tabuľke. JAF 2026, PDF s. 17 a 25; UPM montážny text, s. 2–4; HPM TEC 08/2026, s. 17 — údaje NTP neplatia pre Lifto.']},
 {id:'g',title:'07 / Montáž s kontrolou',lead:'Ďalší krok nasleduje až po kontrole predchádzajúceho.',basic:[
 '1. Zamerajte pôdorys, prekážky, otvory, výšky a odtoky. Vyberte presný artikel dosky a montážny predpis.',
 '2. Posúďte a pripravte podklad. Vyriešte nosnosť, stabilitu, hydroizoláciu a odvodnenie pred zakrytím.',
 '3. Navrhnite skladbu. Spočítajte dosku, dištanciu, výšku orientovaného nosníka a podpier. Overte odvetranie a napojenie pri prahu.',
 '4. Rozvrhnite kolmé nosníky podľa konkrétnej dosky. Vyhraďte podpory čelných spojov, okrajov a otvorov podľa projektu.',
 '5. Uložte a vyrovnajte rám na overených podporách. Skontrolujte cestu vody, stabilitu a servisný prístup.',
 '6. Pripravte dosky a predvŕtajte spoje podľa systému. Kontrolujte odstupy, dištanciu, dĺžku skrutiek a klipy.',
 '7. Montujte so zodpovedajúcimi škárami. Rešpektujte vlhkosť dreva alebo teplotu WPC; nepoužívajte univerzálnu škáru.',
 '8. Overte kotvenie, podopretie, odtok a odvetranie. Zdokumentujte artikle, výnimky, zakryté detaily a podmienky údržby.'
 ],pro:[
 'Prerušte montáž pri chýbajúcom rozhodujúcom pravidle alebo rozpore pokynov. Odborné potvrdenie archivujte s verziou výrobku a dokumentu. Orientačný konfigurátor nie je realizačná dokumentácia.',
 'Protokol musí obsahovať zodpovednú osobu, dátum, zistenia a odstránenie nedostatkov. Zaškrtnutie v akadémii samo osebe nepotvrdzuje odbornú revíziu.'
 ],evidence:['Syntéza postupu: JAF 2026, PDF s. 22–27; Lunawood 2023, s. 9–11, 19 a 23–33. Projektové posúdenie zostáva samostatné.']},
];
export const basicChecklist = ['Presný artikel, profil a platný predpis.','Zameraná výška, vpuste a smer odtoku.','Odborne posúdený podklad a nosná skladba.','Správne podpory čiel a odstupy kotvenia.','Voľné odvetranie a čistenie.','Skrutky zodpovedajú drevine, roštu a prostrediu.','Vyriešené neoverené detaily pred zakrytím.'];
export const proChecklist = ['Zdokumentované zaťaženie, rozpätia, uloženie a podpery.','Overená orientácia prierezu a lepených lamiel.','Ochrana hydroizolácie a lokálny tlak.','Škáry, vlhkosť dreva / teplota WPC, pevné body.','Generácie klipov, štarty, konce a predvŕtanie.','Fotografie rámu a čelných spojov pred zakrytím.','Odchýlky, schválenie zodpovednou osobou a údržba.'];
export const pending = ['Statika nosníkov a podpier, zaťaženie, podložie a stabilita rámu.','Rozpory odvetrania: Lunawood s. 5 / 19 a JAF 2026 / nedatovaný list.','Úplné štartovacie, koncové a výmenné detaily skrytých systémov.','Gardin: teplotné dilatácie, pevné body a systémové napojenia.','Prahy, bazén, hydroizolácia a neoverené artikle.','Nezávislá odborná revízia, meno a dátum schvaľujúcej osoby.'];
export const boardRows = productCatalog.filter(p=>['massive','thermo','wpc'].includes(p.category)).flatMap(product=>product.variants.map(variant=>({product,variant,rules:technicalProfile(product,variant)})));
export const lunaExample = boardRows.find(r=>r.variant.articleNumber==='55987/0230');
export const relatedProducts = ['joists','aluminium','fixings','pedestals'].flatMap(category=>productCatalog.filter(p=>p.category===category).slice(0,2));
export {RULE_VERSION};
