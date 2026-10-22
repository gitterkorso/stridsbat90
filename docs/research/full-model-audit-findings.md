# Oberoende modellgranskning – svensk CB90H, 2026-10-20

> Publiceringsnotis: Filnamn under Referens/, shots/, tmp/ och backups/ avser lokalt granskningsmaterial som inte distribueras. Källänkar och rapportens egna slutsatser finns kvar; se [licensinformationen](../../THIRD_PARTY_NOTICES.md).

## Underlag och avgränsning

Användaren har under arbetet bekräftat svensk CB90H som styrande utförande, fördäcket från fotot av **925**, och HEXM-ritningen endast som stöd för gemensam konstruktion. Följande källor har visuellt granskats:

- `Referens/fordack-925.png`: fördäckets beslag, låda, lucka, greppbågar, pollare och central räckesbåge.
- `Referens/combat-boat-cb-90-h-fast-assault-craft.jpg`: Borgs genomskärning av 845; äldre svensk utrustning, akterplattform, relingar, mörk siffermärkning på ljus kamouflageyta.
- `Referens/manufacturer/CB90H-113.jpg`: Dockstas foto; särskilt räckesbågens horisontella plan framför vindrutan. Ingen import av exportbåtens samtliga utrustningsdetaljer.
- `Referens/additional/docksta-product-sheet-4x.png` / `Referens/cb-90-h-product-sheet.pdf`: tillverkarens äldre H-produktblad, med foto, profil/plan och tryckt längdskala.
- `Referens/cb90h-ga-saab-original.jpg`: CB90HEXM, daterad 2020-05-26. Gemensamma proportioner kan jämföras, men exportutförandets inredning och utrustning är inte en exakt beskrivning av svensk H.
- SHK RM 2008:02 och SHK 2026:02 har använts av parallell källgranskning för dörrens öppningsriktning och svensk inredning. Se den separata källrapporten för sidangivelser.

Denna granskning skiljer mellan **bevisbara modellfel** (t.ex. en del svävar över sitt stöd), **visuellt säker form** (t.ex. ett räcke ligger horisontellt) och **osäkra originalmått**. Ett godkänt geometritest är inget bevis för okända verkliga tillverkningsmått.

## Baslinje före denna arbetsomgång

| Kontroll | Resultat |
|---|---|
| `tools/reference-test.js` | 18 godkända, 1 fel |
| `tools/cabin-profile-test.js` | 3 godkända, därefter 1 fel |
| `tools/interior-test.js` | 13 godkända |
| `tools/fitcheck.js` | Godkänd: skrov utan oavsiktliga öppningar, 55 deklarerade däckkontakter |

De två första felen var föråldrade testantaganden: mittgångens riktiga geometri och navigationsgolv låg båda på `TROOP_FLOOR_Y = −0,30`, men kontrollerna jämförde med `WH_FLOOR_Y = +0,40`. Den låga mittgången ska inte höjas för att få ett gammalt test att passera.

Baslinjens mätvärden finns i `tmp/audit-independent/measurements-baseline.json`. Bilderna finns i `tmp/audit-independent/render/` och `tmp/audit-independent/foredeck/`.

## Konkreta fynd och åtgärder

