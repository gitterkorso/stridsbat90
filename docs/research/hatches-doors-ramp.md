# Stridsbåt 90 H / HS (CB90) – every openable hatch, door, ramp and window

> Publiceringsnotis: Filnamn under Referens/, shots/, tmp/ och backups/ avser lokalt granskningsmaterial som inte distribueras. Källänkar och rapportens egna slutsatser finns kvar; se [licensinformationen](../../THIRD_PARTY_NOTICES.md).

Research note for the articulated Three.js model. Scope: the Swedish **Stridsbåt 90 H** (basic troop transport, 147 built 1989–2002) and the **Stridsbåt 90 HS** (splinter/CBRN-protected version, 27 built). Differences for HSM, Norwegian 90N, US RCB and the small 90E are listed in section 5.

## 0. Sources and how to read the confidence marks

The single most valuable source is the Swedish Accident Investigation Board report **SHK RM 2008:02** (capsizing of Strb 848 off Utö, 2006-10-24). Section 1.6.4–1.6.5 of that report enumerates *every* hull opening and closing appliance of the 90 H, with hinge sides, gas springs, locks and operating sequence, and its figures 3–10 are drawings/photos of the arrangement (see pages 16–19 of the PDF; the team may view those figures directly). Two further SHK reports (RM 2004:01, RM 2006:01) and SHK 2026:02 repeat the compartment description and add details about the roof hatches, the engine-room companionway and the troop hatch. Those quoted facts are marked **[SHK]** and are high confidence.

Everything about *sizes, exact x/y/z positions and maximum opening angles* is **not** in any text source I could find. Those numbers are my estimates from the boat's known principal dimensions and from photographs I have seen of the class, and are marked **est.** with a confidence level:

- **high** – stated in a primary/technical source (SHK, Dockstavarvet, Saab)
- **medium** – consistent across several secondary sources or clearly visible in photos
- **low** – my proportional estimate; check against photos or the SHK figures before locking geometry

### Coordinate convention used below

- **x** = along the length, **0 at the stem at deck level** (top edge of the bow ramp), **positive aft**. Hull length 14.90 m (transom at x ≈ 14.9); the water-jet nozzles/reversing buckets and stern fender bring LOA to 15.9 m (16.3 m on HSM/NG). [Dockstavarvet product sheet: LOA 14.90 m, beam 3.85 m; sv.wikipedia/SHK: 15.9 × 3.80 m, draught 0.8 m, KVL 13.0 m]
- **y** = height, **0 at the design waterline**, positive up. Keel ≈ −0.8 m. Mast top ≈ +4.2 m ("masttopp 5 m från botten", SoldF).
- **z** = athwartships, **0 at centreline, positive to starboard** (styrbord, SB); port = babord (BB).

### Principal layout to hang the openings on (est., medium)

| Item | x (m) | y (m) | Notes |
|---|---|---|---|
| Stem / top of bow ramp | 0.0 | +1.1 | Truncated bow, flat raked face |
| Foredeck (fördäck), slopes **down** toward the bow ("reverse sheer") | 0–3.6 | +1.1 → +1.4 | Fixed twin 12.7 mm mounts at x ≈ 2.8, z ≈ ±1.2 |
| WT bulkhead förpik / styrhytt | ≈ 3.3 | – | Corridor passes through it (WT door) |
| Wheelhouse (styrhytt) windscreen base → roof | 3.6 → 4.4 | +1.4 → +2.4 | Roof x ≈ 4.4–6.8, y ≈ +2.4 |
| Raised mid-deck (mellandäck / "det upphöjda däcket över transportutrymmet") | 6.8–10.8 | +2.2 | Ring mount (ringlavett) centred x ≈ 7.7 |
| Aft edge / step of mid-deck | 10.8–11.2 | +2.2 → +1.0 | Troop hatch sits here |
| WT bulkhead transportrum / maskinrum | ≈ 11.2 | – | Engine room = aft 25 % of hull [Dockstavarvet] |
| Aft deck (akterdäck) | 11.2–14.9 | +1.0 | Two engine working hatches + companionway hood |
| Transom, water jets | 14.9 (nozzles to 15.9) | – | 2 × Kamewa FF-Jet 410/450 with reversing buckets |
| Troop compartment floor (durk) | 3.3–11.2 | ≈ +0.3 | Headroom ≈ 1.8 m (90N raised by 0.2 m to 2.0 m) |

