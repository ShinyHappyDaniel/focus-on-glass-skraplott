# Focus on Glass – digital skraplott

Skiss på en digital skraplott för Fujifilms säljkampanj **Focus on Glass** (Fujifilm Retail Platform, säljare på Scandinavian Photo). Säljaren får en lott per registrerad försäljning av ett FUJIFILM-objektiv. Hen skrapar bort ett fält och får fram ett fyrsiffrigt lottnummer som är med i dragningen fredag 5 mars 2027.

Den här mappen är en fungerande prototyp i ren HTML/CSS/JS, utan byggsteg och beroenden. Öppna `index.html` i en webbläsare.

## Filer

| Fil | Innehåll |
| --- | --- |
| `index.html` | Markup för lotten |
| `styles.css` | All styling. Färger och typsnitt som CSS-variabler i `:root` |
| `scratch.js` | Skraplogiken (canvas), slumpnummer, demoknappen "Ny lott" |
| `assets/fujifilm-logo-white-red.svg` | FUJIFILM-logotyp, vit med röd i-prick. Endast på svart botten |
| `assets/focus-on-glass-white.svg` | Kampanjlogga Focus on Glass, vit, utan "Untold Stories"-etiketten |
| `preview/` | Skärmdumpar före och efter skrapning |

## Design

- **Sida:** neutral grå bakgrund `#6b6b6b`.
- **Lotten:** svart (`#000000`, Fujifilm Communication Black), max 420 px bred, centrerad. Huvuddel + perforering + lottstam. Hålen vid perforeringen är riktiga utstansningar (CSS-mask med två halvbreda lager, `--perf-y` sätts i JS från perforeringens position), och skuggan ligger som `drop-shadow` på `.ticket-wrap` så att den följer formen.
- **Accent:** Fujifilm Communication Red `#fb0020`, används sparsamt (AF-hörn när numret är framme, markering i mätaren, streck under numret).
- **Typsnitt:** Fjalla One (rubriker, siffror, text på skrapfältet) och Noto Sans (brödtext). Båda laddas från Google Fonts. Fjalla One finns bara i en vikt – lägg aldrig på fetstil.
- **Ordning uppifrån:** FUJIFILM-logga (centrerad) → Focus on Glass → "Tokyo Lottery Ticket" + instruktion → skrapfält 3:2 med AF-hörn → statusrad → perforering → stam (försäljning, registreringsdatum, dragning, antal lotter, mätare mot 25 lotter = FOOL Magazine Japan) → villkorsrad.
- **Skrapfältet:** canvas med en oskarp nattstad (bokeh) + korn och texten "SCRATCH HERE". Under ligger en ljusgrå yta med "Lottery number" och numret i Fjalla One.

## Beteende

1. Lotten laddas med skrapfältet täckt. Numret sätts först när täckningen är målad, så det aldrig syns i förväg.
1b. Entré: lotten "poppar" fram (skala 0.35 → 1 med lätt överslag och rotation, 0,75 s). Samtidigt går tre fyrverkeri-explosioner av (mitt, vänster, höger, 0/180/330 ms) och konfetti regnar ner över hela sidan i ca 2–3 s. Partiklarna ritas på en fast canvas (`#fx`) ovanpå sidan utan att fånga klick. Färger: röd `#fb0020`, vit, guld, ljusblå, orange.
2. Användaren skrapar med finger eller mus (pointer events, `touch-action: none` på canvas). Penseln är 34 css-px med runda ändar.
3. Var 12:e rörelse och när användaren släpper räknas andel bortskrapad yta (stickprov var 8:e pixel). Vid >50 % tonas resten bort (0,6 s), AF-hörnen dras in och blir röda, och statusraden visar "Ticket NNNN is in the draw on 5 March 2027."
4. Tangentbord: canvas är fokuserbar, Enter/mellanslag visar numret direkt.
5. "Ny lott" (endast demo) lägger tillbaka täckningen utan övertoning och slumpar ett nytt nummer.
6. `prefers-reduced-motion` stänger av övergångar, pop-animationen och fyrverkerierna.

## Exempeldata (byts mot riktiga data)

- Lottnumret slumpas i webbläsaren (`crypto.getRandomValues`, 0000–9999).
- Försäljning "XF56mmF1.2 R WR", registrerad "14 Nov 2026", 12 lotter, mätaren 11 + 1 ny.
- Demoknappen "Ny lott" och raden "Skiss · exempeldata …" ska bort i produktion.

## Inför produktion

- **Lottnumret måste komma från servern**, aldrig från klienten. Det ska vara unikt per kampanj, knutet till säljaren och den registrerade försäljningen, och loggat så att dragningen går att granska. Klienten visar bara numret.
- Bestäm om fyra siffror räcker. 10 000 kombinationer kan ta slut om många lotter delas ut.
- Spara att lotten är skrapad (per lott), så att den visas som skrapad nästa gång.
- Dragningsdatum, villkorstext och prisgräns (25 lotter → FOOL Magazine Japan) bör komma från kampanjdata, inte vara hårdkodade.
- Villkorstexten är hämtad från kampanjsajten: "The competition is open to employed sales staff at Scandinavian Photo."

## Varumärkesregler

- Logotyperna är originalfiler. Rita inte om, färga inte om och förvräng dem inte.
- FUJIFILM-loggan får inte ligga på färgad bakgrund, mönster eller bild. Vit-röd version på svart botten som här.
- Rubriker i Fjalla One är versal-gemener eller versaler, aldrig spärrade (letter-spacing 0). Undantag: lottnumret har lite luft (0.04em) för läsbarhet.
