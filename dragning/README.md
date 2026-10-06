# Focus on Glass – digital lottdragning ("Bländaren")

Skiss på den digitala dragningen till Fujifilms säljkampanj **Focus on Glass** (Tokyo Lottery). Dragningen sker fredag 5 mars 2027 och fyra vinnare följer med FUJIFILM på en utbildningsresa till Tokyo. Den hör ihop med den digitala skraplotten (paketet `focus-on-glass-skraplott`), där säljaren skrapar fram sitt fyrsiffriga lottnummer.

Konceptet: lottnumren driver förbi som suddiga ljuspunkter. En bländare drar ihop sig och ett nummer blir skarpt – samma idé som "Scratch to focus" på lotten.

Prototyp i ren HTML/CSS/JS, utan byggsteg och beroenden. Öppna `index.html` i en webbläsare.

## Grundprincip: animationen visar bara resultatet

Vinnarna dras **i förväg på servern** och är låsta innan dragningen visas. Animationen avgör ingenting. I prototypen ligger resultatet hårdkodat i `WINNERS` överst i `draw.js`. I produktion ska det hämtas från servern (t.ex. ett endpoint som returnerar de fyra vinnarna i ordning), och dragningen ska vara loggad så att den går att granska.

## Filer

| Fil | Innehåll |
| --- | --- |
| `index.html` | Sidan: logotyper, rubrik, scen 16:9, knappar, vinnarlista |
| `styles.css` | All styling. Färger och typsnitt som CSS-variabler i `:root` |
| `draw.js` | Vinnardata, bländaranimationen (canvas), fyrverkerier, knapplogik |
| `assets/fujifilm-logo-white-red.svg` | FUJIFILM-logotyp, vit med röd i-prick. Endast på svart/mörk botten |
| `assets/focus-on-glass-white.svg` | Kampanjlogga Focus on Glass, vit, utan "Untold Stories"-etiketten |
| `preview/` | Skärmdumpar: före dragning, första vinnaren, alla fyra dragna |

## Design

- **Sida:** neutral grå `#6b6b6b`. Överst FUJIFILM-logga, Focus on Glass-logga, rubriken "Tokyo Lottery – Draw" och en rad om dragningen.
- **Scen:** svart, 16:9, full bredd upp till 960 px – tänkt att fungera som skärm vid livesändning (Teams/butiksskärm).
- **Accent:** Fujifilm Communication Red `#fb0020` för fokushörn, vinnaretikett och nummer i vinnarlistan.
- **Typsnitt:** Fjalla One (rubriker, nummer, namn) och Noto Sans (brödtext), från Google Fonts. Fjalla One har bara en vikt – lägg aldrig på fetstil.
- **Vinnarlista:** fyra platser under scenen. Ej dragna visas som "····" i grått. Dragna visas med nummer i rött, namn och butik.

## Animationen, steg för steg (per vinnare)

1. **Viloläge:** mörkblå bakgrund med 34 ljuspunkter (bokeh) och 26 suddiga lottnummer (blur 5 px) som driver långsamt i sidled. Text uppe till vänster: "Ready for draw".
2. **Klick på "Dra vinnare N av 4":** knappen låses.
3. **0–2,2 s:** bländaren (9 lameller) stänger från utanför bild till en öppning med radie 30 % av scenens kortsida, och vrider sig samtidigt. Ljuspunkter och nummer accelererar och bromsar in.
4. **1,3–2,6 s:** vinnarnumret tonas in i mitten och går från oskarpt (blur 18 px) till skarpt. Övriga nummer tonas ner.
5. **När numret är skarpt:** röda fokushörn låser runt numret.
6. **Ca 2,7 s:** texten visas under scenens mitt: röd etikett "WINNER N · TICKET NNNN", namnet och "Scandinavian Photo [butik]". Fyrverkerier (tre explosioner) och konfetti över sidan. Vinnaren läggs in i listan och knappen låses upp för nästa.
7. Efter fyra vinnare: knappen visar "Alla fyra dragna". "Börja om" nollställer.

`prefers-reduced-motion` hoppar direkt till slutläget och stänger av fyrverkerierna.

## Exempeldata (byts mot riktiga data)

- `WINNERS` i `draw.js`: Maria Sjöberg (4827, Stockholm), Johan Ek (0391, Göteborg), Sara Holm (7714, Malmö), Erik Nyberg (2265, Uppsala). Påhittade namn.
- `POOL`: 60 slumpade nummer som bara används som dekor i bakgrunden. I produktion kan de gärna vara riktiga utdelade lottnummer.
- Raden "Skiss · exempeldata …" ska bort i produktion.

## Inför produktion

- Hämta vinnarna från servern. Klienten får aldrig slumpa fram vinnare.
- Bestäm hur dragningen körs: live av en presentatör (knappen) eller automatiskt med paus mellan vinnarna.
- Visa bara förnamn + efternamn + butik om det är godkänt ur integritetssynpunkt.
- Kontrollera med Fujifilm vilka regler som gäller för tävlingen och dragningen.

## Varumärkesregler

- Logotyperna är originalfiler. Rita inte om, färga inte om och förvräng dem inte.
- FUJIFILM-loggan får inte ligga på färgad bakgrund, mönster eller bild – vit-röd version på mörk botten.
- Rubriker i Fjalla One är versal-gemener eller versaler, aldrig spärrade.