Compartments (all SHK reports): three sections separated by watertight bulkheads – **förpik** (forepeak, contains the landing corridor), **transportrum + styrhytt** (one WT section), **maskinrum** (engine room) – plus watertight double-bottom cells (fuel tank) under the floors.

---

## 1. Master list of openable parts

| # | Swedish | English | Count | Type | Confidence that it exists / as described |
|---|---|---|---|---|---|
| 1 | Stävport (bogramp, landstigningsramp) | Bow door / landing ramp | 1 | Drop ramp, bottom-hinged | high |
| 2 | Stävluckor (fördäcksluckor, "tvådelad lucka") | Bow deck hatches over landing corridor | 2 (BB + SB) | Gull-wing, hinged outboard, gas springs | high |
| 3 | Vattentät dörr (VT-dörr) i tvärskeppsskott | Watertight door forepeak ↔ wheelhouse corridor | 1 | Swing door, hinged SB, opens aft | high |
| 4 | Takluckor i styrhytten | Wheelhouse roof hatches over BB and SB pilot seats | 2 | Lift-up lids, inside-operated only | high (exist) / medium-low (hinge side) |
| 5 | Nedgångslucka / däckslucka till transportrummet ("transportluckan", "urlastningsluckan") | Troop-compartment access hatch, aft | 1 | Lift-up lid, gas springs, locks in & out | high (exist) / medium (hinge side) |
| 6 | Arbetsluckor till maskinrummet | Engine-room working hatches, flush in aft deck | 2 | Flush lids, key-locked | high (exist) / low (hinge side) |
| 7 | Nedgångslucka till maskinrummet (med karm / "nedgångskapp") | Engine-room companionway hatch on a hood, far aft | 1 | Lid on coaming | high (exist) / low (geometry) |
| 8 | Fönster / rutor | Windows (windscreen, wheelhouse side windows, troop-compartment ports) | many | **All fixed** – none open | medium-high |
| – | Styrhyttsdörrar (sidodörrar) | Wheelhouse side doors | **0** | Do not exist on H/HS | high (SHK enumeration lists none) |
| – | Akterlucka / akterport | Stern door/gate | **0** | Not on H/HS (RCB has a "stern gate/bumper") | medium-high |

Interior articulations worth animating for the "interior hint": the **folding centre seat** in the wheelhouse ("fällbar/uppfällbar mittstol") and the **fold-down troop seats** ("nedfällbara stolar") – both [SHK].

---

## 2. Detailed entries

### 2.1 Stävport – bow door / landing ramp  (`bow_ramp`)

