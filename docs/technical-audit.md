# Technický audit konfigurátora — 11. 10. 2026

Východisko: main 77e37f14b75b0d103463b5f22d7ab05fa471b641. React/TypeScript/Vite, hash routing a GitHub Pages. Samostatný backend má reálne objednávky a platby vypnuté.

## Zachované časti

- Autoritatívny skladový JSON, 137 artiklov / 83 detailov, 13 označení do vypredania; ceny a import cenníka sa nemenia.
- Katalóg, varianty, košík, routing, schválená domovská stránka, mobilná kompozícia.
- Existujúci polygonálny editor, otvory, numerické súradnice, dotyk, 2D/Three.js z rovnakého PlanResult.
- Starý demonštračný engine ostáva pre testy; nikdy sa nepoužíva ako náhrada chýbajúceho pravidla verejného produktu.

## Zistenia a zmena

Pôvodný skladový adaptér blokoval výrobný výpočet bez úplného montážneho profilu. Mal presné prieniky dosiek s pôdorysom, ale čelné dvojice nosníkov mali rozostup odvodený len od škáry dosiek. Chýbala čiastočná overiteľnosť, koncové zarovnanie skladových dosiek a samostatná evidencia technických zdrojov.

Pridávame samostatný verzovaný register SKU/profilov, deterministický predbežný materiálový výpočet, oddelené nosníky čelných spojov, zdrojované upozornenia a explicitné neznáme položky. Podpery sa bez statických údajov automaticky nenapočítajú. Obchodné dáta sa neprepisujú technickými metadátami.

## Podklady

Archív bol otvorený lokálne, obsahuje 11 PDF / 117 fyzických strán. Všetky strany boli vyrenderované; textové vrstvy a montážne schémy sú predmetom kontroly. Katalóg JAF obsahuje dvojstrany: v citáciách uvádzame fyzické číslo PDF. Cudzie PDF ani ich obrázky sa nenahrávajú do verejného webu.

Pravidlá, konflikty a obmedzenia sú v planner-rules.md. Výsledky skutočne spustených testov sa doplnia po implementácii.
