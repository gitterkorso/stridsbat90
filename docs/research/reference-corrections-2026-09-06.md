> Aktuell granskning: [CB90 H 845, 2026-10-13](reference-audit-2026-10-13.md). Den har företräde framför motstridiga mått nedan.

> Publiceringsnotis: Filnamn under Referens/, shots/, tmp/ och backups/ avser lokalt granskningsmaterial som inte distribueras. Källänkar och rapportens egna slutsatser finns kvar; se [licensinformationen](../../THIRD_PARTY_NOTICES.md).

# CB90 H – korrigering mot referenser, 2026-09-06

Denna anteckning ersätter motstridiga delar av äldre SPEC.md och reference-845.md. Användarens bilder är styrande.

Referenser:
- `Referens/combat-boat-cb-90-h-fast-assault-craft.jpg`: Borgs genomskärning av 845, huvudkälla för utrustningsplacering och utseende.
- `Referens/Stridsbåt_90.jpg`: foto av 826, stöd för skrov, gummi och hyttens former. Båtarna har olika utrustningsdetaljer.
- Dockstavarvets CB90 H-produktblad: sidoprofil och skala. https://www.dockstavarvet.se/wp-content/uploads/2015/01/cb-90-h-product-sheet.pdf

## Korrigerad form och placering

Koordinater: x0 vid skrovets akterspegel, x14,9 vid stäven, +z styrbord. Längd med akterplattform cirka15,9m.

- Hytten slutar med den nedre fronten vid x11,05, med glasets nederkant x10,45 och överkant x10,85. Vindrutan lutar alltså framåt. Takkanten skjuter ytterligare7cm framåt. Den äldre hytten var för lång.
- Två sidorutor per sida: större akterruta och mindre trapetsformad framruta. Förrutornas exakta antal kan inte säkert avgöras från underlaget; befintliga fyra främre glasfält är bevarade.
- Lågt fördäck framför hytten. Ingen upphöjd central vapenbrunn. Hyttens däckskuldra faller till fördäcket vid x11,40.
- Dubbelinstallationen står lågt åt styrbord, pivot[12,25;2,04;0,85]. Smala pipor och perforerade mantlar följer samma elevationsled. Mittpassagen är fri.
- Ringlavetten står akter om hytten. Fyra ben går utåt ned mot separata däcksfötter. Öppen ståkorg under ringen. Vapnet pekar framåt/uppåt i grundläget.
- Kompakt radar på låg sockel på taket, framför signalmasten. Ingen stor radarbåge. Signalmast förskjuten åt babord, med förskjutna lanternfästen. Separat lång antenn vid akterdäckets främre kant.
- Höga skyddsräcken framför hyttens takhörn är separata från låga fördäcksrelingar. Akterräcken höjda till omkring0,9m över däcket.
- Kraftiga fasade gummiskydd på bogarna. Tunn plan avbärarlist längs skrovet akteröver. Den gamla tjocka runda tuben runt hela båten är borttagen. Gummistycket mitt i stäven sitter på den öppningsbara rampen.
- Olivfärgade surrade förvaringslådor på mellandäck, ventilerad låda akteröver, minräls med U-profil över akterplattformen, bad-/bordningsstege och delade akterräcken.
- Svensk tretungad örlogsflagga på babords akterhörn, mörk snedställd845-märkning och grågrönt splittermönster.

## Interiör och mekanik

Förarplats och instrument flyttas med den förkortade hytten. Ratt och dubbla reglage fungerar, skärmarna behåller viloläge utan sjökort.

Förpikens dörr, karm, golvövergång och gånggränser delar WH_DOOR_X=10,78. Dörren öppnas framåt90° så att den går fri från den nya instrumentpanelen och korridorväggen. Den låga öppningen följer förpikens fria höjd; gångläget hukar före passagen.

`tools/reference-test.js` har 14 godkända kontroller av byggd 3D-geometri, alla16 artikulationer i tre lägen och gångpassager. Dörrens hela90-gradersrörelse har dessutom provats mot däck och korridorväggar; minsta fria avstånd är20mm respektive112,5mm. Förhandsvisningen används för visuell kontroll av profil, för, akter och förarplats.

Måtten är rekonstruktioner från referensmaterialet; dolda infästningar och delar av inredningen kan inte fastställas exakt ur dessa bilder. Modellens visuella arrangemang ska inte behandlas som en konstruktionsritning.

## Stäven, 2026-09-07

Stäven mättes pixelnoggrant ur Dockstavarvets produktblad (sida1, 300dpi, 87px/m med skalstreck0–15m; vattenlinjen är den genomgående linjen 0,84m över kölen). Ritningens x0 sitter i akterspegeln precis som modellens. Den gamla modellen hade en lodrät stäv vid x14,9 med däckshörn 1,62m över vattenlinjen och kölpunkt vid +0,22; ritningen visar en låg, kraftigt bakåtlutad landstigningsstäv:

- Däckshörnet är skrovets främsta punkt: (14,87; 1,10). Under det en lodrät gumminos ned till 0,97.
- Stävporten är hela den plana stävytan från nosen ned till tröskeln vid (14,05; 0,40), lutad ~54° från lodlinjen (ytterlinje genom (14,11; 0,41) och (14,85; 0,95)). Den är trubbig, cirka1,1m bred vid däck och0,5m vid tröskeln.
- Under tröskeln fortsätter stävplåten (~60°) till vattenlinjen vid x≈13,25 och kurvar in i förstäven: köllinjen är −0,60 vid x12,0, −0,80 från x≈10,4 akteröver.
- Språnget faller mot fören (omvänt språng): 1,40 vid x12,0 → 1,27 vid 13,0 → 1,17 vid 14,05 → 1,10 vid stäven. Akter om x9 behålls de gamla stationerna och blandas in; ritningens språng ligger där cirka0,3m lägre än modellens, liksom mellandäck och hyttak – det är en separat proportionsfråga som inte ändrats här.
- Däckets halvbredd ur planritningen (ytterkontur minus gummi): 1,55 vid x12,0; 1,21 vid 13,0; 1,01 vid 13,5; 0,82 vid 14,0; 0,66 vid 14,5; 0,52 vid stävkanten.

Byggmässigt: `CB90.STATIONS` har fältet `keelZ` (halvbredden på sektionens botten, 0 = skarp köl, >0 = den trubbiga stävytan), huvudloften slutar vid tröskeln, och två halva sektionsloft ("bogkinder") bygger skrovet framför tröskeln på var sida om stävportsöppningen. Stävporten byggs i ett lutat plan från gångjärnet på tröskeln, med gummilister längs de lutande kanterna och gumminosen på ett nosblock; öppnad (−60°) lägger den sig ~25° under horisontalplanet med spetsen vid vattenlinjen. Förpiken slutar vid tröskeln (golv 0,90 → 0,42). Skrovnumret sitter mitt på bordläggningen vid x12,4 som i ritningen och 845-illustrationen; dubbelkulsprutan står 0,34m över det lägre fördäcket; pollare och fördäcksreling följer den smalare fören.

`tools/reference-test.js` har ett nytt test av stävens lutning, tröskel, däcksbredd och sammanhängande skal, och `tools/fitcheck.js` kan nu köras i Node (DOM-mock) och räknar stävportsöppningen som avsiktlig kant.
