# Drevené terasy — návrh architektúry

ETAPA 0. Dokument popisuje budúcu architektúru; nepredstavuje súhlas s realizáciou ďalších etáp. Prítomné stránky sú dizajnové prototypy s demo obsahom.

## Informačná architektúra

| Navigácia | Účel | Budúci obsah a väzby |
| --- | --- | --- |
| Domov | Pochopiť ponuku a zvoliť ďalší krok. | NAVRHNI → NAKÚP → ZREALIZUJ, materiály, plánovač, služby, skutočné realizácie. |
| Terasové dosky | Výber materiálu a konkrétnej varianty. | Masívne drevo, tepelne upravené drevo a WPC; filtre, porovnanie, detail a technický list. |
| Príslušenstvo | Kompletná a kompatibilná skladba terasy. | Podkladové hranoly a profily, klipy a skrutky, terče a podložky, ukončenia, údržba, ostatné príslušenstvo. |
| Plánovač terasy | Navrhnúť terasu a zostaviť materiálový zoznam. | Pôdorys, presné rozmery, 2D/3D, produktové varianty, nárez a export. |
| Realizácie | Ukázať skutočnú prácu a vysvetliť realizáciu na kľúč. | Overené fotografie, detaily projektov, postup práce, dopyt s priloženým návrhom a fotografiami. |
| Poradňa | Pomôcť s výberom a technickými súvislosťami. | Dreviny, drevo/WPC, montáž, podklady a údržba; články s odborným schválením. |
| O nás | Predstaviť firmu a jej prístup. | Skutočné údaje o firme, tím a pracovný postup; bez vymyslenej histórie alebo ocenení. |
| Kontakt | Umožniť oslovenie firmy. | Overené kontakty, pôsobnosť, kontaktný/dopytový formulár. |
| Košík | Skontrolovať a objednať materiálový balík. | Položky, varianty, množstvá, DPH, doprava a bezpečný objednávkový proces. |

Plná navigácia môže na počítači zoskupiť katalóg do položiek Terasové dosky a Príslušenstvo. Na mobile bude dostupná z prehľadného menu; plánovač má byť prístupný aj z výrazného tlačidla. Označenie navigácie nesmie zamieňať galériu realizácií s formulárom na dopyt montáže.

## Dátový tok

```text
Overené dodávateľské údaje → Katalóg produktov a variantov
                                    ↓
Používateľský pôdorys → Project → výpočtový modul → MaterialCalculation
                         ↓                 ↓                ↓
                    2D editor          Nárezový plán    Materiálový zoznam
                         ↓                                  ↓
                    3D zobrazenie                   Košík alebo dopyt
                                                            ↓
                                                  Bezpečný backend
                                                            ↓
                                                   Admin / objednávky
```

2D aj 3D zobrazenie používajú rovnaký `Project`. Výpočet nečíta geometriu z grafických objektov; pracuje so zdrojovými dátami v mm. Zobrazenie produktu, geometria a montážne pravidlá sa nesmú stať troma nesúvisiacimi pravdami.

## Frontend v budúcich etapách

- React, TypeScript a Vite pre rozhranie a zostavenie aplikácie.
- React Router pre stránky; pri GitHub Pages musí smerovanie rešpektovať názov repozitára alebo používať hash smerovanie. Zdieľané odkazy musia fungovať aj po otvorení novej karty.
- Tailwind CSS a dizajnové tokeny zo schváleného konceptu; vizuálne komponenty, formuláre a prístupné stavové prvky oddelené od dátovej logiky.
- Zustand pre lokálny stav rozpracovaného projektu, vrstvy editora, históriu krokov a neskôr košík. Serverové ceny, skladové údaje a potvrdené objednávky ostanú pod správou backendu.
- Three.js / React Three Fiber pre 3D scénu. Lenivý import, instancované dosky, kontrola textúr a kvality podľa zariadenia, fallback na 2D, podpora `prefers-reduced-motion`.
- Samostatná dátová vrstva pre produkty a varianty, neskôr API adaptér. Demo údaje nesmú byť omylom importované ako predajný sortiment.
- GitHub Actions vykoná zostavenie, kontroly a nasadenie statického frontendu na GitHub Pages. Žiadne tajné kľúče vo Vite premenných dodávaných do klienta.

