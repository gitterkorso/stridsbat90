# Stridsbåt 90 H / HS (CB90) – Topside equipment research

> Publiceringsnotis: Filnamn under Referens/, shots/, tmp/ och backups/ avser lokalt granskningsmaterial som inte distribueras. Källänkar och rapportens egna slutsatser finns kvar; se [licensinformationen](../../THIRD_PARTY_NOTICES.md).

Scope: everything on deck and on the wheelhouse of the Swedish Stridsbåt 90 H / 90 HS (Combat Boat 90 H), with notes on the 90 HSM where it differs. Written for the Three.js articulated-model team.

Conventions used below:

- **x** = metres aft of the stem (bow tip at deck level = 0, transom ≈ 15.9 for a 90 H).
- **y** = metres from centreline (+ = starboard).
- **z** = metres above the keel baseline ("från botten" as the Swedish sources put it). Waterline (WL) is at z ≈ 0.8 m at the design draught, so "height above WL" = z − 0.8.
- Confidence: **high** = quoted from a primary/official source; **medium** = stated by a secondary source or consistent across several sources; **low** = my estimate from photo proportions.

Where a number is an estimate it is marked *(est.)* and the reasoning is given so the modeller can override it after checking reference photos (which this report could not download).

---

## 1. Key overall dimensions (frame of reference)

| Item | Value | Source / confidence |
|---|---|---|
| Length overall (90 H / 90 HS) | 15.9 m | SHK reports, sv.wikipedia, soldf.com – high |
| Length overall (90 HSM / CB90 NG) | 16.3 m (longer bow ramp/door) | Saab, naval-technology – high |
| Hull length | 14.9 m | Dockstavarvet, Saab – high |
| Length in design waterline (KVL) | 13.00 m | SHK RM 2006:01 / RM 2008:02 – high |
| Beam max | 3.80 m (Dockstavarvet quotes 3.85 m incl. rubbing strake) | high |
| Draught | 0.8 m (90 H) / 0.9 m (90 HSM) | high |
| Displacement 90 H | 13.2–13.3 t light, 15.3 t "rustad", 18.2–20.5 t loaded | SHK / soldf – high |
| Heights "from bottom" (soldf.com fact box) | mast top 5.0 m; mast foot 3.8 m; aft deck 2.8 m; chine ("slag") forward 1.6 m; chine aft 0.55 m | soldf.com – medium (see §2.2 for the reconciliation problem) |
| Total height | "less than 4.5 meters" | Dockstavarvet spec page – medium (probably air draught with mast raised: 5.0 − 0.8 = 4.2 m above WL, consistent) |
| Hull material | all-welded aluminium on extruded profile frames | SHK 2008 – high |

### 1.1 Deck levels (the "stepped" profile)

Primary sources (SHK RM 2008:02 §1.6.5, RM 2006:01) describe **three exterior deck levels plus the wheelhouse roof**, from bow to stern:

1. **Foredeck** (over the forepeak): carries the two bow deck hatches ("stävluckor") and, immediately in front of the wheelhouse windscreen, the recessed **twin 12.7 mm mount**. Low freeboard bow with the bow door/ramp ("stävport") in the stem.
2. **Wheelhouse ("styrhytt")**: set well forward, roughly the second quarter of the hull. Roof at z ≈ 3.8 m (mast foot height). Two roof hatches, radar arch, folding signal mast, antennas.
3. **Raised mid-deck** – "det upphöjda däcket över transportutrymmet" (the raised deck over the troop compartment). Carries the **ring mount ("ringlavett")** on ~1 m struts immediately aft of the wheelhouse, railings, and at its aft edge the big **troop hatch** ("nedgångslucka till transportutrymmet"). On the HSM the Trackfire RWS sits here.
4. **Aft deck** (over the engine room, roughly the aft 25 % of the hull): one **coamed engine-room access hatch far aft** plus **two large flush "work hatches"** just aft of the troop hatch; mine rails (90 H), cargo space (1 t deck load allowance), stern bollards.