| Fynd | Oberoende mätning eller källa | Åtgärd i arbetsomgången |
|---|---|---|
| Förpiksdörren skar genom golvet när den öppnades | 25/50/75/100 % öppning gav ungefär 50/107/144/156 mm inträngning. Världskoordinater jämfördes mot det verkliga golvets höjdfunktion. | Källgranskningen hittade att dörren öppnas akterut. Öppningsriktningen korrigerad av annan agent; styrbords plattform och konsol fick ett fritt dörrutrymme av huvudagenten. |
| Radarns bottenplatta svävade | Plattans underkant y=2,5425 m mot tak y=2,5000 m: **42,5 mm luft**. | Hela radaraggregatet registreras nu med bottenplattan mot taket. Relativa mått och roterande antenn bevaras. |
| Babords fördäckslucka var en vågrät låda över ett knäckt däck | Bakre hörn låg **67,8 mm ned i däcket**, främre hörn **17,4 mm ovanför**. Mätt med strålar mot byggda däcktrianglar. | Svetsad sarg följer däckets knäckning; en plan, svagt lutande lucka med packning ligger på sargens översida. Hela luckan håller sig innanför skrovets planform. |
| Greppbågarnas ben följde inte däckets lokala höjd | Båda benändarna använde höjden i bågens mitt trots fallande fördäck. | Varje ben går nu till sin egen fotplattas överkant. Alla fyra fotplattor ingår i däckkontaktkontrollen. |
| Räcket framför mittfönstret hade fel orientering | Den tidigare modellen hade en stående rektangel. 925-fotot tillsammans med tydligare tillverkarfoto av 113 visar en nästan horisontell, framåt utskjutande båge och två konvergerande stöd. | Räcket ombyggt till rundad horisontell båge, två däckfötter och korta infästningar vid takbrynet. Bågans exakta längd/rördiameter är fortsatt rekonstruktioner. |
| Täckboxens ytterkant gick utanför skrovet | Vid x=12,65, z=1,459 låg listen **116 mm utanför** skrovets planform. | Fyndet överlämnat till huvudagenten, som har smalnat av och passat in täckboxen. |
| Förarstolarnas skenor svävade | Skenornas underkant y=0,6275 mot plattform y=0,6000: **27,5 mm luft**. | Huvudagenten har lagt verkliga stöd mellan plattform och skena. |
| Fyra vindrutefält gav inget centralt fönster | Tidigare spröjs vid z=−0,66, 0, +0,66. 925 har ett centralt glasfält bakom räcket. | Tre fält implementerade av huvudagenten. |
| Maskinrumsluckorna låg för långt förut | Modellens tidigare lock x=1,60–3,40. De två inre U-formade lockkonturerna i tillverkarens äldre H-plan ligger ungefär x=0,94–2,83 m. En första avläsning till x=3,80 blandade ihop luckorna med de längre minräls-/däcksgränserna; den avläsningen är uttryckligen återtagen efter oberoende detaljgranskning. | Skrovagenten har samordnat öppningar, lock, gångjärn och försänkningar till x=0,95–2,85 m. Detta är bildmätta uppskattningar, inte originalets tillverkningsmått. Detaljbild: `tmp/cad-sources/engine-plan-detail.png`. |
| Tredje stolens infästning saknade stöd nedåt | Ny mittstols gångjärnsblock låg ungefär 340 mm över plattformens överkant. | Huvudagenten har byggt plattor, stolpar och tvärfästen. Oberoende mätning visar bas mot plattform och sammanhängande stöd upp till gångjärn. Stolen flyttades 50 mm framåt, dynans djup minskades och de aktra grepphandtagen flyttades för att undanröja uppmätta kollisioner. Utökat svepprov godkänt. |
| Nya skopreglage skar först genom skärmen, därefter gasreglagegruppen | Verkliga triangelkorsningar vid skopa 0–20 % och vid flera oberoende kombinationer av gas/skopa. | Kompakt grupp inåt från gasreglagen, närmare ratten, i linje med referensens relativa ordning. Fyra fotpunkter står på konsolen; hus och rörliga handtag klarar 121 oberoende kommandokombinationer mot övrig hytt. Måtten är rekonstruerade. |
| Akterpollarna kolliderade med de flyttade maskinrumsluckorna | Den ursprungliga placeringen z=±1,45 låg över luckans gångjärn. Enbart z=±1,60 skulle i stället skära genom minrälsens ytterfläns. | Akterparet står nu på smalare fötter utanför minrälsen, z=±1,64. Minsta uppmätta marginal till skrovets planform är 6,67 mm. Inga triangelkorsningar mot övrig utrustning; maskinrumsluckorna provades i 21 lägen. |
| Pilotkameran låg för högt i förhållande till själva dynan | Tidigare dyna 1,12 m och öga 2,24 m gav 1,12 m mellan sits och öga. | Stolens överdel höjd 0,28 m på förlängt teleskop, fotstödet 0,18 m. Dyna 1,40 m, öga 2,24 m och huvudstödets överkant 2,155 m. Kameran följer en punkt i stolen. Hyttens yttre silhuett och stolarnas baser har behållits. Se antropometrisk avgränsning nedan. |

## Bestående verifiering som har lagts till

`tools/fitcheck.js` kontrollerar nu också:

- 59 däckkontakter inklusive fyra greppbågsfötter och två främre räckesfötter.
- Radarfotens fyra hörn mot de faktiska taktrianglarna i hyttmodulen.
- Greppbågarnas verkliga rörändar mot sina fotplattor.
- Fördäcksluckans sargunderkant mot däckets byggda geometri genom hela knäckningen.
- Att sarg och lock hålls innanför skrovets planform.
- Att mittre räckesbågen ligger horisontellt och skjuter framåt, i stället för att återgå till en stående rektangel.
- Faktiska instanser av upprepade delar, exempelvis rampkedjans länkar, med varje instansmatris applicerad före skrovkontrollen.

`tools/door-clearance-test.js` kontrollerar:

