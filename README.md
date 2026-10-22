# CB90 H — Svenska skärgården

Kör Stridsbåt 90 H genom en procedurellt genererad svensk skärgård, gå ombord och utforska båten i 3D. Modellen har öppningsbara luckor, gångbar interiör, separat styrning av de två vattenjetarna och valbar tid och väder. Skrovet tränger undan vatten och lämnar svallvågor som fortsätter breda ut sig efter att båten har passerat.

All simulering och rendering körs lokalt, i Windows-programmet eller webbläsaren. Inga API-nycklar, konton eller separat backend behövs. Projektet är en visuell rekonstruktion med förenklad fysik, inte en certifierad simulator eller konstruktionsmodell.

## Ladda ner för Windows

Hämta programmet från [senaste releasen](https://github.com/gitterkorso/stridsbat90/releases/latest). Välj en av filerna:

- **CB90-H-1.0.0-Windows-x64.exe** — starta direkt, utan installation.
- **CB90-H-1.0.0-Windows-x64-Setup.exe** — installera för ditt användarkonto med genvägar på skrivbordet och i Start-menyn.

Programmet är för Windows 10/11 på en 64-bitars Intel-/AMD-dator. Allt ingår; du behöver inte installera Node.js eller Chrome. Det fungerar utan internet. **F11** växlar helskärm och **Alt+F4** avslutar. Spelkontrollerna är samma som i webbläsarversionen.

Programfilerna är inte kodsignerade; Windows kan visa att utgivaren är okänd. Kontrollsummor finns i `SHA256SUMS.txt` på releasesidan. Se [releaseinformationen](docs/releases/v1.0.0.md) och [bygginstruktionerna](docs/desktop-release.md).

## Snabbstart

Du behöver en modern webbläsare med WebGL, till exempel Chrome, Edge eller Firefox. **Node.js** behövs för att bygga projektet, köra den lokala servern och köra testerna. Biblioteken följer med projektet; ingen `npm install` behövs.

Klona projektet och kör följande i terminalen. Om du redan har repot börjar du med byggkommandot från repots rotmapp.

```sh
git clone https://github.com/gitterkorso/stridsbat90.git
cd stridsbat90
node tools/build.js
node tools/serve.js
```

Öppna [http://localhost:8090](http://localhost:8090). Den lokala servern serverar projektets filer; låt terminalen vara öppen medan du kör och avsluta servern med **Ctrl+C**.

För utveckling öppnar du [http://localhost:8090/dist/dev.html](http://localhost:8090/dist/dev.html). Den sidan läser JavaScript-filerna direkt från `src/`, så du kan ladda om sidan efter en kodändring. Kör `node tools/build.js` igen när du vill uppdatera den paketerade versionen eller har ändrat sidans HTML.

Bygget skapar även `dist/index.html`, en fristående fil som innehåller hela upplevelsen inklusive Three.js och kan öppnas utan internetanslutning. På Mac kan du efter bygget dubbelklicka på **Starta CB90.command** för att öppna den.

## Referensgranskning 20 oktober 2026

Styrande utförande är **svensk CB90H**, med **fördäcket från fotoreferensen av 925**. Borgs 845-genomskärning och äldre svenska H-källor styr övrigt arrangemang. Saab/Dockstas CB90HEXM-ritning används som stöd där konstruktionen är gemensam. Båtnumret är fortsatt 845.

Den senaste genomgången rättar huvudformer, hytt och inredning samt beslag och öppningsmekanismer. Fördäcket har korta gummiskydd vid stäven, sidopassager förbi den smalare hytten, tre främre glasfält och den horisontella räckesbågen framför mittfönstret. Stävluckorna når rampkanten och öppnar hela passagen. Täckboxen är inpassad innanför skrovet; sarg, gångjärn, lås, gasfjädrar, rampkedjor och tamp har bearbetats mot foton och båtens handbok återgiven i SHK:s rapport.

Förar- och navigatörsplatserna står på upphöjda plattformar ovanför den låga mittgången. Äldre H-arrangemang med tre skärmar, navigatörstangentbord, två huvudstolar och en fällbar mittstol är återgivet. Transportrummet har 9+9 inåtvända säten och två framåtvända akterstolar enligt den historiska källan; dessa har inga bälten. De tre besättningsplatserna har höftbälten.

Under **Inspektera → Luckor & delar → Fördäckskanon** växlar man mellan hela dubbelinstallationen och täckboxen. Standardläget är **av / täckbox**. Mittstolen har ett separat reglage och lämnas uppfälld när alla luckor öppnas eller stängs.

Samlad redovisning av ändringar, mått, verifiering och kvarstående osäkerheter finns i [granskningsrapporten](docs/research/full-audit-2026-10-20.md). [Källförteckningen](docs/research/cad-source-search.md) beskriver nedladdade originalreferenser och granskade CAD-kandidater. Ingen verifierad original-CAD hittades. Modellen är en källbaserad rekonstruktion; okända detaljmått ska inte beskrivas som exakta. Tidigare granskningsrapporter är historik och ersätts av den senaste där uppgifterna skiljer sig.

Historiska granskningsrapporter kan hänvisa till lokala referensbilder, jämförelsevyer och säkerhetskopior som inte distribueras med projektet. Ursprungs-URL:er till granskade källor finns i [källförteckningen](docs/research/cad-source-search.md).

Flaggan förbättrades den 22 oktober: tyget har mjuka veck i tre dimensioner, nedhängning vid svag vind och separat fladder i de tre tungorna. Vindens riktning är fast i omvärlden; flaggan reagerar på båtens fart och kurs samt på väderbyten. Fästkanten sitter kvar vid stången, längden längs tyget från stång till fri kant bevaras och paus fryser rörelsen. Det är en visuell tygmodell, inte en fullständig tygfysiksimulering.

## Ombord

- **Exteriör:** rotera med musen och zooma med scrollhjulet. Klicka direkt på luckor, eller använd Inspektera.
- **Gå ombord:** gå med WASD eller pilarna på skärmen, dra med musen för att se dig omkring. Shift ökar gångfarten. E använder delen du pekar på. Kameran hukar i låga passager.
- **Förarplats:** W/S ökar/minskar båda motorreglagen. Förbi neutral ger back. A/D vrider ratten, C centrerar den. Space ställer reglagen i neutral; båten tappar då fart genom vattenmotstånd.
- **Separat pådrag:** J/N styr babord, K/M styr styrbord. Ratten och båda reglagen kan också dras direkt i 3D-vyn eller ställas med skjutreglagen.
- **F** växlar mellan sittande och stående. **1/2/3** väljer exteriör, gång respektive förarplats. **H** öppnar/stänger alla öppningsbara delar. **P** pausar. **Esc** frigör musen.

Menyn Kameror har genvägar till transportrum, hytt, förpik och maskinrum. Dörrarna måste vara öppna för att gå mellan utrymmena. Inspektera innehåller även genomskärning, radar, kameravinklar och återställning till start.

## Skärgården

Terrängen går från skogig innerskärgård i väster via mellanskärgård och breda, slingrande fjärdar till låga granitkobbar i öster. Längre österut (ungefär 8 km från kartans origo) tar öppet hav vid. Blandskog med tallar, mörka granar och ljusa björkar är tätast på skyddade inneröar. Björkar har vit, mörkfläckig bark, granar smala skiktade kronor och tallar öppna stammar med breda barrkronor. Skogsmarken bryts upp av grårosa granithällar; exponerade ytterskär är lägre och nästan trädlösa. Öarnas öst- och västsidor har brantare klippstränder, medan norr- och sydsidorna bildar flackare, slätare hällar. Aktuellt område visas under Kameror → Skärgård. Generatorversion 3 ändrar bergprofilen men behåller kustlinjen och undervattensgrunden från version 2.

Skärgården genereras ur ett frö. Samma frö ger alltid samma öar, grund, fyrar och farled, och fröet ligger i adressen: `dist/index.html?seed=90848`. Utan frö används standardskärgården. **Ny skärgård** under Kameror slumpar ett nytt sexsiffrigt frö, ritar om världen och uppdaterar adressen; sjökortets namn och frö visas i samma sektion och högst upp till höger. **Åter till start** lägger båten på startplatsen i djupt vatten med fören mot öppet vatten.

Båten går på grund där vattnet är grundare än cirka 0,95 m under skrovets stationer (djupgående 0,8 m plus marginal). Backa försiktigt för att komma loss. Mätarraden visar **DJUP**: vattnet under kölen mitt under båten, 0,0 m vid grundkänning.

## Vattnet

Skrovet tränger nu undan vatten i ett simulerat höjdfält. När den nedsänkta skrovvolymen flyttas, höjs eller lutar bildas krön och dalar som förändrar vattenytans geometri och reflektioner. Svallvågorna breder ut sig i omvärlden, följer den redan körda färdvägen genom svängar och fortsätter efter att båten stannat. Även en båt som glider med avslagna motorer eller backar skapar svall. Skum och stänk följer den kombinerade vattenytan.

Modellen löser förenklade ekvationer för vågor i grunt vatten på ett fint rutnät om cirka 191 × 191 meter och ett grövre om 1 533 × 1 533 meter. Grunddämpningen är svag så att svall behåller tydlig vågenergi i över en minut; det större området bevarar även äldre svall när båten kör vidare i hög fart. En mjuk övergång låter svall fortsätta bortom närområdet och ligga kvar när båten kör vidare. Vågor bromsas vid grund och reflekteras mot land; ytterkanten dämpar gradvis bort energin. Kraftiga vågor förlorar energi för att undvika orimlig resonans. Rutnäten flyttas i hela celler utan att flytta kvarvarande vågor i världen. Paus fryser simuleringen och återställning rensar gammalt svall. Det är en visuell hydrodynamisk approximation med begränsad räckvidd, inte en fullständig strömningsberäkning av CB90 H.

Vattenytan har oregelbundna, vinddrivna krusningar i flera skalor som blir lugnare i dimma och tydligare i hårt väder. Fina detaljer tonas bort när de blir mindre än en bildpunkt. Speglingarna bryts av krusningarna och mjukas upp, och solblänket följer solens höjd. En lokal djupkarta från skärgårdens verkliga bottentopografi ger grönare grundområden och mörkare djupvatten. Vindvågorna förstärks i grunt vatten och får en förenklad partiell reflektion vid branta klippor; strandskummet följer den våta kustlinjen och vågslagen. Vita skumtoppar bildas på vindvågornas krön och branta svallvågor, tydligare i hårt väder. Djupkartan flyttas stegvis med båten; färg och skum är visuella approximationer, inte en simulering av undervattensljus.

Havet har animerade vågor i flera riktningar, finare vindkrusningar och vinkelberoende reflektioner. I hög grafikkvalitet speglas båten, öarna och himlen varje bildruta, även ombord. Låg kvalitet använder en enklare himmelsspegling. Två separata jetstråk reagerar på motorreglagen, medan sidosprutet ökar med farten. Dropparna faller tillbaka mot ytan och skummet ligger kvar längs den körda vägen, även i svängar och när båten stannar. Back ger ett lokalt utåtriktat svall vid aktern. Skummet ritas direkt på vattenytan från en karta förankrad i omvärlden, vilket tar bort skarvar från separata skumytor som skär genom vågorna. Den tätaste vattengeometrin följer båten för att bevara detaljer nära kameran.

Båtens höjdrörelse, stampning och rullning följer vattenytans vindvågor via åtta provpunkter längs skrovet. Båtens eget svall återkopplas inte till flytrörelsen, för att undvika att den förstärker sina egna vågor. Dämpad tröghet, extra förlyft under acceleration, övergång till lägre trim i planing och lutning inåt i svängar ger en mer naturlig gång. Kameran ombord följer skrovets rörelse. Trimkurvan är en visuell approximation, inte uppmätta sjöprovsdata för CB90 H.

## Tid och väder

Under **Inspektera → Väder** kan du ställa klockslag, slå av/på dygnscykeln och välja hur många minuter ett dygn tar (3–60, standard 12). Solen, skymningsfärgerna, nattens stjärnor och månljus samt vattenreflektionerna följer tiden.

Välj **Klart**, **Mulet**, **Dimma**, **Regn** eller **Oväder**. Molnighet, sikt, regn och våghöjd ändras tillsammans; skrovet följer samma vågor. Väderbyten sker gradvis under körning. Paus fryser klockan och animeringen, men tid och väder kan fortfarande väljas för att granska en scen.

## Plottrarna

**Aktuellt modellutförande:** de tre skärmhusen visas med mörka, inaktiva glasytor. Plottermodulen och dess reglage finns kvar i projektet men är inte anslutna till dessa glasytor. Följande beskriver modulens tidigare funktion.

De två plotterskärmarna i hytten visar ett levande sjökort över samma skärgård som terrängen: öar med namn, undervattensgrund, fyrar med sektorer och karaktär, farled med sidomärken, egen position, kurs och fart.

- **+ / −** (även **=**) ökar / minskar räckvidden i stegen 0,25 · 0,5 · 1 · 2 nm. Samma knappar finns under Manövrering → Plotter.
- **R** växlar mellan kurs upp och nord upp.
- Skärmarna uppdateras när du sitter i hytten, går ombord eller när exteriörkameran är nära styrhytten.

## Innehåll

- Skrov med kontinuerligt splinterkamouflage, målat nummer 845 och detaljerad däcksutrustning. Låg, bakåtlutad landstigningsstäv uppmätt ur Dockstavarvets profil- och planritning (se `docs/research/reference-corrections-2026-09-06.md`).
- 20 individuella transportsäten i historiskt 9+9+2-arrangemang utan bälten, samt tre besättningsstolar med höftbälten, ledningar, säkerhetsutrustning, trappor och durkplåt.
- Upphöjda förarplatser med fjädrade stolar, ratt, två motorreglage och två skophandtag, instrument, VHF, knappar, lampor och öppningsbara elskåp. Skophandtagen följer körmodellens kopplade fram/back-reglage.
- 14 öppningsbara delar: 13 luckor, dörrar och ramp, samt fällbar signalmast. Roterande ringlavett, höjdriktning och fällbar mittstol ingår som ytterligare tre leder.
- Två modellerade dieselmotorer, mekaniska vattenjetmunstycken, backskopor och hydraulik.
- Procedurellt genererad skärgård (`src/archipelago.js`) med sammanhängande höjdfält: granitöar, holmar, kobbar, undervattensgrund, namngivna öar och fjärdar, sektorfyrar med verkliga fyrkaraktärer och en utprickad farled. Animerat hav, reflektioner och fartberoende kölvatten.
- Tre modellerade skärmhus med inaktiva glasytor. Separat plottermodul finns kvar för det genererade sjökortet.
- Båtfärd med acceleration, inbromsning, back, differentialstyrning och grundstötning mot den verkliga bottentopografin; DJUP-mätare under kölen.
- Valbart syntetiskt motorljud, paus och export av en bild från 3D-vyn.

Detta är en visuell interaktiv modell med en förenklad körmodell, inte en certifierad simulator eller en måttsatt konstruktionsmodell. Skärgården är fiktiv; positionerna på plottrarna utgår från ett påhittat origo i Stockholms ytterskärgård. Interiördetaljer som inte framgår av referenserna är tolkade. Vapen är enbart visuella modeller utan skjutmekanik.

## Kod och arkitektur

Projektet använder vanlig JavaScript och Three.js, utan ramverk eller paketinstallation. Filerna delar funktioner genom `window.CB90` och laddas i den ordning som anges i `src/page.html`. `src/main.js` bygger scenen, kopplar samman modulerna och driver bildrutornas uppdateringar.

| Fil eller modul | Ansvar |
| --- | --- |
| `src/page.html`, `src/main.js` | Sidans gränssnitt, start av programmet, gemensamt tillstånd, scen och uppdateringsloop. |
| `src/constants.js`, `src/util.js` | Båtmått, skrovstationer, färger och återanvändbara geometrihjälpare. |
| `src/hull.js`, `src/superstructure.js`, `src/equipment.js`, `src/waterjet.js` | Bygger skrov, överbyggnad, inredning, utrustning och vattenjetar. |
| `src/archipelago.js`, `src/environment.js` | Skapar den fröbaserade världen och ritar terräng, vegetation och sjömärken runt båten. |
| `src/navigation.js`, `src/controls.js`, `src/ui.js` | Körmodell, grundstötning, kameror, gång ombord, inmatning och menyer. |
| `src/sea-state.js`, `src/weather.js`, `src/boat-motion.js` | Vindvågor och väder samt båtens höjdrörelse, stampning och rullning. |
| `src/hull-waves.js` | Beräknar skrovets vattenförskjutning och svallvågornas utbredning i ett höjdfält, oberoende av renderaren. |
| `src/hull-wave-surface.js` | För över svallvågornas höjder och lutningar till GPU-texturer och kombinerar dem med vindvågorna i vattenytans shader. |
| `src/water-depth.js` | Samplar skärgårdens botten till en lokal djupkarta för vattenfärg och strandskum. |
| `src/water.js`, `src/wake.js` | Ritar vattenytans geometri, reflektioner, skum och stänk. |
| `src/plotter.js` | Ritar det genererade sjökortet; hyttens nuvarande skärmglas är inaktiva. |
| `tools/build.js`, `tools/serve.js` | Paketerar programmet respektive serverar projektet lokalt. |

Båtens position och orientering bestämmer vilken skrovvolym som flyttar vatten. Vågsimuleringen uppdaterar höjdfältet, och `hull-wave-surface.js` gör samma yta tillgänglig för vatten, skum och stänk. Terrängens höjdfält används både för grundstötning och för att hindra svallvågor från att passera genom land. Själva flytrörelsen följer vindvågorna, utan återkoppling från båtens eget svall.

Redigera i första hand `src/`; filerna i `dist/` genereras av bygget. `dist/dev.html` är utvecklingsvyn, `dist/index.html` är det fristående programmet och `dist/artifact.html` är motsvarande HTML-fragment utan omslutande dokumenttaggar.

## Verifiering

```sh
node tools/navigation-test.js
node tools/boat-motion-test.js
node tools/wake-test.js
node tools/water-depth-test.js
node tools/hull-waves-test.js
node tools/hull-wave-surface-test.js
node tools/weather-test.js
node tools/archipelago-test.js
node tools/regions-test.js
node tools/interior-test.js
node tools/reference-test.js
node tools/cabin-profile-test.js
node tools/fitcheck.js
node tools/door-clearance-test.js
node tools/hatch-sequence-test.js
node tools/flag-test.js
```

Navigationstesterna täcker fram/back, roder, differentialstyrning, kollisioner mot de äldre ellipsöarna, bildfrekvensoberoende rörelse och paus/reset, samt grundstötning mot ett höjdfält: båten stannar när fören når cirka 0,8–1 m vatten, skrovet hamnar aldrig på land, back frigör båten, DJUP-värdena stämmer och startposition/reset respekteras. Skärgårdstesterna kontrollerar att samma frö ger identiska höjder, att landandelen är rimlig, att startplatsen ligger i djupt fritt vatten, att uppmätningen ger namngivna öar, sektorfyrar, grund och en farled i vatten, att den cachade samplern följer höjdfältet och att positionsformaten stämmer. Interiörtesterna kör verklig gånglogik och bygger de verkliga modellmodulerna med Three.js. De verifierar också med strålkastning att skrovets öppnade luckor visar djupare utrymme och att dörrar inte låser fast spelaren.

Vattentesterna kontrollerar bland annat vågutbredning efter stopp, krön och dalar utanför skrovet, backning, svängar, paus, återställning, landbarriärer och byte av värld. De jämför också olika bildfrekvenser och verifierar att GPU-texturerna motsvarar simuleringens höjder och lutningar.

På macOS med Google Chrome kan skärmdumpar av 3D-vyn tas med `tools/shot.sh 'dist/index.html?seed=90848' ut.png`. Med `?plotter=1` läggs plotterns sjökort som en fast bild nere till vänster så att kortet kan granskas.

## Källor och filer

Primära visuella referenser är fotografier och produktblad som har använts vid modellgranskningen. De lokala kopiorna av referensmaterialet följer inte med det publika repot; källornas URL:er finns i [källförteckningen](docs/research/cad-source-search.md). Arrangemang och grundproportioner har jämförts med [Dockstavarvets CB90 H-specifikation](https://www.dockstavarvet.se/products/combat-and-patrol-boats/combat-boat-90-h/specification/).

`src/` innehåller modell, miljö, gång- och körlogik samt gränssnitt; `src/archipelago.js` är den delade världsgeneratorn och `src/plotter.js` ritar sjökorten. `src/vendor/` innehåller Three.js r128 och OrbitControls med ursprunglig licensinformation. `tools/build.js` paketerar allt i en enda HTML-fil. `docs/SPEC.md` beskriver den ursprungliga modellen; README och den aktuella koden gäller för den ombyggda upplevelsen.

## Licens

Projektets egen kod är tillgänglig under [MIT-licensen](LICENSE). Se [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) för licenser och källangivelser för externa bibliotek och referensmaterial.