So the profile is: low bow → tall wheelhouse block → step down to the raised mid-deck → step down again to the aft deck → transom with waterjets. The "raised front section" the team refers to is the wheelhouse itself; the roof over the crew seats is the highest fixed structure on the boat.

My reconciled height estimates *(low confidence – see discussion)*:

| Level | z above keel (est.) | Above WL | Notes |
|---|---|---|---|
| Foredeck at wheelhouse front | ≈ 2.3 m | ≈ 1.5 m | Must give crouching headroom over the passage to the ramp |
| Wheelhouse roof | 3.8 m | 3.0 m | soldf "mastfot 3,8 m" – medium |
| Raised mid-deck | ≈ 2.4–2.8 m | ≈ 1.6–2.0 m | soldf gives "akterdäck 2,8 m"; but the 90 H troop room is known to be *too low to stand in* (HSM raised it), which argues for ≈ 2.4 m. Check photos: ring-mount gunner's shoulders are roughly at wheelhouse-roof level, i.e. roof ≈ 1.3–1.5 m above this deck. |
| Aft deck (engine room roof) | ≈ 2.1–2.3 m | ≈ 1.3–1.5 m | One step (≈ 0.3 m) below the mid-deck |
| Transom top edge | ≈ 2.1 m | ≈ 1.3 m | |

---

## 2. Wheelhouse (styrhytt)

### 2.1 Layout and shape

- Built around **two operator positions**: helmsman ("förare") **starboard**, navigator **port**, with a **fold-down centre seat** between them for the engineer/boat commander (SHK RM 2004:01, 2006:01, 2008:02, 2026:02 – high). The three seats have lap belts.
- The wheelhouse is entered from the troop compartment; there is **no external door**. A central gangway between the two seats leads forward *under the foredeck* to the bow ramp ("går genom en gång som går mitt emellan de båda förarna och vidare under fören ut på en fällbar ramp i bogen" – soldf.com, high).
- **Roof hatches:** "Styrhytten har två luckor i taket över resp. förarstol styrbord och babord. Dessa luckor kan enbart öppnas och låses från insidan." – two hatches in the roof, one above each crew seat, opening/locking from inside only (SHK 2008 – high). They are big enough for a person in a lifejacket (SHK tested this) – model them at roughly 0.5 × 0.6 m *(est.)*, hinged at the forward edge *(est.)*. The 2006 report notes crews talk to people on deck "genom lucka i styrhyttstak" – so they are normally used open at low speed.
- Overall size *(est., low)*: length ≈ 3.0 m (x ≈ 4.3 → 7.3 m), width ≈ 2.9–3.1 m leaving side decks of ≈ 0.35–0.45 m each side; height of the front face above the foredeck ≈ 1.5 m.
- Helmsman's console (SHK 2004 figure 3 labels): wheel, propulsor (waterjet) controls, engine rpm levers, **trim-plane controls ("trimkontroller")**, engine instruments, electronic compass, magnetic compass in the roof in front of the helm, **searchlight control ("sökljus")**, VHF, FM radio, radar/nav-system monitor. Navigator (figure 2 labels): radar-and-system monitor, **port wiper switch ("Bb torkare")**, navigation lamp, intercom panel.

### 2.2 Windscreen and side windows

- Sources confirm: the boat has "frontrutor" (front panes, plural), **windscreen wipers** (at least separate port and starboard wipers – "Bb torkare" – SHK 2004, high), and "windows on all of its sides" (fan wiki, low). The HS/HSM has **38 mm bullet-resistant glass in all panes** ("38 mm skottsäkert glas på samtliga rutor" – soldf/hhogman, high), which implies flat panes in heavy frames.
- Pane count and rake are **not documented in text sources**. Estimate from proportions *(low)*: the front consists of flat panes raked aft about 15–20° from vertical – a central pair (or one wide centre pane) plus one angled corner pane each side, i.e. **4–5 front panes**, with **2–3 pantograph wipers** on the main panes; **2 windows per side** (one long one beside the seats, a smaller one aft); no aft-facing windows apart from a small one in the aft bulkhead/door *(est.)*. Verify against a head-on photo before locking geometry.

### 2.3 Fittings on the wheelhouse roof

