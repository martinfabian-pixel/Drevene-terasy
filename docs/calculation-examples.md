# Reprodukovateľné výpočtové príklady

Spustenie: npm run test:engine, modul scripts/test-technical.ts, export scenario(article, patch). Predvolené: 4000 × 2500 mm, smer X, výška 180 mm, bočná škára 9 mm, okraj 20 mm, čelná škára 6 mm, píla 3 mm, zarovnanie čiel 0, rezerva 0 %. Neoverené hodnoty sú predpoklady, nie montážne odporúčania.

| Príklad | Plocha m² | Diely dosiek | Nosníky | Nákup dosiek ks | Rošt bm | Využitie % |
|---|---:|---:|---:|---:|---:|---:|
|Obdĺžnik|10|16|11|16|27.005|99.748|
|L|6.25|16|12|16|18.96|92.318|
|Otvor|9.75|19|13|19|28.915|97.198|
|Otočenie|10|26|7|26|27.685|89.455|
|Čelné spoje|15|51|18|37|44.19|99.377|
|Nízka výška|10|20|10|20|24.58|94.286|

## Obdĺžnik

Artikel 55954/2183. Vstupný patch:

```json
{}
```

Kusovník: 55954/2397 — 16 ks; 55927/0275 — 11 ks; 55013/0291 — 2 bal.

Varovania: structural-review, profile-note-0, profile-note-1, moisture-review, assumed-gaps, drainage-review, ventilation-unknown, preliminary-only.

## L

Artikel 55954/2183. Vstupný patch:

```json
{
  "outline": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 4000,
      "y": 0
    },
    {
      "x": 4000,
      "y": 1000
    },
    {
      "x": 1500,
      "y": 1000
    },
    {
      "x": 1500,
      "y": 2500
    },
    {
      "x": 0,
      "y": 2500
    }
  ]
}
```

Kusovník: 55954/2183 — 9 ks; 55954/2397 — 7 ks; 55927/0275 — 9 ks; 55013/0291 — 2 bal.

Varovania: structural-review, profile-note-0, profile-note-1, moisture-review, assumed-gaps, drainage-review, ventilation-unknown, notched-board, preliminary-only.

## Otvor

Artikel 55954/2183. Vstupný patch:

```json
{
  "holes": [
    [
      {
        "x": 1500,
        "y": 900
      },
      {
        "x": 2000,
        "y": 900
      },
      {
        "x": 2000,
        "y": 1400
      },
      {
        "x": 1500,
        "y": 1400
      }
    ]
  ]
}
```

Kusovník: 55954/2183 — 3 ks; 55954/2214 — 3 ks; 55954/2397 — 13 ks; 55927/0275 — 12 ks; 55013/0291 — 2 bal.

Varovania: structural-review, profile-note-0, profile-note-1, moisture-review, assumed-gaps, drainage-review, ventilation-unknown, notched-board, preliminary-only.

## Otočenie

Artikel 55954/2183. Vstupný patch:

```json
{
  "orientation": "y"
}
```

Kusovník: 55954/2275 — 26 ks; 55927/0397 — 7 ks; 55013/0291 — 2 bal.

Varovania: structural-review, profile-note-0, profile-note-1, moisture-review, assumed-gaps, drainage-review, ventilation-unknown, preliminary-only.

## Čelné spoje

Artikel 55973/7275. Vstupný patch:

```json
{
  "outline": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 6000,
      "y": 0
    },
    {
      "x": 6000,
      "y": 2500
    },
    {
      "x": 0,
      "y": 2500
    }
  ]
}
```

Kusovník: 55973/7275 — 37 ks; 55927/0275 — 18 ks; 55013/0291 — 4 bal.

Varovania: structural-review, profile-note-0, profile-note-1, moisture-review, assumed-gaps, drainage-review, ventilation-unknown, preliminary-only.

## Nízka výška

Artikel 55978/0230. Vstupný patch:

```json
{
  "gapMm": 6,
  "heightMm": 40
}
```

Kusovník: 55978/0242 — 20 ks; 55982/0030 — 10 ks.

Varovania: structural-review, profile-note-0, profile-note-1, drainage-review, low-height, screw-review, preliminary-only.

## Ručná kontrola

- Obdĺžnik: 4 × 2,5 = 10 m². Dĺžka po okrajoch 3960 mm. 16 plných pásov 145 mm a 15 škár 9 mm zaberie 2455 mm z 2460 mm; zvyšných 5 mm je okrajový zvyšok. 16 × 3960 = 63 360 mm. Koncové osi 70 a 3930: 3860 / 400 → 10 intervalov, 11 nosníkov. 16 × 11 × 2 = 352 skrutiek → 2 balenia po 200.
- L: 4 × 1 + 1,5 × 1,5 = 6,25 m². Rohový výrez vytvára tvarovaný polotovar, ktorý potrebuje lokálny montážny detail.
- Otvor: 10 − 0,5 × 0,5 = 9,75 m². Plošný odpad výrezu sa neprezentuje ako využiteľná celá doska.
- Otočenie: čistá plocha zostane 10 m², mení sa počet radov a dĺžka každého dielu.
- Čelné spoje ipé: plocha 6 × 2,5 = 15 m²; 17 radov, každý 2750 + 6 + 2750 + 6 + 448 = 5960 mm. Potreba 34 celých dosiek a 17 krátkych dielov. Do ďalšej 2750 mm dosky sa zmestí 6 × 448 + 6 × 3 = 2706 mm, preto ďalšie 3 kusy; spolu 37 skladových kusov. Dva samostatné hranoly pri každom spoji.
- Nízka výška: 40 − 26 − 68 − 7 = −61 mm. Skladba sa fyzicky nezmestí; návrh žiada individuálne posúdenie alternatívy, neodmieta všeobecne terasu.

V každom prípade test kontroluje dĺžkovú bilanciu každého skladového kusu, presné SKU a ceny pochádzajúce zo zachovaného katalógu. Žiadny príklad nepotvrdzuje statickú únosnosť.