- Dörrblad, lås och handtag mot verkliga fasta hyttmeshar under 21 lägen mellan stängt och öppet.
- Att själva kollisionsdetektorn hittar en avsiktligt insatt provkropp.
- Mittstolens svep mot närliggande fasta hyttdelar, inklusive dörrpost, grepphandtag och plattformar, samt fri mittgång i stuvat läge och blockerad gångväg när stolen är nedfälld. Lokal kontakt vid själva lagringen tillåts separat.
- Motor- och skopspakarnas hela rörelse mot alla tre monitorerna.
- Skopreglagets fyra fotpunkter mot den verkliga konsolytan samt hela huset och handtagen mot närliggande hyttdelar i 121 oberoende gas-/skopkombinationer.

**Slutlig oberoende körning efter skrovagentens sista nischer/dörrvred och huvudagentens stolhöjning:** 19 referenskontroller, 8 hyttkontroller, 21 interiörkontroller och 5 tvärgående svep-/kontaktkontroller godkända. Passningskontrollen godkänd: inga oväntade skrovöppningar, inga kontrollerade skrovdelar utanför skalet och 59 däckkontakter. Dörrens kontroll omfattar nu 35 närliggande fasta hyttmeshar, mittstolens 7. Efter varje dörrvinkel körs även mekanismuppdateringen så att de roterande vreden verkligen följer med. Testet använder korsningar mellan rörliga triangelkanter och fasta trianglar; det är inte en fullständig mekanisk CAD-kollisionslösare.

### Sittande öga och stolshöjd

HEXM-GA:s hyttsnitt visar en sittdyna ungefär 1,0–1,1 m under taket. Det ger stöd för en högre stol, men fastställer inte den svenska H-stolens exakta originalmått. Den valda höjningen till 1,40 m är en dokumenterad rekonstruktion. Ögat 0,84 m över dynan representerar en lång sittande person. NASA:s sammanställning av sittande ögonhöjd innehåller flygarpopulationer med 95-percentil omkring 0,84–0,847 m; detta är **antropometriskt stöd för kameraposen, inte ett CB90-mått**. Källa: [NASA, Anthropometric Source Book, volym II, tabellen “Eye heights — sitting”](https://ntrs.nasa.gov/api/citations/19790005540/downloads/19790005540.pdf). Kamerapunkten följer nu stolens geometri i stället för en fristående höjdkonstant.

## Akter och vattenjet

Profil, plan, aktervy och översikter har renderats i `tmp/audit-independent/all-after/`. Akterplattform, minräls, två vattenjetaggregat och separata räcken stämmer i huvuddrag med 845-bilden. Ingen säker tillverkarmåttsättning av 845:s vattenjetinfästningar eller akterbeslag har hittats i det granskade underlaget; de har därför inte flyttats utifrån perspektivgissningar.

En oberoende temporär geometriundersökning finns i `tmp/audit-independent/jet-intersections.js`. Den provade fem styrutslag (−30°, −15°, 0°, +15°, +30°) och fem bucketlägen mot akterplattform, badstege och akterbeslag utan uppmätta triangelkorsningar. I en separat kontroll av båda bucketarnas gemensamma lägen var minsta laterala mellanrum mellan deras omslutande lådor cirka 52 mm. Dessa resultat visar intern passform i modellen, inte att jetaggregatens verkliga mått är bekräftade.

Mörk **845**-märkning har behållits eftersom den syns på en ljus kamouflageyta i den styrande 845-illustrationen. Vita siffror på 925 och 113 sitter på andra färgfält/utföranden och är inte tillräcklig grund för att ändra 845:s märkning.

## Kvarstående gräns för exakthet

- Ingen komplett original-CAD eller måttsatt spant-/linjeritning har ingått i denna granskning. Undervattenssektioner, lokal bordläggning och flera dolda ytor är fortfarande rekonstruktioner.
- Ett foto fastställer synlig form och inbördes placering, men inte varje absolut beslagmått, materialtjocklek eller skruvdiameter.
- Den dokumenterade kombinationen svensk H / 845-märkning / 925-fördäck är användarens valda visuella riktning. Den ska inte beskrivas som en verifierad kopia av en enskild båt med en enskild konfiguration.
- Tillverkarbladets 803, svensk 845/925 och CB90HEXM har utrustningsskillnader. Exportspecifika smådetaljer får inte importeras enbart för att ritningen är skarp.
- Procedurkamouflage, instrumentens utformning, dolda ledningar och vattenjetens interna detaljer saknar tillräckligt underlag för påståendet "varje detalj och varje mått exakt".