V ETAPE 0 stačia responzívne komponenty a vizuálne interakcie potrebné na schválenie. Košík, skutočný výpočet montáže, platby, administrácia a ostré formuláre sa zatiaľ neimplementujú.

## Samostatný výpočtový modul

Pripraviť neskôr čisté TypeScript funkcie pre geometriu pôdorysu, rozmery polí dosiek, nosnú konštrukciu, upevnenie, terče, nárezy a cenové zhrnutie. Ich vstupmi budú projekt, konkrétne produktové varianty a verzovaný montážny profil výrobcu. Výstupy budú vysvetliteľné a dohľadateľné podľa verzie pravidiel a algoritmu.

Začať obdĺžnikom. Testy musia neskôr pokryť hraničné rozmery, jednotky, škáry a dilatácie, podporu koncov, kompatibilitu klipov, balenia, dostupné výrobné dĺžky a absenciu ceny. Až potom rozširovať L, U a vlastné polygóny s výrezmi. Pri chýbajúcich pravidlách zobrazovať orientačný alebo neúplný výsledok a neprezentovať výstup ako technicky potvrdený.

Nárezový algoritmus musí zohľadniť rez, spojenie a podporu koncov; cieľ optimalizácie aj spotrebované dĺžky musia byť súčasťou výsledku. Jedna univerzálna rozteč alebo paušálna rezerva nenahrádza montážne pravidlá konkrétneho systému.

## Backend a objednávky

GitHub Pages poskytuje iba frontend. Samostatný backend bude neskôr držať produktové a cenové údaje, správu používateľských projektov, dopytov, médií a objednávok. Pri prijatí objednávky musí znovu overiť cenu, DPH, dostupnosť, varianty a množstvo nezávisle od klienta.

Platobná brána bude serverový adaptér so spracovaním overených webhookov a ochranou proti duplicitnému spracovaniu. Skutočné platby a obchodné operácie sa aktivujú až po osobitnom schválení a bezpečnej konfigurácii. Dopytové formuláre potrebujú serverovú validáciu, ochranu pred zneužitím a bezpečný proces nahrávania fotografií.

Právne texty, GDPR, spotrebiteľské informácie, reklamácie a obchodné podmienky sa pripravia v neskoršej fáze a označia na odborné schválenie. V tejto etape sa právna správnosť netvrdí.

## Návrh administrácie

V budúcnosti zvoliť administráciu alebo headless CMS podľa rozsahu dodávateľského importu a objednávok. Administrácia potrebuje oddelené oprávnenia, overenie používateľov, audit zmien, koncept/publikáciu obsahu a evidenciu pôvodu obrázkov.

Oblasti: produkty a varianty; ceny a ich platnosť; skladové údaje; fotografie a technické dokumenty; realizácie; články; objednávky; zákaznícke dopyty a priložené projekty. Zmeny montážnych pravidiel musia mať verziu a schválenie, aby sa dali spätne vysvetliť staršie výpočty.

V ETAPE 0 sa administrácia neprogramuje. Architektúra má dovoliť zmenu cien alebo fotografie bez zmeny prezentačného komponentu.

## Overenie obsahu a identity

Pri automatickej analýze sociálne profily neboli dostupné a všetky dodané JAF kategórie vrátili HTTP 403. Použité kategórie vyplývajú zo zadania. Existujúce logo, fotografické portfólio a aktuálny produktový obsah sa nepodarilo overiť.

Tri dizajny používajú pracovnú identitu a autorské konceptové vizualizácie. Produkty sú označené DEMO, cena sa nezadáva, dostupnosť sa netvrdí a technické parametre čakajú na overenie. Skutočné portfólio sa doplní len z fotografií s oprávnením na zverejnenie. Bez podkladov sa nepridávajú fiktívne referencie alebo zákaznícke hodnotenia.

## Schvaľovacie brány

1. Dokončiť ETAPU 0: tri prototypy, ich porovnanie a publikovanie. Zastaviť a počkať na výber používateľa.
2. ETAPA 1 až po výslovnom výbere: dopracovať finálny dizajn a pripomienky. Opäť zastaviť.
3. Implementačné etapy začať až po druhom výslovnom schválení dizajnu; objednávky a platby ostávajú predmetom ďalšej konfigurácie a schválenia.
