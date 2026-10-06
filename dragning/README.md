# Focus on Glass – digital lottdragning, fullskärm ("Bländaren")

Fullskärmsversion av dragningen till Fujifilms säljkampanj **Focus on Glass** (Tokyo Lottery, fyra vinnare, dragning fredag 5 mars 2027). Tänkt att visas på storbild eller i en livesändning. Hör ihop med den digitala skraplotten (paketet `focus-on-glass-skraplott`), där säljaren skrapar fram sitt fyrsiffriga lottnummer.

Konceptet: lottnumren driver förbi som suddiga ljuspunkter. En bländare stänger steg för steg, autofokus letar och låser till sist på vinnarnumret – samma idé som "Scratch to focus" på lotten.

Prototyp i ren HTML/CSS/JS, utan byggsteg och beroenden. Öppna `index.html` i en webbläsare och klicka "Helskärm".

## Grundprincip: animationen visar bara resultatet

Vinnarna dras **i förväg på servern** och är låsta innan dragningen visas. Animationen avgör ingenting. I prototypen ligger resultatet hårdkodat i `WINNERS` överst i `draw.js`. I produktion hämtas det från servern, och dragningen loggas så att den går att granska.

## Filer

| Fil | Innehåll |
| --- | --- |
| `index.html` | Sidan: canvas, logotyper, knappar, vinnartext, vinnarbård |
| `styles.css` | All styling. Färger, typsnitt och bårdens höjd som CSS-variabler i `:root` |
| `draw.js` | Vinnardata, tidslinje (`T`), bländaren, fyrverkerier, knapplogik |
| `assets/fujifilm-logo-white-red.svg` | FUJIFILM-logotyp, vit med röd i-prick. Endast på mörk botten |
| `assets/focus-on-glass-white.svg` | Kampanjlogga Focus on Glass, vit, utan "Untold Stories"-etiketten |
| `preview/` | Fem stillbilder ur sekvensen: vila, fart, bländaren stänger, fokusjakt, vinnare |

## Layout

- **Bilden fyller hela skärmen** (canvas), utom bården längst ner.
- **Logotyper:** FUJIFILM och Focus on Glass, små och centrerade högst upp.
- **Meny uppe till höger** som på en webbsida: liten vit text (Noto Sans 12 px) utan ramar eller bakgrund – "Dra vinnare N av 4", "Börja om", "Helskärm" (döljs om webbläsaren saknar stöd). Röd understrykning vid hovring. På smal skärm (≤ 640 px) ligger menyn centrerad strax ovanför bården.
- **Vinnartext** centrerad nedtill på bilden: röd etikett "WINNER N · TICKET NNNN", namnet stort i Fjalla One, "Scandinavian Photo [butik]".
- **Vinnarbård** längst ner, svart, höjd `clamp(104px, 17vh, 168px)`: fyra fält (två × två på smal skärm). Ej dragna visas som "····". En nydragen vinnare blinkar till i rött.
- **Färger:** svart, vit, Fujifilm Communication Red `#fb0020` som accent. **Typsnitt:** Fjalla One och Noto Sans från Google Fonts.

## Bländaren

Nio böjda lameller. Varje lamell är ytan utanför en förskjuten cirkel (lamellens skärkant) inom ett spiralformat område, så öppningen blir en rundad niohörning som i ett riktigt objektiv och lamellerna överlappar som en spiral. Varje lamell har egen ljussättning efter vinkeln mot ett tänkt ljus uppe till vänster, satinglans, en ljus fas på skärkanten, ljus kant och mjuk skugga längs överlappet, samt vinjettering mot bildkanten.

## Sekvensen per vinnare (ca 11,4 s, ställs i `T` i `draw.js`)

1. **Fart, 2,6 s:** bländaren är helt öppen. Ljuspunkter och suddiga nummer accelererar.
2. **Bländaren stänger, 4,8 s:** stänger i fem klick från f/1.4 till f/8, med f-värdet utskrivet under öppningen. I mitten fladdrar suddiga slumpnummer, först snabbt och sedan allt långsammare. Det sista är vinnarnumret, fortfarande oskarpt.
3. **Fokusjakt, 3,4 s:** skärpan pendlar fram och tillbaka (oskärpa 20 → 12 → 17 → 9 → 14 → 6 → 10 → 0 px) medan vita fokushörn blinkar. Numret går inte att läsa förrän i slutet.
4. **Lås, 0,6 s:** fokushörnen blir röda och numret är skarpt.
5. **Vinnaren:** texten tonas in, vinnaren läggs i bården och fyrverkerier (fem explosioner) och konfetti går av.

`prefers-reduced-motion` hoppar direkt till slutläget utan fyrverkerier. Om bilduppdateringen hackar slutförs dragningen ändå via en säkerhetstimer.

## Exempeldata (byts mot riktiga data)

- `WINNERS` i `draw.js`: Maria Sjöberg (4827, Stockholm), Johan Ek (0391, Göteborg), Sara Holm (7714, Malmö), Erik Nyberg (2265, Uppsala). Påhittade namn.
- `POOL`: 60 slumpade nummer som bara används som dekor. I produktion kan de gärna vara riktiga utdelade lottnummer.

## Inför produktion

- Hämta vinnarna från servern. Klienten får aldrig slumpa fram vinnare.
- Bestäm om presentatören klickar fram varje vinnare (som nu) eller om dragningen går automatiskt med paus mellan vinnarna.
- Visa bara namn och butik om det är godkänt ur integritetssynpunkt.
- Kontrollera med Fujifilm vilka regler som gäller för tävlingen och dragningen.
- Testa på den dator och skärm som ska användas vid sändningen. Allt ritas på canvas och kräver en vanlig modern webbläsare.

## Varumärkesregler

- Logotyperna är originalfiler. Rita inte om, färga inte om och förvräng dem inte.
- FUJIFILM-loggan får inte ligga på färgad bakgrund, mönster eller bild – vit-röd version på mörk botten.
- Rubriker i Fjalla One är versal-gemener eller versaler, aldrig spärrade.
