# Referensgranskning av svensk Stridsbåt 90 H, 2026-10-20

> Publiceringsnotis: Filnamn under Referens/, shots/, tmp/ och backups/ avser lokalt granskningsmaterial som inte distribueras. Källänkar och rapportens egna slutsatser finns kvar; se [licensinformationen](../../THIRD_PARTY_NOTICES.md).

Denna granskning skiljer publicerade mått från avläsningar och okända mått. Den är en käll- och geometrikontroll, inte ett intyg på en exakt tillverkningsmodell. Den ändrar inga modellfiler.

## Styrande utförande

Användaren har under arbetet bekräftat **svensk CB90H**, med fördäcket efter fotografiet av **925**. Den nyare ritningen används som stöd för gemensamma proportioner. Projektets 845-identitet och möjligheten att visa eller dölja fördäcksvapnet med täckbox i av-läget kvarstår.

| Underlag | Vad det faktiskt visar | Tillåten användning i modellen |
|---|---|---|
| `Referens/fordack-925.png` | Detaljfoto av fördäck och hyttfront på 925 | Styrande för den synliga fördäcksutrustningen, gångutrymmen, räcket och täckboxen; ger inga absoluta småmått |
| `Referens/combat-boat-cb-90-h-fast-assault-craft.jpg` | Borgs perspektiviska genomskärning märkt 845 | Identitet, äldre svensk utrustning och synliga relativa placeringar; inte en måttsatt ritning |
| `Referens/additional/shk-rm2008-02-stridsbat848.pdf` | SHK RM2008:02 om svensk 848, olyckan 2006; använder samma Borg/845-genomskärning och återger Båthandbokens förpiksskiss | **Styrande skriftlig primärkälla för äldre svensk H**: huvudmått, 20-stolslayout, tre hyttplatser, monitorfördelning och luckornas mekaniska uppbyggnad. Individmått för 845 är fortfarande inte styrkta |
| `Referens/cb-90-h-product-sheet.pdf` | Dockstavarvets äldre produktblad, profil/plan märkt 803 och foto av exportbåt | Gemensam H-silhuett och plan; utrustningen och huvuduppgifterna är inte en individuell specifikation för 845 |
| `Referens/cb90h-ga-saab-original.jpg` | **CB 90HEXM**, generalarrangemang, 2020-05-26, ritning 100-1 | Stöd för grundläggande skrov-, däck- och hyttproportioner; ingen automatisk överföring av exportbåtens drivlina, utrustning eller inredning |
| `Referens/Stridsbåt_90.jpg` | Svensk båt 826 | Gemensamma synliga H-former, lackerade beslag och utrustning; inte måttsättning |
| `Referens/official/SHK-2026-02-Stridsbat90.pdf` | Statens haverikommissions rapport om svensk 826, byggd 1993; aktuell inredning/SeaCross | Starka belägg för svensk H-layout och publicerade huvudmått; modern elektronik får inte antas tillhöra Borgs äldre 845 |
| `Referens/manufacturer/CB90H-113.jpg` | Tillverkarfoto av exportbåt 113, sedd snett framifrån | Tydligt stöd för tre främre rutor, topplacerade torkar, korta gummiskydd och gemensamma beslag. Exportutrustningen styr inte 845 |
| `Referens/additional/user-centered-helm-design-2025.pdf` | Examensarbete med intervjuer på Dockstavarvet och en särskilt märkt illustration av befintlig förarmiljö | PDF-sida 16/tryckt s.14 styrker två gas- och två skopreglage samt nuvarande panelplacering. Senare koncept och konkurrerande båtars miljöer är **inte** CB90-original. Moderna digitala instrument får inte föras över till äldre 845 utan reservation |

Primärkällor:

- [Dockstavarvet, CB90H specifikation](https://www.dockstavarvet.se/products/combat-and-patrol-boats/combat-boat-90-h/specification/).
- [Dockstavarvet, produktbladet](https://www.dockstavarvet.se/wp-content/uploads/2015/01/cb-90-h-product-sheet.pdf).
- [Saab, produktsidan som publicerar CB90HEXM_200526_GA](https://www.saab.com/products/docksta-cb90).
- [SHK 2026:02, officiell PDF](https://shk.se/download/18.4687375319b230b9ea91400/1770186115871/SHK%202026_02%20Slutrapport%20Stridsb%C3%A5t%2090.pdf).
- [SHK RM2008:02, officiell PDF](https://shk.se/download/18.2d6f089b18faca29dc81a571/1698926603898/10264848_rm2008_02.pdf). Sidnummer nedan avser rapportens tryckta sidor, vilket är PDF-sidnumret minus ett.
- [Examensarbetet om CB90:s förarmiljö, 2025](https://www.diva-portal.org/smash/get/diva2%3A1999131/FULLTEXT02.pdf), särskilt tryckt s.14/PDF-sida 16 och fig.2 som beskriver befintlig miljö.
- [Tillverkarens fotografi av 113](https://www.dockstavarvet.se/wp-content/uploads/2015/01/CB90H-113.jpg).
- [Försvarets forum 3/2015, s.50–51](https://www.forsvarsmakten.se/siteassets/3-aktuellt/forsvarets-forum/2015/forsvarets-forum-3-2015.pdf): text och faktaruta återfinns i sökmotorns index; direkt hämtning misslyckades under denna granskning. Uppgifterna om 20° bottenvinkel och 5,3 m masthöjd har därför inte kontrollerats i en lokalt renderad original-PDF.

## Publicerade huvudmått och motsägelser

| Mått | Primärbelägg | Modell före denna arbetsomgång | Bedömning |
|---|---|---|---|
| Längd över allt, svensk H | SHK RM2008:02 s.12 och SHK 2026:02 s.11: **15,9 m** | `LOA=15.9` | Behåll svensk H. HEXM-ritningens 16,3 m hör till annan konfiguration |
| Konstruktionsvattenlinjens längd | SHK RM2008:02 s.12: **13,00 m** | Ursprungligen 13,25 m; **rättat till `LWL=13.0` och kölens y=0 vid x=13,00** | Den nominella vattenlinjelängden är nu korrigerad till det skrivna måttet. Fullständiga undervattenslinjer/flytläge är fortfarande inte verifierade mot en lines plan |
| Skrovlängd | HEXM-ritningen uttryckligen **14,9 m**; äldre Docksta-blad anger 14,90 m men benämner det LOA | `LH=14.9`; faktisk huvudskalgeometri x=0…14,87 | Nära rätt. Gamla produktbladets LOA-begrepp får inte användas för att radera de aktra utsprången i 15,9 m-definitionen |
| Bredd | SHK s.11 **3,80 m**; äldre produktblad **3,85 m**; HEXM **3,82 m OA** | skalets största bredd **3,800 m** | Svensk huvuduppgift stämmer. Moulded/OA och olika varianter ger 2–5 cm skillnad; det är inte belägg för att godtyckligt bredda båten |
| Djupgående | SHK s.11 **max 0,8 m**, men löptext s.22 säger ungefär 1 m | `DRAFT=0.8`, köl y=−0,8 | Utgå från tabellens 0,8 m. Last/vattenlinje och textens avrundning är inte fullständigt definierade |
| Bottenvinkel akter | Försvarsmaktens publicerade artikel beskriver produktionsvalet **20°** | `atan2(0.55,1.50)` = **20,136°** | Mycket nära; hela spantformen är fortfarande inte verifierad |
| Höjd till masttopp | Försvarets forum anger **5,3 m**, utan utförlig datumdefinition i faktarutan | stolpens topp y=4,45; översta lampans faktiska topp y=4,554; från kölen **5,354 m** | Ingen stor höjdändring motiverad. Lampans överkant och stolpens topp är olika mätpunkter |

SHK 2008:s tabell anger för äldre 848 två Scania DSI14 à 460 kW och två FF Jet 450; även 2026:s tabell anger för 826 två DSI14 V8 och två FF-Jet 450. Den allmänna beskrivningen 2026 s.22 nämner FFJet 450/410. Därför kan modellens beteckning “FF-410 class” inte påstås vara exakt verifierad för 845, och en annan synlig aggregatgeometri får inte härledas enbart ur denna typsiffra.

## Skala och datumsystem

**HEXM-ritningens numrerade tickar är inte en jämnt indelad meterskala.** De inledande etiketterna är 0, 1, 2, 3, 3½, 4, … med olikstora avstånd. De fungerar som spant-/stationsbeteckningar. Skalning bör utgå från skrivet 14,9 m skrovlängd samt de faktiska ändpunkterna, inte genom att läsa etikett 4 som x=4,0 m. Den långa linjen under profilen är en ritningsbaslinje, inte vattenlinjen.

För originalet 1920×1280 ger skrovets akter-/förpunkter ungefär 50,3–50,7 pixlar per meter. Val av akterspegelns lutande över-/underkant skapar några centimeters osäkerhet. Höjder kan jämföras relativt kölen utan att införa en obestyrkt vattenlinje. Titelblockets tryckskala kan inte användas direkt på den webbreskalade bilden.

Det äldre H-bladet har däremot en explicit meterskala i planbilden. `pdfimages` extraherar den inbäddade profilbilden till `tmp/pdfs/h-product-image-003.png` (750×275). Profilens huvudskrov är ungefär 648 pixlar långt för 14,9 m: cirka **43,5 px/m**. Följande ungefärliga rasterdatum är oberoende av modellens konstanter:

| Del, äldre H-profil | Bildrad/avläsning | Höjd över ritad vattenlinje | Befintlig modell |
|---|---:|---:|---:|
| Ritad vattenlinje | y≈229–230 px | 0 | 0 |
| Köl akter | y≈263–265 | −0,78…−0,83 m | −0,80 m |
| Hyttakets huvudplåt | y≈121–124 | 2,43…2,51 m | 2,50 m |
| Mellandäckets översida | y≈155–157 | 1,66…1,72 m | 1,65 m |
| Akterdäck | y≈181–184 | 1,03…1,13 m | 1,07 m |
| Skrovets relingslinje midskepps | y≈168–170 | 1,36…1,43 m | 1,34 m |

Linjetjocklek, identifieringen av ovansida/undersida, komprimeringen och variantöverföringen ger större osäkerhet än en enda pixel. En praktisk avläsningsmarginal på omkring **±0,08 m** för de stora formerna är rimlig; den är ingen tillverkningstolerans. De befintliga grundhöjderna ligger nära detta H-underlag. Att ersätta dem med nygenererade “exakta” tal skulle skapa falsk precision.

Den äldre H-planens hyttbredd är ungefär 2,6–2,7 m vid basen och 2,3 m vid taket. Den befintliga tvärskalan 0,90 ger 2,61 m respektive 2,25 m. Gångpassagerna blir ungefär 0,5–0,6 m beroende på längdläge och sockel. Detta stämmer betydligt bättre med både planbilden och 925-fotografiet än en hytt nära hela skrovbredden. En exakt passagebredd för 925 kan inte mätas ur perspektivfotot.

### Oberoende kontroll av konstruktionsvattenlinjen

Förstävens skärning med den gamla H-profilens vattenlinje skyms delvis av ett kraftigt svart beslag/symbol. Den får därför inte avläsas enbart från den mörka fläckens ytterkant. I originalrastret ligger vattenlinjens mitt vid y=229,5 px. En linjeanpassning till 31 synliga punkter på den nedre stävkonturen, i intervallen x=610–628 och 650–661 px, ger korsning x≈638,8 px (restspridning cirka 0,3 px). Med akterspegelns vattenlinjepunkt x≈70 px och skalan 43,5 px/m blir den avlästa vattenlinjelängden **cirka 13,08 m**. Den statistiska restspridningen är inte hela felet: linjetjocklek, rasterdatum, vald transompunkt och variantöverföring ger en rimlig praktisk gräns på cirka **±0,08 m**, ungefär 13,00–13,16 m.

Det skrivna svenska KVL-måttet 13,00 m är förenligt med detta lågupplösta H-underlag. Modellens ursprungliga 13,25 m saknar stöd av denna oberoende kontroll. **Korrigeringen är genomförd:** y=0 är konstruktionsvattenlinje och förfotskurvan passerar denna vid x=13,00, med `LWL=13.0` i konstanterna. Däck, ramp och hytt har inte flyttats för denna korrigering. Det verifierar det nominella måttet, inte varje mellanliggande skrovtvärsnitt.

En annan lastvattenlinje kan inte påstås vara förklaringen utan belägg. SHK 2008 anger 13,00 m KVL och 0,80 m djupgående men binder inte uttryckligen dessa två mått till exakt ett av de angivna deplacementen 13,2/15,3/18,2–20,5 ton. I den ursprungliga modellen krävs vattenlinjen y=−0,18 för att nå längden 13,00 m, vilket då ger djupgåendet 0,62 m. Detta är inte samma datum som den befintliga modellens 0,80 m. Tillverkarbladet anger 18 ton utan att definiera vilken last dess ritade vattenlinje representerar. Bildgranskningen finns i `tmp/pdfs/h-product-image-003-bow-coordinates.png`.

### Förluckornas främre kant och fri landstigningsgång

I det gamla H-planrastret går det centrala luckfältet fram till den främre tvärlinjen vid bild-x≈715 px. Med skalans nolla vid x≈72 och 43,5 px/m motsvarar detta **båt-x≈14,78 m**, praktiskt ungefär ±0,05 m för denna avläsning. Ingen fast tvärbro visas från x=14,38 till 14,77. Även 925-fotot visar luckbladen fram till det smala tvärbeslaget vid rampkanten. Den ursprungliga modellöppningen `OPEN.bow.x1=14.38` lämnade en för lång fast däckremsa över landstigningsgången. **Korrigeringen är genomförd:** öppningen slutar nu vid `M.STEM_X-.10` = 14,77 m och luckbladens längd räknas fram till samma kant. `shots/hardware-2026-10-20-final/corridor.png` visar en fri passage till den öppna rampen utan den gamla fasta tvärbron. Underlaget är `tmp/pdfs/h-product-image-004-bow-coordinates.png`.

## Rättade avvikelser och styrande källval

1. **Tre främre rutor.** 925-fotot har två mellanliggande spröjsar och en verklig mittruta. De synliga framrutornas gränser ligger ungefär vid foto-x=470, 795, 1160 och 1410; perspektivet gör bildbredderna olika. Fotot av 113 samt frontvyn i HEXM stöder samma tredelning. Modellen har nu korrigerats från fyra till **tre** rutor utan mittspröjs över centrumlinjen.
2. **Torkarnas infästning.** Tillverkarfotot av 113 visar torkar upphängda ovanifrån; den ursprungliga modellen hade nedre pivoter. Modellen har nu tre torkfält med övre infästningar. Exakta armlängder och svängradier är inte måttsatta.
3. **Äldre H har 9+9+2 truppstolar.** SHK RM2008:02 s.12 anger nio stolar längs varje sida, med passagerarna sidledes i färdriktningen, plus två framåtvända stolar utefter aktra skottet. Inga truppstolar har bälten i detta utförande. Projektets gamla anteckning “fyra tvärs × fem rader, framåtvända” är fel. SHK 2008 s.44 beskriver en senare FMV-order som minskar tillåtet passagerarantal från 20 till 18; SHK 2026 s.23 nämner endast nio per sida. 20-stolslayouten är väl belagd för den äldre H som är projektets referens, men ska inte marknadsföras som alla nutida H-båtars möblering. Minskad tillåten kapacitet bevisar inte i sig att två stolar omedelbart demonterades på varje båt.
4. **Hyttens tre platser är olika.** Dockstavarvets H-specifikation och SHK stöder förare styrbord, navigatör babord samt en fällbar mittplats. Tre identiska fasta pilotstolar är inte rätt. SHK anger midjebälten på dessa tre platser.
5. **Täckbox, räcke och kort gummi från 925 har företräde framför export-GA.** Varken den nyare planens annorlunda akterplattform eller dess utrustning ska införas som en “rättning” av svensk H.

## Detaljregister för äldre svensk H

Detta register dokumenterar vilka detaljer som kan korrigeras med källstöd. Det är inte en realtidslista över vad som redan är implementerat; kod och tester ändras parallellt. “Hög” avser detaljens existens/huvudplacering, inte exakta småmått.

| Del | Belägg och fysisk uppbyggnad | Tillförlitlighet och gräns |
|---|---|---|
| Förarens instrument | SHK 2008 s.12: styrbord, en monitor för radar eller navigation, ratt, motor-/vattenjetreglage, kompass, **roderindikator** och motorinstrument | Hög. Exakta instrumentdiametrar och 845:s analoga motorinstrumentplacering är inte måttsatta. Två stora RPM-tavlor centralt mellan operatörerna är inte belagda av texten |
| Navigatörens panel | SHK 2008 s.12: babord, **två monitorer**, en för radar och en för elektroniskt sjökort, styrda med tangentbord | Hög. Undvik att låta senare SeaCross-gränssnitt från 2019/2026 definiera äldre skärmgrafik |
| Mittstol och bälten | SHK 2008 s.12: fällbar stol mellan förare/navigatör; samtliga tre hyttstolar har midjebälten | Hög. Fällningens exakta beslag och stolens småmått saknas |
| Magnetkompass | SHK 2008 s.12 och s.20 styrker existensen. SHK 2026 s.24 placerar den i taket framför föraren | Hög för existens, medel för överföring av den senare takplaceringen till äldre 845. Form och fästets dimensioner okända |
| Gas och skopor | Examensarbetet 2025 tryckt s.14, fig.2/§2.3.4: **två gasreglage och två separata skopreglage** till höger om ratten, skopreglagen närmare ratten än gasreglagen | Hög för källans befintliga CB90-miljö; medel för exakt utförande på äldre 845. SHK 2008 stöder separata funktioner men anger inte spakarnas form/mått |
| Modern motorpanel | Samma 2025-sida: två motorskärmar på panel direkt till höger om stolen, under sittdynans nivå; navigationsknappsats och styrkula på stolens armstöd | Hög för den moderna referensen. **Inte** belägg för att byta äldre 845 till digitala motorpaneler eller exakt denna stol |
| Förpikens vattentäta dörr | SHK 2008 s.14–15: gångjärn styrbord, öppnar akterut in i transportutrymmet, gummipackning runtom, **fyra** fartygsvred med stopplägen och låskilar | Hög; fig.5 s.17/fig.7 s.18 visar ett nedre centrumvred och två vred på fria babordskanten. Modellen är nu rättad till detta asymmetriska arrangemang. Översta vredets exakta läge är skuggat och den modellerade övre centrumplaceringen är märkt som rekonstruktion |
| Förpikens stuvningsfält | SHK 2008 s.17 fig.4 märker två sidofält som stuvningsutrymmen: ett lågt bakre rektangulärt och ett större högre trapezoidfält. Två mindre främre fält syns i samma schematiska sida. Fig.5 visar grön tamp i styrbords bakre nisch samt ett mörkt främre sidofält | Två verkliga nischer med grön tamp i den bakre är nu införda på styrbord och visuellt kontrollerade. Schemat saknar sidetikett; exakt speglad serie på babord kan inte intygas och har inte införts. Nischmått och djup är rekonstruktion |
| Stävluckornas upphängning | SHK 2008 s.15, Båthandboksskiss fig.4 s.17: två luckor, gångjärn vid respektive utbordskant, gasfjädrar och luckspärrar | Hög. Exakta slaglängder, rördiametrar, gångjärnsavstånd och öppningsvinkel är inte publicerade |
| Stävluckornas överlapp/lås | SHK 2008 s.15 och fig.8–10 s.18–19: babordsluckan låser styrbordsluckan; stäng styrbord först. Babords manöverhandtag driver längsgående spanjolett med främre/aktra gafflar, spärrbeslag och karbinhake | Hög. Figurerna visar verkliga beslag. S.44 anger senare modifiering av gaffelfästning och handtagssäkring; inget stöd för att återge skadade/lösa olycksdetaljer |
| Stävport/ramp | SHK 2008 s.15/fig.4: **två** gångjärn vid rampens akterkant, **två** bärande kedjor i öppet läge, rep och talja för manövrering, två excenterlås vid främre sidokanterna | Hög. En genomgående ensam gångjärnscylinder är inte en korrekt ersättning för två beslag; exakta kedjelänkmått/taljdimensioner saknas |
| Rampens tätning | SHK 2008 s.15: gummipackning runtom samt till skrovet bultade stoppklackar. Stävluckorna håller excenterlåsens handtag nedtryckta när stängt | Hög. Tätningsprofil och tjocklek är inte specificerade |
| Transportlucka | SHK 2008 s.15: stor lucka akter på upphöjda transportdäcket, gasfjädrar och låsvred från in- eller utsidan | Hög för mekanisk princip; foton/GA behövs för placering av varje fäste |
| Hyttaksluckor | SHK 2008 s.15: två, över respektive förare/navigatör, kan endast öppnas/låsas från insidan | Hög. Externa doghandtag som ser ut att manövrera låset strider mot texten; ett lyfthandtag är inte automatiskt ett utvändigt lås |
| Motorluckor | SHK 2008 s.15: en karmförsedd nedgångslucka långt akterut plus två stora arbetsluckor **utan karm i däckshöjd**, låsta med nedsänkta nyckelvred; dessutom små excenterlås inne i motorrummet | Hög. Höga karmar och generiska ovanpåliggande låsvred bör inte användas för de två arbetsluckorna |
| Ringlavett | SHK 2008 s.12: lättmetallring på drygt en meter höga stöttor akter om hytt, ryggstöd som följer 360° rotation | Hög för uppbyggnad och ungefärlig höjd; exakt ringdiameter/antalstöttor kräver bildstöd |
| Räddningsutrustning | SHK 2008 s.19: fyra livflottar av typ 6 D, två livbojar | Hög för äldre H:s antal. Behåll dessa antal om modellen redan har dem; inga fria extratillägg |

Figurernas återgivning av förpiken finns som lokala sidbilder i `Referens/additional/shk-2008-pages/page-17.png` till `page-20.png`. PDF-sida 18/tryckt s.17 innehåller den viktigaste Båthandboksskissen och intakt båt med uppställda luckor. Den moderna förarillustrationen ligger i `Referens/additional/helm-thesis-pages/page-16.png`.

## Slutlig bildkontroll av fördäcket

Renderingen `tmp/audit-independent/equipment-after/cover.png` och därefter samtliga fem bilder i `shots/hardware-2026-10-20-final/` granskades mot 925-fotot, tillverkarfotot av 113 och SHK 2008 fig.4–8. Den korrigerade horisontella, rundhörnade skyddsbågen framför fönstren och dess två diagonala ben har nu rätt konstruktionsprincip. Täckboxen ligger på rätt sida och har motsvarande breda plana/snedställda ytor. Gummiskyddet är begränsat till stävens främre hörn, och sidopassagen är fri. Detta är en kvalitativ överensstämmelse; 925-fotot är perspektiviskt, beskuret och saknar måttskala, så det fastställer inte räckets exakta bredd, utsprång eller rördiameter och inte täckboxens exakta höjd.

Den senaste bildserien visar även fri landstigningsgång, två öppningsbara sidoluckor med gasfjädrar, babords spanjolett, rampens två kedjor och talja samt trappsteg. Tampen har fått fler överlappande varv efter den tidigare granskningen. Den är fortfarande en stiliserad lös stuvningsdetalj; dess förflyttning med luckbladet är en visningsförenkling.

Två sista källbelagda detaljfynd har därefter åtgärdats och kontrollerats i `shots/hardware-2026-10-20-stowage/stowage.png` och `stowage-detail.png`: förpikens två styrbordsnischer är riktiga öppningar med lämpliga huvudformer och grön tamp i den låga bakre nischen; dörren har nu asymmetriska vred med ett nedre centrumvred och två på den fria babordskanten. Översta centrumvredets läge, nischernas exakta mått och deras djup är fortsatt rekonstruktion. Ingen obelagd spegling av nischerna till babord har gjorts. Inga ytterligare säkert källbelagda formfel hittades i dessa senaste bilder. Detta är en avgränsad visuell kontroll av fören och de visade interiördelarna, ingen certifiering av hela båtens varje mått.

## Kvarstående okända mått

- Ingen granskad källa innehåller en fullständig offsettabell/spant- eller linjeritning som bevisar varje bottentvärsnitt, slagradie och plåttjocklek.
- Exakta individuella mått för 845:s luckkarmar, fästen, svetsar, lås, rördiametrar, gångjärn, glasradier och packningar är inte publicerade i dessa bilder.
- SHK 2008 s.14 uppger uttryckligen att SHK inte fått dimensioneringsunderlag för stävporten, stävluckorna och stängningsanordningarna. Att de beskrivs i rapporten innebär alltså inte att deras samtliga mått är kända.
- En handlänspump nära förpikens dörr nämns i händelseförloppet, men dess lokala form/fäste saknar tillräckligt bildstöd. Dolda installationer bör märkas som schematiska eller utelämnas tills underlag finns.
- HEXM:s genomskärningar visar nivåskillnader mellan central passage och upphöjda förarplattformar, men är ingen måttsättning för 845. Befintlig plattform y=0,60 och mittgång y=−0,30 ger 0,90 m nivåskillnad; en ytterligare höjning måste motiveras av svensk hyttgeometri, sätesergonomi och foton tillsammans.
- Skrovmärkning 845, utrustning som avlästs på 925 och proportionsstöd från andra H-båtar är en uttryckligen vald referenshierarki, inte bevis på att alla dessa detaljer satt på en historisk individ samtidigt.
- Färger, glans, kamouflagemönster på osynliga ytor och förslitning kan inte göras mätverifierat exakta med aktuella fotografier.

Godkända geometriska tester kan visa passform, fri gång och fungerande luckor. De kan inte uppgradera osourcade mått till verifierade originalmått.