- **Swedish / English:** stävport, bogramp, landstigningsramp / bow door, drop-bow landing ramp. Dockstavarvet: "narrow 1-man landing ramp forward"; naval-technology: "unique drop bow system".
- **What it is [SHK RM 2008:02 §1.6.4–1.6.5, high]:** "Förpiken har ... en lucka i stäven (stävport) som i öppet läge bildar en ramp." "Stävporten bildar i utfällt läge en ramp för landstigning. I detta läge hänger den i två kedjor. Porten sitter fast i båten med två gångjärn i dess akterkant. Den manövreras med rep och talja. Stängning sker med två excenterlås på båda sidor om portens förkant. Dessutom låses porten av spanjolettbeslaget till stävluckorna. ... Tätning sker med gummipackning runtom. Stängt och tätat läge bestäms av stoppklackar bultade till skrovet." After the Utö capsizing the port was found "avbruten vid sina gångjärn insvetsade i lucköppningens nederkant" – i.e. the hinges are welded into the **lower** edge of the opening. Described as "en mycket robust konstruktion". A rubber strip seals ramp-to-hull (RM 2006:01 damage list).
- **Location:** the flat, raked face of the truncated bow, on the centreline. Hinge line at the bottom of the opening: **x ≈ 0.45 m, y ≈ +0.1 to +0.2 m** (just above the waterline), z = 0, axis athwartships (parallel to z). Top edge when closed at x ≈ 0, y ≈ +1.1 m (est., medium).
- **Size (est., low-medium):** clear opening ≈ 0.9 m wide (range 0.8–1.0; single file, "one-man") × ≈ 1.2–1.4 m long along the slope; plate thick and stiffened, ≈ 60–80 mm, with a non-slip tread and a slight taper toward the bottom (the bow narrows downward).
- **Hinge & motion:** rotates **forward and down** about its bottom edge. Closed: plate lies in the stem face, inclined ≈ 60–70° from horizontal, top edge forward of the hinge. Open: hangs on the two chains (one each side, from the outer corners of the ramp to the hull sides near deck level) roughly horizontal to ≈ 10–15° nose-down. **Travel ≈ 75–85°** (est., medium). On the H it is hauled up by rope and tackle (manual) – no hydraulics [SHK, high]. (The new CB90 NG/HSM marketing says "extending"/"improved" bow ramp; actuation not published – low.)
- **Interlocks (important for animation logic) [SHK, high]:** the ramp cannot be opened until the two bow deck hatches (#2) are open, because (a) the deck hatches' espagnolette also locks the port and (b) the two eccentric-lock handles at the port's top corners are pinned down by the closed deck hatches. Order to open: deck hatches → release the two excenterlås → pay out the tackle until the ramp hangs on its chains. Close in reverse (haul up, lock excenter, close SB hatch, then BB hatch, turn espagnolette up, secure with fitting + carabiner).
- **Behind it (interior hint):** a narrow corridor (≈ 0.7 m wide) in the forepeak running aft ≈ 3 m to the watertight door (#3), floor at ≈ y +0.3; forepeak hand bilge pump next to the WT door, fire-alarm sensor, the tackle and chain stowage; foredeck underside sloping down toward the bow.

### 2.2 Stävluckor – bow deck hatches over the landing corridor  (`bow_hatch_port`, `bow_hatch_stbd`)

- **Swedish / English:** stävluckor, fördäcksluckor, "the two-part hatch that covers the corridor from above" / bow (foredeck) hatches. (The MVR-simulation RCB model calls it the "bow hatch".)
- **What it is [SHK RM 2008:02 §1.6.5, high]:** "Dessa två luckor är avsedda för båtens debarkering och embarkering via stävporten. Luckorna har gångjärn på styrbord resp. babord sida om däcksöppningen. I öppet läge hålls de öppna av gasfjädrar och spärras med en luckspärr. Babord lucka låser även styrbord lucka. Vid öppning öppnas spanjolettlåset genom att manöverhandtaget frigörs från babord lucka och förs nedåt. Spanjolettbeslagens gafflar i luckornas förkant och akterkant frigörs och luckorna kan skjutas upp. Vid stängning dras först styrbord lucka nedåt, därefter babord lucka." Ship's manual: must be closed and dogged ("stängda och skalkade") under way [RM 2006:01].
- **Location:** foredeck, centreline, immediately aft of the stem: opening from **x ≈ 0.3 to ≈ 2.2 m**, y = foredeck (+1.1 → +1.3), z from ≈ −0.5 to +0.5 (est., medium). Each leaf hinged on its **outboard longitudinal edge** (axis parallel to x) at z ≈ ±0.5.
- **Size (est., low-medium):** two leaves, each ≈ 0.5 m wide × ≈ 1.9 m long (total opening ≈ 1.0 × 1.9 m). Leaves are flat aluminium panels with a lip/seal; espagnolette forks at fore and aft edges, one handle on the port leaf.
- **Hinge & motion:** gull-wing – each leaf swings **up and outboard** about its outboard edge; **max ≈ 90–100°** (leaves stand roughly vertical, acting as side screens for the men in the corridor), held by gas springs and a catch (est., medium). Open the **port** leaf first (it carries the handle and locks the starboard leaf); close **starboard** first.
- **Behind it:** the top of the landing corridor and the inboard face of the ramp; troops walk forward under the open leaves onto the ramp.

### 2.3 Vattentät dörr – watertight door, forepeak ↔ wheelhouse corridor  (`wt_door_fwd`)

- **Swedish / English:** vattentät dörr (VT-dörr) i tvärskeppsskottet mellan förpik och transportutrymme/styrhytt / watertight door in the transverse bulkhead. This is the only "inner bow door".
- **What it is [SHK RM 2008:02 §1.6.4–1.6.5, high]:** "Det vattentäta skottet mellan förpik och transportutrymme med styrhytt har en vattentät dörr." "Dörren har sina gångjärn på styrbord sida och öppnas inåt transportutrymmet. Dörren stängs mot en gummipackning runtom och skalkas med fyra dörrvred av fartygstyp" – dogs open in the vertical, closed in the horizontal position, operable from both sides; FMV: a DNV-standard watertight door.
- **Location:** centreline of the bulkhead at **x ≈ 3.3 m**, at the forward end of the corridor that runs between the two pilot seats; sill ≈ 0.25 m above the corridor floor (y ≈ +0.55), head at ≈ y +1.8 (est., medium).
- **Size (est., medium):** clear opening ≈ 0.55–0.6 m wide × ≈ 1.2–1.3 m high (a squat, rounded-corner marine WT door; you duck through it), leaf ≈ 40 mm thick with four dogging handles.
- **Hinge & motion:** hinge on the **starboard** edge (z ≈ +0.3), vertical axis; leaf swings **aft** into the corridor under the wheelhouse; **max ≈ 90°** where it lies along the starboard corridor wall (est., medium).
- **Behind it (aft side):** the wheelhouse well – helmsman's console to starboard (wheel, jet/throttle levers, trim-tab controls, one monitor), navigator's console to port (two monitors, keyboard, nav table), the folding centre seat between them, and the steps down into the troop compartment. Forward side: the forepeak corridor and the ramp.

### 2.4 Takluckor i styrhytten – wheelhouse roof hatches  (`roof_hatch_port`, `roof_hatch_stbd`)

- **Swedish / English:** styrhyttens takluckor, "luckorna ovanför förarsätena" / wheelhouse (pilot-house) roof hatches, "gunner hatches" in the task brief. These are the only cabin-roof hatches.
- **What it is [SHK RM 2008:02 §1.6.5, high]:** "Styrhytten har två luckor i taket över resp. förarstol styrbord och babord. Dessa luckor kan enbart öppnas och låsas från insidan." They are used to stand up and shout to men on deck ("Kommunikationen till styrhytten kan upprättas muntligen genom lucka i styrhyttstak", "ropa genom styrhyttens takluckor" – RM 2006:01) and were the escape route in the 2006 collision ("folk har börjat ta sig ut ur luckorna ovanför förarsätena" – SoldF forum witness). Not mentioned in the closing-under-way rule, and crews often run with them open [RM 2006:01].
- **Location:** wheelhouse roof (y ≈ +2.4), directly over each pilot seat: centres at **x ≈ 5.4 m, z ≈ ±0.85 m** (est., medium).
- **Size (est., low-medium):** ≈ 0.55 × 0.55 m (range 0.5–0.65) each, square with radiused corners, flush lid with a low coaming; inside dog/handle and a stay.
- **Hinge & motion:** hinged on the **forward edge**, transverse axis; lid lifts **up and forward** and stands ≈ 80–90° as a wind deflector for the person standing in it (est., **medium-low** – I could not confirm the hinge side in text; aft-hinged is the alternative; check a photo of a boat with hatches open before rigging).
- **Behind it:** the pilot seat (helmsman SB / navigator BB) with lap belt, console, wipers, magnetic compass; a standing person's head and shoulders come through.

### 2.5 Nedgångslucka till transportrummet – aft troop-compartment hatch  (`troop_hatch_aft`)

- **Swedish / English:** nedgångslucka / däckslucka till transportrummet, "transportluckan", "den aktra luckan till transportutrymmet", "urlastningsluckan" / troop-compartment access hatch, "rear cabin hatch" (RCB), "the aft troop compartment door to the aft deck" in the brief. Normal entry/exit for everyone; the naval-technology tour of the NG says the entrance is "at the back of the boat", one step from the aft-deck weapon station.
- **What it is [SHK RM 2008:02 §1.6.5, high]:** "Transportutrymmet har en stor nedgångslucka för in- och urstigning samt evakuering. Luckan ligger i akterkant på det upphöjda däcket över transportutrymmet. Den hålls i öppet läge av gasfjädrar och låses med låsvred från insidan eller utsidan vid stängt läge." Elsewhere: "luckan till transportutrymmet ... som sitter på akterdäck"; must be closed and dogged under way. In the 2006 collision one corner was deformed so it "inte gick att öppna med handkraft" and men were temporarily trapped [RM 2006:01].
- **Location:** at the **aft edge of the raised mid-deck**, centreline: the lid sits on/over the inclined step between mid-deck (y +2.2) and aft deck (y +1.0), **x ≈ 10.4–11.2 m, z ≈ −0.45 to +0.45** (est., medium). You stand on the aft deck and step up/forward through it, then down 2–3 steps into the aft end of the compartment.
- **Size (est., low-medium):** ≈ 0.9 m wide × ≈ 1.1 m along the slope (range 0.8–1.0 × 1.0–1.2) – "stor". IPMS Stockholm modellers note the *hatch shape differs between the 90 H and the 90 HS* (Tiger's kit mixes the two) – so expect a slightly different outline on the HS.
- **Hinge & motion:** hinged on its **upper/forward edge** (transverse axis at x ≈ 10.4, y ≈ +2.2); lid swings **up and forward** on two gas springs to ≈ 90–100° (stands vertical, or slightly forward of vertical, like a shield behind the ring-mount gunner) (est., **medium**; an alternative reading of the SHK text is a lid lying flat in the mid-deck at its aft edge – I consider that less likely from photos of troops boarding from the aft deck).
- **Behind it:** short steps down; the two aft-facing seats on the engine-room bulkhead (H only); nine inboard-facing seats each side ("limporna"), life-jackets in nets above the seats, the central floor with equipment secured by cargo nets (or the large central stowage box on the NG), fire extinguisher in a glass case, small side ports. The engine-room bulkhead (with its small excenter locks for the deck hatches) is right behind the aft seats.

### 2.6 Arbetsluckor till maskinrummet – engine-room working hatches  (`engine_hatch_port`, `engine_hatch_stbd`)

- **Swedish / English:** maskinrumsluckor, "två stora arbetsluckor utan karm i däckshöjd" / engine-room working (maintenance/engine-lift) hatches, flush in the aft deck.
- **What it is [SHK RM 2008:02 §1.6.5, high]:** "Motorrummet har ... två stora arbetsluckor utan karm i däckshöjd akter om transportutrymmets lucka. Dessa låses med nedsänkta vred i däcksnivå medelst en specialnyckel. Dessa luckor har även ytterligare låsanordningar med små excenterlås i motorrummet." After the Utö salvage "de två maskinrumsluckorna på akterdäck" were found unlocked. Ammunition pallets are lashed on top of them in service ("lastpallar surrade på akterdäck").
- **Location:** aft deck (y ≈ +1.0), one over each engine, side by side: centres **x ≈ 12.6 m, z ≈ ±0.9 m** (est., medium); forward edge ≈ 0.4 m aft of the troop hatch, aft edge ≈ 1.2 m forward of the companionway hood.
- **Size (est., low):** each ≈ 1.0 m athwartships × ≈ 1.8 m fore-and-aft (range 0.9–1.2 × 1.5–2.0; big enough to lift a Scania DSI14 V8). Flush, no coaming, recessed key-operated handles, non-slip surface; a narrow centreline strip of deck between them.
- **Hinge & motion:** **unknown from text (low).** Most plausible: hinged on the **outboard** long edge and swung up/outboard to ≈ 90° (propped), or simply **lift-off panels** (the "utan karm ... låses med nedsänkta vred ... specialnyckel" description fits a lift-off engine hatch). For the model I suggest outboard-hinged, 0–90°, and flag it for a photo check.
- **Behind it:** two Scania DSI14 V8 diesels (625 hp; DI13 700 hp after the HSM refit), shafts with centrifugal clutches to the FF-Jet 450/410 units, transformer, batteries, CO2 extinguishing bottles, bilge pumps, exhausts, insulated watertight bulkhead forward.

### 2.7 Nedgångslucka till maskinrummet / nedgångskapp – engine-room companionway hatch  (`engine_companion_hatch`)

- **Swedish / English:** nedgångslucka med karm till maskinrummet, "nedgångskappen till maskinrummet" / engine-room companionway hatch on a raised hood (kapp) at the stern.
- **What it is [SHK, high]:** "Motorrummet har en nedgångslucka med karm som ligger långt akterut på däck." In the 2006 collision "trycktes nedgångskappen till maskinrummet ihop helt" when the other boat rode up over the transom. Must be closed and dogged under way. The Norwegian 90N has "annan nedgångslucka" (a different companionway hatch) [SoldF forum].
- **Location:** aft deck, **far aft on the centreline, x ≈ 14.0–14.6 m, z ≈ 0**, on a raised hood/coaming ≈ 0.3 m high (top at y ≈ +1.3) (est., medium for position, low for hood shape).
- **Size (est., low):** lid ≈ 0.6 × 0.65 m (range 0.55–0.75), with dogs.
- **Hinge & motion:** **low confidence.** Suggest hinged on the **aft edge** (transverse axis at x ≈ 14.6), lid swinging up and aft to ≈ 90–110° so the person enters from forward and climbs down a vertical ladder facing aft; forward-hinged is the alternative.
- **Behind it:** vertical ladder into the aft end of the engine room, between the two jet units' hydraulic gear for nozzles and reversing buckets.

### 2.8 Windows – all fixed  (`no openable windows`)

- **Wheelhouse (styrhytt):** raked multi-panel windscreen ("frontrutorna", "vindrutor") with wipers ("BB torkare"), plus side and aft-facing side windows – "The bridge has windows on all of its sides" (only a game-wiki description, low). Optical navigation "genom styrhyttens fönster" [SHK]. On the **HS** all windows are **38 mm ballistic glass** (SoldF) – necessarily fixed. On the H no source mentions any sliding/opening pane, and the SHK enumeration of "vattentäta dörrar och skrovöppningar" lists none. Treat as fixed (medium-high).
- **Troop compartment:** "endast några små fönstergluggar" – a few small fixed ports in the mid-deck sides above the seats [RM 2000:02, high]. Ballistic glass optional/standard on HS.
- **Wheelhouse side doors:** none on H/HS (high – not in the SHK enumeration; all access is via #2/#3 forward and #5 aft).
- **Stern:** no stern door/gate on H/HS (the RCB 3D model lists a "stern gate/bumper"; the Swedish boats only have a transom fender between the jets).

---

## 3. Operating sequences and interlocks (for the animation state machine)

1. **Landing:** boat drives bow onto the rocks → crew (or troops) open **port** bow hatch (releases espagnolette, also unlocking the starboard leaf) → **starboard** bow hatch → both stand up on gas springs and catch → the two **excenterlås** at the top corners of the stem port are released (their handles were pinned by the closed hatches) → ramp paid out on rope-and-tackle until it hangs on its two chains → troops file forward from the compartment, through the wheelhouse corridor, through the (already open) WT door, along the forepeak corridor, out over the ramp.
2. **Recovery:** haul ramp up, close excenter locks, close **starboard** leaf, then **port** leaf, turn espagnolette handle up, secure with the special fitting and carabiner. Under way: bow hatches, WT door, troop hatch and both engine hatches must be closed and dogged; roof hatches may be open [RM 2006:01, RM 2008:02].
3. **Independent parts:** roof hatches (inside only), troop hatch (inside or outside), engine working hatches (special key from outside + inside excenter locks), companionway hatch. The WT door can be dogged from either side.
4. Suggested rig constraints: `bow_ramp.open` requires `bow_hatch_port.open && bow_hatch_stbd.open`; `bow_hatch_stbd.open` requires `bow_hatch_port.open` (port leaf locks starboard); closing order reversed.

---

## 4. Suggested parameter table for the Three.js rig (all est. unless marked [SHK])

Pivot = point on the hinge axis; axis = unit vector of the hinge axis in the x-aft / y-up / z-stbd frame; angle in degrees from closed.

| id | pivot (x, y, z) m | axis | closed → open | size (m) | notes |
|---|---|---|---|---|---|
| bow_ramp | (0.45, 0.15, 0) | (0, 0, 1) | 0 → ≈ 80 (forward/down) | 0.9 w × 1.3 l | bottom-hinged [SHK]; chains stop it; rope-and-tackle [SHK] |
| bow_hatch_port | (1.25, 1.2, −0.5) | (1, 0, 0) | 0 → ≈ 95 (up/outboard) | 0.5 × 1.9 | outboard hinge, gas spring, catch [SHK] |
| bow_hatch_stbd | (1.25, 1.2, +0.5) | (1, 0, 0) | 0 → ≈ 95 (up/outboard) | 0.5 × 1.9 | opens after port leaf [SHK] |
| wt_door_fwd | (3.3, 1.2, +0.3) | (0, 1, 0) | 0 → ≈ 90 (aft, into corridor) | 0.6 × 1.25 | SB hinge, opens aft [SHK]; 4 dogs |
| roof_hatch_port | (5.1, 2.4, −0.85) | (0, 0, 1) | 0 → ≈ 85 (up/forward) | 0.55 × 0.55 | forward hinge (medium-low); inside only [SHK] |
| roof_hatch_stbd | (5.1, 2.4, +0.85) | (0, 0, 1) | 0 → ≈ 85 (up/forward) | 0.55 × 0.55 | as above |
| troop_hatch_aft | (10.4, 2.2, 0) | (0, 0, 1) | 0 → ≈ 95 (up/forward) | 0.9 × 1.1 | at aft edge of mid-deck [SHK]; gas springs [SHK]; hinge side medium |
| engine_hatch_port | (12.6, 1.0, −1.45) | (1, 0, 0) | 0 → ≈ 90 (up/outboard) or lift-off | 1.0 × 1.8 | flush, key-locked [SHK]; hinge side low |
| engine_hatch_stbd | (12.6, 1.0, +1.45) | (1, 0, 0) | 0 → ≈ 90 (up/outboard) or lift-off | 1.0 × 1.8 | as above |
| engine_companion_hatch | (14.6, 1.3, 0) | (0, 0, 1) | 0 → ≈ 100 (up/aft) | 0.6 × 0.65 | on 0.3 m hood, far aft [SHK]; geometry low |
| centre_seat (interior) | (5.4, 0.9, 0) | (0, 0, 1) | folds up/down | – | "fällbar mittstol" [SHK] |
| troop_seats (interior) | along z ≈ ±1.3, x 6–10.5 | (1, 0, 0) | fold-down | 9 per side + 2 aft-facing (H) | [SHK] |

---

## 5. Variant differences that affect the openings

- **90 H** (baseline, above). Open ring mount (ringlavett) on the mid-deck aft of the wheelhouse; troop seats without belts; 2 aft-facing seats on the engine bulkhead.
- **90 HS** ("S" = skydd): same hull and openings; 38 mm ballistic glass in all windows, 20 mm polyethylene on deck, 6 mm armour on the transom, CBRN overpressure (so every opening must seal), air-conditioning, belts on troop seats, 18 troops. Slightly different **hatch outline** vs the H (per IPMS Stockholm modellers). Gun position behind the wheelhouse described as "torn" (shielded ring) on some boats.
- **90 HSM** (H/HS modernised from ~2015, and Saab's new-build CB90 NG, LOA 16.3 m): new engines (Scania DI13 700 hp; NG 2 × 900 hp), new wheelhouse interior, Trackfire RWS on the mid-deck, "improved/extending bow ramp" (actuation not published), five gun mounts (3 aft deck, 2 mid-deck), central stowage box in the cabin; entrance still at the aft end.
- **Stridsbåt 90 N** (Norway): mid-deck roof raised 0.2 m (headroom 2.0 m), "annan nedgångslucka" (different companionway), anchor winch on the stern, more WT compartments; troops "landed through a hatch (luke)" in the bow = same stävluckor + ramp.
- **RCB** (US, Safe Boats): "insertion and extraction bow door"; the MVR simulation model articulates **bow ramp, bow hatch, forward-facing twin-.50 gun hatch (in the foredeck), rear cabin hatch, stern gate/bumper** – i.e. one extra foredeck gunner hatch and a stern gate that Swedish H/HS boats do not have.
- **90 E** (Storebro, 11.9 m, single engine, composite): different, smaller boat with its own ramp/hatches – not covered here.

---

## 6. Source list

Primary / technical
- SHK RM 2008:02, Olycka med Stridsbåt 90H nr 848 vid Hamnudden, Utö 2006-10-24 – https://shk.se/download/18.2d6f089b18faca29dc81a571/1698926603898/10264848_rm2008_02.pdf (§1.6.1–1.6.5, figs 3–10: full description of WT door, stävluckor, stävport, troop hatch, roof hatches, engine hatches)
- SHK RM 2006:01, Kollision mellan Strb 867 och 929 – https://shk.se/download/18.2d6f089b18faca29dc818bfc/1698926590852/rm2006_01.pdf (§1.3, §1.10, §1.19.15: compartments, ringlavett, companionway hood, roof hatches, closing rules)
- SHK RM 2004:01, Grundstötning Strb 881 – https://shk.se/download/18.2d6f089b18faca29dc817b52/1698926581112/rm2004_01.pdf (compartment sketch, wheelhouse consoles, evacuation through "den förliga urlastningsluckan", plate thicknesses 15 mm keel / 6 mm deck)
- SHK RM 2000:02, Strb 820 collision – https://shk.se/download/18.2d6f089b18faca29dc815df1/1698926520208/rm2000_02.pdf (wheelhouse, "små fönstergluggar", stävlucka damage)
- SHK 2026:02, Grundstötning Strb 826 Göteborg – https://shk.se/download/18.4687375319b230b9ea91400/1770186115871/SHK%202026_02%20Slutrapport%20Stridsb%C3%A5t%2090.pdf
- Dockstavarvet CB 90 H specification / product sheet – https://www.dockstavarvet.se/products/combat-and-patrol-boats/combat-boat-90-h/specification/ and https://www.dockstavarvet.se/wp-content/uploads/2015/01/cb-90-h-product-sheet.pdf (LOA 14.90, beam 3.85, "narrow 1-man landing ramp", engine room aft 25 %, wheelhouse module layout)
- Saab Docksta CB90 – https://www.saab.com/products/docksta-cb90
- Dockstavarvet CB 90 H models – https://www.dockstavarvet.se/products/combat-and-patrol-boats/combat-boat-90-h/models/
- Naval Technology, CB90 – https://www.naval-technology.com/projects/combatboat90/ ; CB90 HSM – https://www.naval-technology.com/projects/combat-boat-90-hsm/ ; CB90 NG on-board tour – https://www.naval-technology.com/features/cb90-saab-combat-boat-next-generation-sweden-dsei-trackfire/ and https://defence.nridigital.com/global_defence_technology_oct21/saab_cb90_tour
- FMV, Stridsbåt 90HSM – https://www.fmv.se/aktuellt--press/aldre-handelser/stridsbat-90hsm-en-potent-plattform/
- Skippo, Nya Stridsbåt 90 – https://www.skippo.se/nyheter/nya-stridsbat-90-snabbare-starkare-och-farligare
- EDR Magazine, DSEI 2021 CB90 NG – https://www.edrmagazine.eu/dsei-2021-saabs-next-generation-combat-boat-on-the-thames
- Naval Review (Canada), CB-90 for Canada – https://www.navalreview.ca/2022/10/cb-90-for-canada/ ("open the bow doors, drop the ramp")
- SAFE Boats RCB – https://safeboats.com/rcb/ ; MVR Simulation RCB model (articulation list) – https://www.mvrsimulation.com/model/featured/sea/riverine-command-boat

Encyclopaedic / secondary
- sv.wikipedia Stridsbåt 90H – https://sv.wikipedia.org/wiki/Stridsb%C3%A5t_90H ; en.wikipedia CB90 – https://en.wikipedia.org/wiki/CB90-class_fast_assault_craft ; no.wikipedia Stridsbåt 90N – https://no.wikipedia.org/wiki/Stridsb%C3%A5t_90N
- SoldF Stridsbåt 90 H – https://www.soldf.com/fartyg-och-batar/stridsbat-90h-strb90h/ (corridor between the pilots to the folding ramp, mast height, 38 mm glass on HS)
- Hans Högman, Svenska stridsbåtar – https://www.hhogman.se/stridsbatar-1-sve.htm
- Root-Nation CB90 article – https://root-nation.com/en/articles-en/weapons-en/en-stridsbat-90-ukraine/ ("two-part hatch" over the corridor)
- Military Factory CB90 / RCB – https://www.militaryfactory.com/ships/detail.php?ship_id=Combat-Boat-90-CB90
- Båtmagasinet (NO), Stridsbåt 90 – https://www.batmagasinet.no/allerbm-bm-bladarkiv-pumper/sjoforsvarets-fartoyer-stridsbat-90/678954 (20 cm more headroom on 90N)
- SoldF forum, 2 döda i stridsbåt 90-olycka p.4 – https://forum.soldf.com/topic/11806-2-d%C3%B6da-i-milit%C3%A4r-stridsb%C3%A5t-90-olycka/page/4/ (escape via roof hatches, water through aft hatch) ; Stridsbåt 90 thread – https://forum.soldf.com/topic/15068-stridsb%C3%A5t-90/ (90N: higher roof, different companionway)
- IPMS Stockholm, Uppdatering för Stridsbåt 90 – https://www.ipmsstockholm.se/phpBB3/viewtopic.php?t=10080 (Tiger kit mixes H/HS: windows from H, hatch shape from HS) ; Söker ritningar – https://ipmsstockholm.se/phpBB3/viewtopic.php?t=840
- Modellbygge iFokus, Stridsbåt 90 – https://modellbygge.ifokus.se/discussion/480583/stridsbat-90 (collapsible commander's seat, cargo nets, "luckan slår upp")
- Kitchecker review Tiger 6293 – https://kitchecker.com/reviews_2018_2/tiger_model_6293.htm ; KitMaker build – https://forums.kitmaker.net/t/swedish-assault-craft-cb-90-in-1-35-scale/51111 ("deck slopes down toward the bow") ; Scalemates 6290 – https://www.scalemates.com/kits/tiger-model-6290-cb90-fast-assault-craft--1086130
- bildrum.se 1:72 card model (variants incl. Norwegian raised deck) – http://bildrum.se/stridsbt90.htm