Confirmed items (with source):

| Item | Evidence | Position (est. unless noted) |
|---|---|---|
| **Radar antenna on an arch ("bågen som håller radarantennen")** | SHK 2006 (boat 867's radar arch and antenna were crushed by the bow of 929 riding up over the aft deck and wheelhouse roof) – high | Aft end of the roof, spanning the roof transversely, x ≈ 6.9–7.2, antenna axis z ≈ 4.4 (≈ 0.6 m above roof) *(est.)* |
| **Folding signal mast ("signalmasten var nedvikt")** carrying the navigation lights ("masten är rest då lanternorna är i drift") | SHK 2008 – high | Mast foot z = 3.8 m (roof), top z = 5.0 m → ≈ 1.2 m tall (soldf – medium). Folds down aft and is lashed *(direction est.)*. Centreline at the aft edge of the roof *(est.)* |
| **Port and starboard side lights ("lanternor")** | SHK 2006: "babords lanterna och GPS-antennen slets loss" – high | Aft corners of the wheelhouse roof / top of the side wall, z ≈ 3.8 *(est.)* |
| **GPS antenna** (puck/mushroom) | SHK 2006 – high | Aft end of roof, port side *(est.)* |
| **Searchlight ("sökljus")** with remote control at the helm | SHK 2004 – high | Front of roof, starboard of centre *(est.)* |
| **Signal horn, ship's bell ("skeppsklocka"), whip antenna, signal lamps** on the roof of early 90 H | IPMS Stockholm thread (aftermarket set "detaljer som saknas ovanpå bryggan: signalhorn, skeppsklocka, antenn och signallampor") – medium | Front/side of roof |
| **Radio whip antennas** | Fit: Ra 180F military VHF (30–88 MHz), marine VHF, LUFOR receiver (SHK 2008 §1.6.8) – high; 90 L command boats "recognisable by the many antennas and masts" (hhogman) – medium | 2–3 whips ≈ 1.5–2.5 m long on the roof / aft roof edge *(est.)*. The 90 HS is noted as having "antennas on the side railings" (IPMS) – medium |
| **Magnetic compass** visible in the roof inside, front centre | SHK 2026 – high | Interior detail only |

### 2.4 Navigation radar

What is known:

- Swedish designation **PNM-858 ("Helge" radar)**; surface-search/navigation radar with **ARPA** (SHK 2004/2006/2008: "radar med ARPA-funktion"); listed maximum range 46.3 km / 25 nm (cmano-db snippet – medium).
- Make: the soldf.com Stridsbåt 90 E page states the 90 H carries a **DECCA (Racal-Decca) radar** whereas the 90 E has a Furuno ("Till skillnad mot STRB 90H är STRB 90E inte utrustad med en DECCA radar utan en Furuno radar") – medium. A forum poster believed it was "a very ordinary Furuno" – low. Treat PNM-858 = Racal-Decca navigation radar of the BridgeMaster generation, medium confidence.
- Antenna type: the SHK 2004 report describes an **antenna motor and a rotary joint ("motorfästet till antennmotorn … O-ring i roterskarven")** – i.e. a **rotating open-array (bar) antenna**, not a solid-state radome unit, and SHK 2006 says it is carried on an **arch ("båge")** on the wheelhouse roof – high that it is on an arch; medium that it is an open array.
- Antenna length: not documented. For a 1990s Decca BridgeMaster-class small-craft set the standard options are 4 ft (1.2 m) and 6 ft (1.8 m). Photos of CB90s show a bar roughly a third of the beam → **≈ 1.2 m (4 ft)** *(est., medium-low)*.
- Rotation speed: not documented. Standard for this class of radar is **24 rpm** (some Decca/BridgeMaster high-speed-craft variants 28 rpm). Use **24 rpm ≈ 0.4 rev/s = 144 °/s** *(medium-low)*.
- Later refit (SHK 2026:02, high): from 2019 the Swedish boats were re-equipped with the **SeaCross** integrated navigation system; first with a magnetron pulse radar, then – because pulse sets became unobtainable during the pandemic – with an **FMCW "broadband" radar** ("frekvensradar, även kallad bredbandsradar"). Older boats still had the Transas **Navisailor** system with pulse radar. Make of the SeaCross radar is not stated (Navico/Simrad Halo-type open arrays and 3G/4G radomes are the usual FMCW units – low). For the model, an open-array bar on the arch matches the original fit; a radome would be a plausible alternate for a post-2020 boat.
- The HSM can additionally carry a **Saab Giraffe 1X** 3D surveillance radar (Saab/Dockstavarvet product pages – high that it is an option, not standard).

---

## 3. Weapon mounts

### 3.1 Stridsbåt 90 H / HS standard fit

"3 st 12,7 mm Kulspruta 88 alternativt 40 mm Granatspruta 92, 7,62 mm Kulspruta 58" (soldf – high). The three heavy machine guns are distributed as follows:

1. **Twin 12.7 mm KSP 88 (M2HB) forward, in front of the helmsman – "dubbellavettage i fören"**
   - "The twin 12.7 mm is installed in front of the helmsman's position in traverse. The twin mount is fixed in traverse and aimed by pointing the craft – hence the elevation and fire controls are incorporated in the maneuvering levers at the helmsman's position." (Dockstavarvet-derived text, naval-technology) – high.
   - Swedish sources: "två 12,7 mm kulsprutor i fören (som avfyras från förarplatsen)" – high.
   - Sits in a **recess/well in the foredeck immediately in front of the windscreen**, barrels pointing over the bow. Position *(est.)*: x ≈ 3.4–4.3 m, guns side by side about ±0.35 m off centreline, pivot z ≈ 2.5 m. For the model: **no traverse; elevation only** (≈ −10° … +30°, est.).
   - Not always fitted ("ibland dubbelmonterade Tksp 12,7 i fören" – soldf forum). The **HSM removed the front mount ("frontlavettage") entirely** together with the mine rails, water tank and toilet to save weight (soldf forum – medium).

2. **Ring mount ("ringlavett") on the mid-deck aft of the wheelhouse** – the third 12.7 mm KSP 88, or alternatively the **40 mm Grsp 92 (Mk 19)**, or a 7.62 mm KSP 58.
   - SHK RM 2006:01 / 2008:02 (high): "Ringlavetten består av en ringformad räls av lättmetall placerad på drygt en meter höga stöttor på däcket akter om styrhytten. Den är stativ för en tung kulspruta, som kan svängas ändlöst 360 grader tillsammans med ett ryggstöd mot vilket skytten lutar sig. Lavetten är avsedd att rymma en person."
   - I.e. a light-alloy **ring rail on struts just over 1 m high**, gun cradle and **gunner's back-rest** rotating endlessly through 360°; room for one gunner standing on the deck inside the ring. Wikipedia/other sources call it "aft of the wheelhouse" / "on the middle deck".
   - Position *(est.)*: ring centre x ≈ 8.5–9.0 m, centreline; ring diameter ≈ 1.0–1.1 m; rail height ≈ 1.05 m above the mid-deck; gun pintle on the ring, gunner faces outward, back-rest opposite the gun.
   - Ammunition: several sources note 40 mm Grsp 92 and 12.7 mm KSP 88 are interchangeable on this mount.

3. **Mines/depth charges on the aft deck**: "4 st M9 minor eller 6 st sjunkbomber" on rails ("minräls") along the aft deck, dropped over the transom (soldf, sv.wikipedia – high). The mine rails are removed on the HSM.

Other options quoted for export/later boats (not standard Swedish 90 H): RBS 17 Hellfire launcher on the ring-mount position; mortar; stabilised RWS.

### 3.2 Stridsbåt 90 HSM / CB90 NG

- **Saab Trackfire RWS ("Vapenstation 02")** with IR sensor (3–5 µm) and laser rangefinder, carrying KSP 88 or Grsp 92 – high. Mounted **on the mid-deck aft of the wheelhouse** where the ring mount used to be: "the mid-deck has two [mounts] with the remotely-controlled Trackfire RWS system towering atop", and the station is "at the back of the boat just a step from the entrance" (Global Defence Technology CB90 NG tour) – high. Not on the bow.
- **Five pintle weapon mounts in total**: "The aft deck has three weapon mounts, whereas the mid-deck has two" (same source) – high. They take M2HB, GPMG (KSP 58) or Mk 19; HSM additionally has KSP 18 (M134 minigun) mountings (soldf – medium).
- No twin bow mount, no mine rails (see above).
- Some sources also describe a "gun mount atop its wheelhouse" (defense-update) – low; for the Swedish boats the documented positions are mid-deck and aft deck.

---

## 4. Bow: door/ramp and forepeak hatches

Descriptions from SHK RM 2008:02 (§1.6.5 – high) for a 1994-built 90 H:

- **Stävport (bow door = ramp)**: "Stävporten bildar i utfällt läge en ramp för landstigning. I detta läge hänger den i två kedjor. Porten sitter fast i båten med två gångjärn i dess akterkant. Den manövreras med rep och talja. Stängning sker med två excenterlås på båda sidor om portens förkant. Dessutom låses porten av spanjolettbeslaget till stävluckorna."
  - So: a plate door in the stem, **hinged at its lower/aft edge on two hinges welded into the bottom of the opening**, lowered forward to form a ramp, **held by two chains** when down, operated **manually by rope and tackle** (later boats/HSM: "förbättrad bogramp", CB90 NG "extending bow ramp"; treat the HSM as power/hydraulic – medium), locked when closed by **two eccentric latches** on the forward edge and by the espagnolette of the deck hatches; rubber gasket all round; stop blocks on the hull.
  - Size *(est.)*: opening ≈ 0.8–0.9 m wide ("narrow landing ramp … one-man capacity" – naval-technology, medium) and ≈ 1.4–1.6 m tall; door length ≈ 1.6–1.8 m; when lowered it reaches about 45° below horizontal to the beach.
- **Stävluckor (two bow deck hatches over the forepeak)** – "avsedda för båtens debarkering och embarkering via stävporten": hinged **outboard, one to port and one to starboard of the deck opening**, held open by **gas springs** and a hatch stop; closed with an **espagnolette ("spanjolett") lock** whose handle is on the port hatch (port hatch locks the starboard hatch), secured with a special fitting and a **carabiner**. These are the hatches that "fly open in heavy seas" in several incident reports.
  - Size *(est.)*: together they cover an opening ≈ 1.6–1.8 m wide × 1.8–2.0 m long directly behind the bow door (x ≈ 1.0–3.0 m); each leaf ≈ 0.8–0.9 m wide.
- Inside: a **watertight door** (hinged starboard, opens into the troop room, four dogs) separates the forepeak from the troop room/wheelhouse gangway.
- The forepeak, deck and bottom are "heavily reinforced for forceful landing".

---

## 5. Other hatches and openings (all openable in the model)

| Hatch | Description (SHK 2008 – high) | Position (est.) |
|---|---|---|
| Troop hatch ("nedgångslucka till transportutrymmet") | "en stor nedgångslucka för in- och urstigning samt evakuering. Luckan ligger i akterkant på det upphöjda däcket över transportutrymmet. Den hålls i öppet läge av gasfjädrar och låses med låsvred från insidan eller utsidan." Hinged at its forward edge *(est.)*, gas struts. | Aft edge of the mid-deck, x ≈ 10.4–11.3, centreline; ≈ 0.9 × 0.9 m |
| Wheelhouse roof hatches (2) | one above each crew seat; open/lock from inside only | x ≈ 5.5–6.1, y ≈ ±0.6, in the roof |
| Engine-room access hatch | "en nedgångslucka med karm som ligger långt akterut på däck" – coamed, far aft | x ≈ 14.2–14.9, centreline or slightly offset; ≈ 0.7 × 0.7 m |
| Engine-room work hatches (2) | "två stora arbetsluckor utan karm i däckshöjd akter om transportutrymmets lucka … låses med nedsänkta vred i däcksnivå medelst en specialnyckel" – flush, big, side by side | x ≈ 11.6–13.4, one each side of centreline; ≈ 1.5 × 1.2 m each |
| Bow deck hatches (2) & bow door | see §4 | |
| Ballast/bottom tank lids ("lock av plast") | interior only | – |

---

## 6. Deck fittings

- **Bollards ("pollare")**: the boat has **six** (IPMS Stockholm: "sex pållare"; the 90 HS has a different bollard design than the 90 H) – medium. Forward pair is referenced in SHK 2000 ("de förliga pollarna") at the bow. Layout *(est.)*: pairs at x ≈ 1.8 (bow), x ≈ 9.5 (mid-deck aft end), x ≈ 15.3 (stern), on the deck edge each side; single-post aluminium bollards ≈ 0.25 m tall.
- **Railings**: stanchions and rails ("relingsstöttor", "räckverk") along the mid-deck and aft deck edges (SHK 2006/2008 – high that they exist). Estimate: ≈ 0.9 m high tubular stanchions with two rails/wire, running from the wheelhouse aft along both sides; a low rail/toe-rail on the foredeck. On the HS the side railings also carry antennas (IPMS – medium).
- **Lifting points**: "fyra ordinarie lyftbeslag som är insvetsade i båtens konstruktion bordvarts för och akter om styrhytten" – **four lifting fittings welded into the hull structure at the deck edge, one pair just forward of and one pair just aft of the wheelhouse** (SHK 2008 – high). Position *(est.)*: x ≈ 3.8 and x ≈ 8.0, y ≈ ±1.7, flush plate eyes ≈ 0.15 m.
- **Fenders**: loose fenders and mooring gear are stowed on deck ("förtöjningsgods, fendertar och maskeringsnät" – SHK 2008). The hull has a continuous **rubbing strake** at the deck edge (Dockstavarvet's 3.85 m beam vs 3.80 m hull beam suggests ≈ 25 mm each side) – medium; photos show a dark rubber D-section fender strip *(low)*.
- **Camouflage nets** are routinely carried and rigged over the boat when static (SHK 2006/2008).
- **Life rafts**: 4 × 6-man life rafts (soldf – high), in canisters on the aft deck/mid-deck rails with hydrostatic releases (SHK 2008) – position *(est.)* two each side at the aft-deck rails.
- **Deck load**: 1 t allowed on the aft deck; ammunition pallets are lashed there.

---

## 7. Stern / transom

- **Waterjets**: 2 × Kamewa FF-Jet 450 (some boats FF-410; HSM: Kongsberg S32 mixed-flow) through the transom, with steering nozzles and reversing buckets – covered in the propulsion report.
- **Trim planes ("trimplan")**: the helmsman has trim-plane controls (SHK 2000/2026 – high); Wikipedia describes "underwater control surfaces similar to a submarine's diving planes". Model as two trim tabs/interceptors at the bottom edge of the transom outboard of the jets *(medium)*.
- **Exhausts**: the engines exhaust **through the transom** (wet exhaust, water-injected silencer – the early cooling problem was fixed with a "vattenkyld avgaslimpa"). No source gives outlet geometry; from photos *(low)*: **two outlets, one per engine, port and starboard on the transom outboard of the jet units, ≈ 0.2–0.4 m above the WL, ≈ 0.2–0.25 m across**, usually soot-stained.
- **Armour**: 90 HS/HSM have a 6 mm armour plate on the transom ("6 mm pansarplåt på akterspegeln") – high.
- Stern light on a short staff at the transom/aft rail *(est.)*.

---

## 8. Hull numbers, names and paint

- Swedish boats carry a **three-digit pennant number painted on both bow sides** (e.g. 826, 848, 867, 881, 928, 929 in the SHK reports and Commons photos) – high that the numbers exist; position on the bow sides forward of the wheelhouse, white numerals ≈ 0.4–0.5 m high *(est., medium-low)*. Call sign example: 826 / SFC7613.
- Number ranges (sv.wikipedia, soldf, FMV – medium/high): prototypes **801 "Helge"** and **802 "Helga"** (1989; 801 is now a monument at Haninge garrison/Berga); series 1: 803–814; series 2: 815–877; series 2B (90 HS): 878–907; further 90 H boats up to ≈ 947 (boats 928 and 929 are documented); **90 HSM: 949–967** (FMV – medium). Total 147 + 18.
- Paint: Swedish 90 H/HS boats wear the navy's multi-tone splinter camouflage; the IPMS Stockholm colour thread gives the fleet camouflage set **MF 048 gulgrå NCS 6502-Y, MF 049 mörkt gulgrå NCS 7502-Y, MF 062 grå NCS 7005-Y20R, MF 072 mörkgrå NCS 8500-N** – medium that these are the navy colours, low that all four appear on CB90s (photos show grey/green-grey/dark grey patches). Export/prototype boats and museum 801 are plain grey. Verify against photographs.

---

## 9. Variant differences that show topside

| Feature | 90 H | 90 HS | 90 HSM / CB90 NG |
|---|---|---|---|
| Windows | plain glass | 38 mm ballistic glass, all panes | ballistic "safety glass" |
| Deck armour | – | 20 mm polyethylene on deck | polyethylene lining |
| Transom | – | 6 mm armour plate | – |
| Twin 12.7 mm bow mount | yes (fixed traverse) | yes | **removed** |
| Ring mount | yes, mid-deck | yes | replaced by **Trackfire RWS** on the mid-deck + 2 pintle mounts mid-deck, 3 on aft deck |
| Mine rails | yes (4 × M9) | yes | removed |
| Bow ramp | manual rope-and-tackle door | same | improved/extending ramp, LOA 16.3 m |
| Bollards | 90 H pattern | different pattern | – |
| Antennas | roof | roof + side-railing antennas | roof; optional Giraffe 1X |
| Engines/jets | 2 × Scania DSI14 625 hp, FF-Jet 450/410 | uprated 2 × 500 kW | 2 × Scania DI13 900 hp, Kongsberg S32 |
| Wheelhouse | Navisailor → SeaCross refit from 2019 | same | new NVG-compatible wheelhouse, air-conditioned |

---

## 10. Quick coordinate sheet for the model (x aft of stem, z above keel; WL = 0.8)

| Object | x (m) | y (m) | z (m) | Articulation | Confidence |
|---|---|---|---|---|---|
| Bow door/ramp hinge line | ≈ 0.4 | – | ≈ 1.0 | rotates forward/down ≈ 110–120° | position low, mechanism high |
| Bow deck hatches (2) | 1.0–3.0 | hinges at ±0.85 | ≈ 2.3 | open outboard ≈ 90°, gas struts | mechanism high, size est. |
| Twin 12.7 mm mount | ≈ 3.8 | ±0.35 | ≈ 2.5 | elevation only, no traverse | position est., mechanism high |
| Wheelhouse block | 4.3–7.3 | ±1.5 | 2.3 → 3.8 | – | roof height medium, rest est. |
| Roof hatches (2) | ≈ 5.8 | ±0.6 | 3.8 | open upward ≈ 90° | existence high |
| Searchlight | ≈ 4.6 | ≈ +0.5 | ≈ 4.0 | pan/tilt | existence high, position est. |
| Radar arch + antenna | ≈ 7.0 | 0 | antenna axis ≈ 4.4 | rotate 24 rpm | arch high, size/rpm est. |
| Folding signal mast | ≈ 7.2 | 0 | 3.8 → 5.0 | folds down aft | existence high, position est. |
| Side lights, GPS antenna | ≈ 7.1 | ±1.45 | ≈ 3.8 | – | high (port side documented) |
| Ring mount | ≈ 8.7 | 0 | ring at mid-deck +1.05 | 360° endless traverse; gun elevation | mechanism high, position est. |
| Lifting eyes (4) | ≈ 3.8 & ≈ 8.0 | ±1.75 | deck level | – | high |
| Troop hatch | 10.4–11.3 | 0 | mid-deck | opens up ≈ 80°, gas struts | mechanism high |
| Engine work hatches (2) | 11.6–13.4 | ±0.8 | aft deck | lift out / hinge | existence high |
| Engine access hatch | ≈ 14.5 | 0 | aft deck +0.15 coaming | opens up | existence high |
| Bollards (6) | ≈ 1.8 / 9.5 / 15.3 | ±1.7 | deck | – | count medium, positions est. |
| Exhaust outlets (2) | 15.9 (transom) | ≈ ±1.2 | ≈ 1.1 | – | low |
| Trim planes (2) | 15.9 (transom) | ≈ ±1.4 | ≈ 0.0–0.2 | tilt | existence high, geometry est. |
| Waterjet nozzles (2) | 15.9 | ≈ ±0.75 | ≈ 0.4 | steer ±30°, buckets | see propulsion report |

---

## 11. Sources

Primary / official:
- SHK (Statens haverikommission) RM 2000:02 – "Olycka med en stridsbåt 90H den 15 juni 1999" (wheelhouse and navigation description).
- SHK RM 2004:01 – "Grundstötning med Stridsbåt 90 H nr 881" (console labels incl. port wiper, searchlight, radar antenna motor/rotary joint).
- SHK RM 2006:01 – "Kollision mellan två stridsbåtar 90 H" (867/929; ring mount, radar arch, side light, GPS antenna, stanchions, bollards).
- SHK RM 2008:02 – "Olycka med Stridsbåt 90H nr 848" (full description of hull sections, bow door, bow hatches, troop hatch, roof hatches, engine hatches, lifting fittings, folding signal mast, comms fit).
- SHK 2026:02 – "Grundstötning med en stridsbåt 90 H i Göteborgs skärgård" (boat 826; Navisailor/SeaCross, pulse vs FMCW radar, heading sensors).
- https://www.dockstavarvet.se/products/combat-and-patrol-boats/combat-boat-90-h/specification/ and /models/ (weapon positions, height < 4.5 m, export electronics).
- https://www.saab.com/products/docksta-cb90 and CB90 NG "at a glance" PDF (HSM dimensions, Trackfire, Giraffe 1X).
- https://www.fmv.se/aktuellt--press/aldre-handelser/stridsbat-90hsm-en-potent-plattform/ ; FMV "Tio stridsbåtar återanskaffas" (HSM numbering 949–967).

Secondary:
- https://www.soldf.com/fartyg-och-batar/stridsbat-90h-strb90h/ (fact box: heights from bottom, PNM-858 radar, armament, series numbers) and the Stridsbåt 90 E page (Decca vs Furuno radar).
- https://sv.wikipedia.org/wiki/Stridsb%C3%A5t_90H ; https://en.wikipedia.org/wiki/CB90-class_fast_assault_craft
- https://www.hhogman.se/stridsbatar-1-sve.htm ; https://www.hhogman.se/combat-boats-1-swe.htm
- https://www.naval-technology.com/projects/combatboat90/ ; https://www.naval-technology.com/projects/combat-boat-90-hsm/
- https://defence.nridigital.com/global_defence_technology_oct21/saab_cb90_tour (five mounts: 3 aft deck, 2 mid-deck; Trackfire position)
- https://www.edrmagazine.eu/dsei-2021-saabs-next-generation-combat-boat-on-the-thames
- https://www.militaryfactory.com/ships/detail.php?ship_id=Combat-Boat-90-CB90
- https://www.ipmsstockholm.se/phpBB3/viewtopic.php?t=10080 (six bollards, roof details, H vs HS differences in the Tiger Model kit); https://ipmsstockholm.se/phpBB3/viewtopic.php?t=4418 (navy paint codes)
- https://forum.soldf.com/topic/5266-strb-90h/ ; https://forum.soldf.com/topic/23545-radarspaning/
- https://militarhistoria.ifokus.se/discussion/1387558/stridsbat-90- (twin bow guns fired by the helmsman, ring mount on the mid-deck)
- https://kitchecker.com/reviews_2018_2/tiger_model_6293.htm ; https://sempermiles.se/... (Tiger Model 1/35 kit: 471 parts, 31 clear parts, 49 cm long)
- https://commons.wikimedia.org/wiki/Category:CB90_&_SRC90 (photo of boat 928, 2015)
