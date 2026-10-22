# CB90 / Stridsbåt 90 – waterjet propulsion mechanics (Kamewa FF-Jet 410/450)

> Publiceringsnotis: Filnamn under Referens/, shots/, tmp/ och backups/ avser lokalt granskningsmaterial som inte distribueras. Källänkar och rapportens egna slutsatser finns kvar; se [licensinformationen](../../THIRD_PARTY_NOTICES.md).

Research note for the articulated Three.js model. Covers what the two waterjets look like at the transom, how the steering nozzle and the reversing bucket (*backskopa* / *reverseringsskopa*) move, how the operator drives them, and what is inside the unit. Numbers are in metres unless stated. Tags: **[S]** = sourced (see §11), **[E]** = estimate from drawings/proportions/photos, with confidence high / medium / low.

---

## 0. Numbers to build from (summary)

| Item | Value | Basis |
|---|---|---|
| Jets | 2 × Kamewa (ex FF-Jet) **FF-Jet 450** on the 90 H, **FF-Jet 410** on the 90 HS; sources also write "FFJet 450/410" for H boats. HSM: 2 × Kamewa/Kongsberg **S32 mixed-flow** | [S] SHK RM 2000:02, RM 2006:01, sv.Wikipedia, SoldF, naval-technology – high |
| Engines | 2 × Scania DSI14 V8, 625 hp / 460 kW (H, HS), driving each jet through a shaft with a **centrifugal clutch** and a rubber-element intermediate shaft; no reduction gear | [S] SHK, Kamewa fact sheet ("FF-series jets do not require reduction gears") – high |
| Max shaft speed | FF41: 2300 rpm; FF450S: 2100 rpm | [S] RR FF fact sheet 2002 – high |
| Pump type | single-stage **axial-flow**, aluminium unit, stainless impeller/shaft/rods | [S] fact sheets – high |
| Transom flange (each jet) | FF41: **0.86 m wide × 0.80 m high**; FF45: 0.88 × 0.85 | [S] fact sheet dims A × B – high |
| Jet axis height above the inlet base plate (hull bottom at the intake) | FF41: **0.327 m**; FF45: 0.347; FF450S: 0.36 | [S] dim E – high |
| Inlet duct length inboard of the transom (base plate) | FF41: **1.94 m**; FF45: 1.83 m; FF450S: 1.59 m | [S] dim C – high |
| Angle base plate ↔ transom flange | **93°** (transom raked 3° aft at the top) | [S] dim D – high |
| Length outboard of the transom to the aft end of the bucket | FF41: **1.05 m**; FF45: 1.11; FF450S: 1.20 | [S] dim F – high (matches LOA − hull length = 1.0 m) |
| Length inboard of the transom to the shaft-coupling flange | FF41: **1.34 m**; FF45: 1.33; FF450S: 1.08 | [S] dim G – high |
| Dry weight | FF41 485 kg; FF45 520 kg; FF450S 510 kg | [S] – high |
| Impeller diameter | ≈ **0.41 m** (FF41/410) / ≈ 0.45 m (FF45/450) – the model number is the impeller size in cm | [E] naming convention (A3-40 = 40 cm etc.) – medium |
| Nozzle exit diameter | ≈ **0.24–0.28 m** | [E] – low-medium (see §8) |
| Jet centre spacing on the CB90 transom | ≈ **±0.50–0.55 m** from the centreline (1.0–1.1 m apart) | [E] flange width 0.86 m + photos – medium-low |
| Jet axis height above baseline (keel at transom) | ≈ **0.45 m** (≈ 0.3–0.35 m below the 0.8 m static waterline) | [E] – medium-low |
| Steering nozzle | pivots about a **vertical** axis, **±30°**, both nozzles together (tie rod, one steering cylinder) | [S] Kamewa manual, KTH thesis, SHK – high |
| Reversing bucket | **split-duct hood bucket carried on the steering unit**, pivots about a **horizontal transverse** axis; infinitely variable; **zero thrust at ≈ 70 % lowered**; full travel ≈ **45–55°** | [S] Kamewa manual (70 %), KTH (45°, size 125) – high / [E] medium |
| Bucket travel time | full ahead → full astern **2 s** | [S] SHK RM 2006:01 – high |
| Astern thrust | ≈ 50–70 % of ahead thrust (65 % quoted for FF67, "around 70 %" for the A3 bucket) | [S] Riviera/Marinelink – medium for the old FF-Jet |
| Sideways thrust (split buckets + nozzles) | up to ≈ 30 % of total thrust | [S] Kongsberg – high (generic Kamewa) |
| Crash stop | "2.5 boat lengths ≈ 37 m" (SoldF); measured 85 m from 37.5 kn (SHK 2000), 66 m from 39.8 kn and 47 m from 32 kn (SHK 2006) | [S] – high |

---

## 1. Identity and history of the jets

* **FF-Jet** (FF Jet Ltd Oy, Kokkola, Finland) launched its own light **aluminium axial-flow** waterjets in **1985**, for lower powers than Kamewa's steel units. The two CB90 prototypes 801 *Helge* and 802 *Helga* (1988) were specified with "FF 450" jets from the Kokkola yard (sv.Wikipedia: "Alumina varvet i Kokkola"); later series boats got "FF 41"/"FF-jet 410". **Vickers** (owner of Kamewa, Kristinehamn) bought FF Jet in **1994**, Rolls-Royce bought Vickers in **1999**, and Kongsberg bought the business in **2019**. The FF range was made by Rolls-Royce Oy Ab in Kokkola until the A5 replaced it in 2018. [S: Kongsberg "40 years" story via cyprusshippingnews, sv.Wikipedia, RR fact sheet 2002 (Rolls-Royce Oy Ab, Kokkola)] – high.
* Naming: Rolls-Royce lists the same units as **FF41 / FF45 / FF450S**; Swedish sources write **FF-Jet 410 / 450**. The 2002 sheet lists FF41 (1000 kW sprint, 2300 rpm) and FF450S (1100 kW, 2100 rpm); the 2018 Kongsberg sheet lists FF41 (735 kW class power) and FF45 (885 kW). At 460 kW per engine the CB90 runs the jets well inside their ratings. [S] – high.
* SoldF: at full speed the jets throw out **≈ 1 600 L/s** of water (wording is ambiguous whether per jet or in total; per jet is consistent with a 410–450 mm axial pump at 2100–2300 rpm) [S/E].

---

## 2. What you see at the stern (external geometry)

### 2.1 Overall arrangement
* Two identical units side by side on the transom, mirror-symmetric about the centreline, spaced ≈ 1.0–1.1 m centre-to-centre [E, medium-low]. Each unit projects ≈ **1.05–1.2 m aft** of the transom plating (dim F), which is exactly the difference between hull length (14.9 m) and LOA (15.9 m) [S, high].
* Outboard of the jets, near the chine corners, are the two hydraulic **trim planes** ("trimplan", "underwater control surfaces similar to a submarine's diving planes"); the HSM has interceptors instead. Engine exhausts also exit through the transom. [S: SHK 2000 "Vattenjetaggregat och trimplan utanför akterspegeln", en.Wikipedia, FMV] – high for existence.
* Photo impression (medium confidence, from period photos of H/HS boats on slips and trailers): the transom shows two boxy aluminium **steering units** just behind the transom, each crowned by a large rounded **hood-shaped bucket** with a vertical seam on the centreline and two lobes spreading down and outwards; the buckets sit high, above the jet axis, when the boat is under way ahead, so from astern they look like two helmets side by side. Hydraulic cylinders and their rods sit **on top of** each unit; a transverse **tie rod (parallellstag)** links the two steering units so they steer together [S for tie rod: SHK 2000 "Parallellstagsinställningen var normal"]. Units are usually painted the hull grey; the Kamewa logo is cast into the back of later buckets (2018 sheet drawing).

### 2.2 The fixed part (bolted/welded to the transom)
* A rectangular **transom flange plate** ≈ 0.86 × 0.80 m (FF41) with a bolt circle; the unit is either bolted or welded in (aluminium hull → welded flange version) [S] – high.
* Aft of the flange, on the jet axis, a short cylindrical **stator / guide-vane housing** (≈ 0.45–0.5 m outer diameter, ≈ 0.15–0.25 m long outboard) ending in the fixed **outlet nozzle** that contracts the flow to the jet diameter [E, medium].
* Above it a bracket carrying the **vertical steering shaft** ("steering shaft", component 6 in the Kamewa parts figure) and the steering lever. [S: Kamewa FF375S manual component list] – high for existence.

### 2.3 The moving parts
* **Steering unit** ("steering nozzle", *styrdysa* in SHK Swedish): a box/duct that sits **outside the fixed nozzle** and swings about the vertical steering shaft: "adding a box outside the nozzle that the jet stream can pass through. The box rotates around its point of attachment … allowed to rotate 30° in each direction" [S: KTH thesis, Rolls-Royce material] – high. Its pivot is ≈ 0.2–0.3 m aft of the transom on the jet axis [E, medium]; the unit is ≈ 0.3–0.35 m long and ≈ 0.4–0.5 m wide/high on the FF41 [E, medium].
* **Reversing bucket** (*backskopa / skopa*): hangs on two trunnions on the sides of the steering unit, i.e. it **turns with the nozzle**: "The Kamewa water jet is equipped with an integrated reversing mechanism attached to the steering unit" [S: KTH] – high. Width ≈ 0.75 m, height ≈ 0.5 m, aft end ≈ 1.05 m behind the transom when raised (FF41) [E from fact-sheet rear/side drawings scaled to A/F, medium].
* Two **hydraulic cylinders** per jet (steering, reversing) with stainless rods; on the FF-Jet generation the piston rods are exposed outboard (the manual tells you to park the bucket "full ahead" and the nozzle "so that the piston rod is inside the steering cylinder … to protect the piston rods from corrosion and fouling"); on the 2005+ FF600/FF67 the cylinders were moved inboard on the inlet duct with rods through the transom [S: FF410 manual excerpt, Riviera FF600] – medium for the CB90 (older generation → cylinders on the unit behind the transom).

### 2.4 The intake under the hull
* The inlet duct is a welded sea-grade aluminium duct with a flat **base plate** that lies against the hull bottom; base plate length ≈ **1.94 m** forward of the transom (FF41), width ≈ the flange width (0.8–0.9 m) [S dims C, A – high; width E, medium]. The duct rises from the bottom opening to the impeller housing at 93° to the transom flange, i.e. the shaft is almost parallel to the keel with the transom raked 3° [S – high].
* The intake opening is a rounded-rectangular hole in the flat pocket of the bottom immediately forward of the transom, covered by a longitudinal **inlet grid** (rake bars; "intake grids cleaned monthly", "vattenintagets sil") [S: Pierce Marine, SHK 2006] – high for existence, geometry [E]: opening ≈ 0.45 m wide × 0.8–0.9 m long with 4–6 fore-and-aft bars [E, low-medium].
* The CB90's jets are described as "**partially ducted**" – the intakes sit in tunnels/pockets in the 20° deadrise bottom, which together with the trim planes explains the hard high-speed turning [S: en.Wikipedia, naval-technology] – high (wording), geometry [E].

### 2.5 Fact-sheet dimension key (Rolls-Royce 2002 / Kongsberg 2018 drawings)
Side view: **F** = transom to aft end of bucket (outboard), **G** = transom to shaft-coupling flange (inboard), **C** = length of the inlet base plate inboard of the transom, **E** = base plate to shaft centreline at the transom, **D** = angle base plate/transom. Rear view: **A** = flange width, **B** = flange height.

| Model | A | B | C | D | E | F | G | dry kg | entrained water L |
|---|---|---|---|---|---|---|---|---|---|
| FF37 | 750 | 724 | 1660 | 93° | 299 | 911 | 1144 | 325/380 | 145/138 |
| **FF41** | **860** | **803** | **1943** | 93° | **327** | **1049** | **1338** | 485 | 192/170 |
| FF45 (2018) | 880 | 846 | 1827 | 93° | 347 | 1114 | 1331 | 520 | 209 |
| FF450S (2002) | 880 | 842 | 1585 | 93° | 360 | 1202 | 1081 | 510 | 175 |
| FF500 | 950 | 970 | 2200 | 90° | 450 | 1333 | 1525 | 840 | 350 |

(mm; [S] RR "Kamewa waterjets FF-series" fact sheet 2002 and Kongsberg "Waterjets aluminium series" sheet 01.06.18 – high)

---

## 3. Kinematic chain for the model

```
hull
└─ jetHousing (fixed: transom flange, stator housing, outlet nozzle, steering-shaft bracket)
   ├─ steeringUnit  – rotates about a VERTICAL axis through the steering shaft,
   │                  ±30°, pivot ≈ 0.25 m aft of transom on the jet axis
   │   ├─ bucket    – rotates about a HORIZONTAL TRANSVERSE axis through trunnions
   │   │              on the steering-unit sides, ≈ 0.45–0.5 m aft of transom,
   │   │              at ≈ jet-axis height; 0° = fully raised (full ahead),
   │   │              ≈ 35° (70 %) = zero thrust, ≈ 50° = full astern
   │   ├─ reversing cylinder (on top of the steering unit) + lever to the bucket
   │   └─ tie-rod ball joint (links to the other jet's steering unit)
   └─ steering cylinder + lever on the steering shaft (one cylinder drives both jets
      through the tie rod)
```
* Sign convention used by the team's Three.js note: nozzle yaw about +Y, bucket about Z; positive yaw = jet deflected to starboard = bow turns to starboard.
* Because the bucket is a child of the steering unit, reversed flow is steered too (see §5.5). If the brief insists on "nozzle steers inside a fixed bucket" (Hamilton/Ultrajet style), keep it as a switch – the real Kamewa FF arrangement is bucket-on-nozzle.

---

## 4. Steering nozzle

* Axis: vertical, through the "steering shaft" immediately behind the transom [S – high].
* Range: **30° to each side** – "Full steering lock starboard means that the steering nozzle is turned 30° to starboard side" (Kamewa manual); "allowed to rotate 30° in each direction" (KTH/Rolls-Royce) [S – high]. Corrective steering under way is typically ±5° [S: KTH load spectrum].
* Both nozzles move together with the helm wheel. On the CB90 the two steering units are coupled by a **tie rod (parallellstag)** and driven by one **steering cylinder** ("styrcylindern", singular in SHK RM 2000:02 and RM 2004:01; four through-bolts hold its bracket; the piston-rod length adjustment sets the neutral – SHK measured how 5–25 mm of mis-adjustment progressively ruined the port turn) [S – high].
* The helm has a **rudder-angle indicator (roderindikator)** showing nozzle angle [S: SHK 2004/2006/2008] – high.
* Effect: "induces a turning moment to the vessel in the direction that the nozzle is pointing"; Kamewa quotes rudder forces up to four times a propeller/rudder's [S].
* Measured turning (SHK RM 2000:02, boat 836, 90° turn from the turning point, wheel only = "dysgir"): 37.5 kn → **137 m port / 113 m starboard** (10.5 / 7.4 s); 25 kn → 100 / 90 m. SHK RM 2006:01 (boat 929): turning radius **54 m at 39.8 kn**, 42 m at 32 kn [S – high].
* Animation: full lock-to-lock in ≈ 2–3 s is realistic for a hydraulic steering cylinder of this size [E, medium].

---

## 5. Reversing bucket (backskopa)

### 5.1 Type and mounting
* Kamewa FF buckets are **hood / split-duct** buckets: a single casting hung on two trunnions on the steering unit, which catches the jet and turns it **forward and downward**, splitting it into two streams that leave through duct outlets on either side of the nozzle (so the reversed water does not hit the transom or the neighbouring jet). The 2018 rear drawing shows a symmetric two-lobed body with a vertical centre seam; the side drawings show the hood above the nozzle with the near-side outlet curling forward-down [S drawings + Kamewa manual "deflects … in a forward/downward direction"] – medium-high on the shape, high on the function.
* It is mounted **on the steering unit**, not on the fixed housing ("integrated reversing mechanism attached to the steering unit"; the FF375S parts list has the "reversing cylinder" on the unit) [S – high]. A 1990 Kamewa patent (WO 92/07754, Forsström) shows an alternative pair of side deflectors with integral reversing scoops on the nozzle, and the 1983 Kamewa/1987 MJP patents show twin flaps inside the nozzle – none of these is the CB90's FF bucket, but all confirm the horizontal-transverse pivot and forward-down deflection.

### 5.2 Motion
* Pivot: **horizontal, transverse**, through trunnions on both sides of the steering unit at roughly the jet-axis height, ≈ 0.45–0.5 m aft of the transom (FF41) [E from drawings, medium].
* "The reversing bucket is **infinitely variable** between three main positions":
  1. **Full ahead** – "completely raised. The jet of water is now unaffected by the reversing bucket and thereby the maximum ahead thrust is obtained."
  2. **Zero thrust** – "obtained when the reversing bucket is **lowered about 70 %**": "deflects the major part of the jet of water in a forward/downward direction, while the remaining part of the jet of water passes straight backwards" – the two forces cancel and the boat hovers.
  3. **Full astern** – "fully deflects the jet of water in a forward/downward direction, i.e. the boat is reversing." [S: Kamewa FF-series operating manual (FF375S/FF410 excerpts)] – high.
* Angular travel: for a Kamewa size-125 unit Rolls-Royce gave the KTH students "a deflection angle of 45° in fully opened mode" and a rod travel of ≈ 650 mm (0.52 × pump diameter → ≈ 0.21 m of rod travel on an FF41) [S – high for that unit]. For the smaller FF hood bucket, use **≈ 50° full travel, neutral at ≈ 35°** (70 %) [E, medium]. The bucket lip must clear the ≈ 0.25 m jet when raised and fully cover it when lowered, which needs 45–60° with the trunnion geometry above.
* Speed: "skopmanöverns hastighet back och fram … normalt värde, **två sekunder**"; "tar det två sekunder innan skoporna har fällts ner och verkar fullt" [S: SHK RM 2006:01] – high. So full-ahead → full-astern ≈ 2 s (25°/s).
* The thrust curve is not linear: nothing happens for the first ~30–40 % of travel (the hood is still above the jet), thrust falls quickly to zero at ≈ 70 %, and goes to full astern (≈ 50–70 % of ahead thrust) at 100 %. Suggested model: ahead fraction f(t) ≈ 1 for t < 0.35, then linear to 0 at t = 0.70, then astern growing to −0.6 at t = 1 [E from the manual's description, medium].

### 5.3 Where the water goes in reverse
* At full astern the whole jet is turned ≈ 150–160° in the hood and leaves the two side outlets pointing **forward and downward** (≈ 30–45° below horizontal, splayed ≈ 20–30° outboard) under and beside the hull – "the stream is caused to exit … downwardly and forwardly" [S patents/manual for direction; angles E, medium]. Reversing at speed (crash stop) throws a huge sheet of white water forward past the boat ("skjuter alltså en enorm vattenstråle i färdriktningen").
* Visual cue for the model: in reverse, spawn two spray cones from the bucket's lower side outlets pointing forward-down; ahead, one cone from the nozzle.

### 5.4 Two buckets independently
* Each jet has its own bucket lever; the buckets are normally moved together but can be **split**: one raised, one lowered, so one jet pushes and the other pulls and the boat rotates on the spot; with the nozzles angled against the rotation the result is pure sideways translation ("crabbing", up to ≈ 30 % of total thrust). [S: US 6 386 930 (differential bucket control), Kongsberg "five wonders", SoldF/skippo text "Skoporna styrs steglöst för att kunna hovra på stället samt sidoförflyttning … möjlighet att rotera på stället"] – high.
* CB90 practice: the SHK 2000 trials list a **"skop-gir" (ratt och BB skopa)** – wheel hard over plus the inside bucket lowered – which turned the boat 90° in **86 m (port) / 73 m (starboard)** at 37.5 kn against 137/113 m for a wheel-only turn; "skopsväng" was a pure emergency manoeuvre in 1993 but later treated as a normal one [S: SHK RM 2000:02] – high.

### 5.5 Steering while reversing
* Yes. Because the bucket rides on the steering unit, the whole nozzle+bucket assembly yaws ±30° with the wheel; "When the steering nozzle is straight the jet of water is unaffected, which means that the boat will move straight ahead, or astern, depending on the position of the reversing bucket" [S: Kamewa manual] – high. In reverse the stern is pushed the *opposite* way to what the same wheel input does ahead (reversed flow vector), which is why control systems offer a docking mode that re-maps the joystick.
* Note on the brief's wording "the nozzle steers inside the bucket": that describes Hamilton/Ultrajet-type fixed buckets. On the Kamewa FF the geometry is equivalent for the user (nozzle angle still steers in reverse) but the bucket visibly turns with the nozzle. Model it as a child of the steering unit; keep the alternative behind a flag if the team wants to compare.

---

## 6. Hydraulics

* One hydraulic system serves steering, both buckets and the trim planes: two **engine-driven hydraulic pumps** (one on each Scania, key-driven), a common **hydraulic valve block** (*hydraulblock*) and tank with level switches; loss of one pump gives no indication to the driver. Supplier Hydroswede. A bench test of one pump: 33.4 L/min at 1450 rpm at 18 bar (test condition, not the system pressure) [S: SHK RM 2000:02] – high.
* System pressure on FF units is not published ("operates under extremely high pressure"); typical Kamewa small-jet systems run ≈ 100–150 bar [E, low]. Cylinders are double-acting; the manual notes an emergency mode where the buckets/nozzles can be moved with no electricity [S].
* Cylinder placement for the FF-Jet 410/450 generation: **on the unit, outboard**, behind the transom – the reversing cylinder lies on top of the steering unit in line with the jet and pushes a lever on the bucket; the steering cylinder acts on a lever on the vertical steering shaft just behind the transom [S manual "piston rod inside the steering cylinder" to avoid fouling; drawings] – medium. Later FF600/FF67 (2005+): "Reverse and steering hydraulic cylinders are mounted inboard … anchored to a flange part of the way along the inlet duct next to the thrust bearing" with stainless rods through the transom [S: Riviera] – high for those models. For the CB90 model: put one cylinder (≈ Ø 0.08 × 0.35 m) fore-and-aft on top of each steering unit for the bucket and one transverse-ish cylinder plus the tie rod behind the transom for steering.
* Position feedback: the SHK reports mention a rudder indicator; newer Kongsberg controls show nozzle and bucket position as bar graphs on the display [S].

---

## 7. How the CB90 operator drives it

### 7.1 Helm layout (90 H / HS)
* Driver in the **starboard seat** ("styrbordsstolen är avsedd för båtens förare och har manöverorgan för vattenjetdriften, reglage för motorvarvtal och trimplan, instrumentpanel och elektronisk skärm") [S: SHK RM 2000:02] – high.
* SHK RM 2004:01, figure 3 labels of the driver's station: **ratt (wheel)**, **"Propulsorkontroller"** (jet/bucket controls), **"Varvtalsreglage"** (rpm levers), **"Trimkontroller"**, engine instruments, electronic compass, rudder indicator [S] – high.
* Modellers who served on the boats: "två gasreglage (spakar), två skopreglage (också spakar) samt ratt" – **two throttle levers, two bucket levers and a wheel**; the trim planes are lowered with the two levers to the right of the wheel [S: modellbygge.ifokus.se forum via search] – medium-high.
* So: wheel → both nozzles (±30°); left/right **bucket levers** (*skopreglage*, one per jet, stepless: forward = raised/ahead, mid = ≈ 70 % lowered/neutral, back = full astern); left/right **rpm levers**; trim-plane levers; MG elevation/fire buttons built into the manoeuvring levers on the H [S: Dockstavarvet spec].
* Driving technique (SoldF/skippo): keep rpm steady and modulate thrust with the buckets; a crash stop is "full framåt till full back i en rörelse" – bucket levers thrown fully back at full rpm [S].

### 7.2 Manoeuvres and measured performance
| Manoeuvre | How | Result |
|---|---|---|
| Dysgir (nozzle turn) | wheel only | 90° in 137/113 m at 37.5 kn (SHK 2000); radius 54 m at 39.8 kn (SHK 2006) |
| Skopgir (bucket turn) | wheel + inside bucket lowered | 90° in 86/73 m at 37.5 kn |
| Kraschstopp | both buckets full astern | 85 m from 37.5 kn (SHK 2000); 66 m from 39.8 kn, 47 m from 32 kn (SHK 2006); SoldF quotes 2.5 lengths ≈ 37 m |
| Effektavdrag | rpm to idle, nozzle kept over | turning stops, boat runs straight 145 m and stops |
| Stopp med enbart varvtal | idle, buckets up | 143 m from max speed |
| Rotate on the spot | one bucket ahead, one astern | rotation about the vertical axis |
| Sideways (crab) | split buckets + nozzles against the rotation | up to ≈ 30 % of thrust sideways |
| Hover / station keep | both buckets ≈ 70 % | zero net thrust |
[S: SHK RM 2000:02 §1.9.1, RM 2006:01, SoldF, Kongsberg] – high.

### 7.3 Joystick / docking mode (Kongsberg controls, relevant to the HSM and to "docking mode" in the app)
* Kongsberg/Kamewa jet control systems (JCS Compact/Extended, "Vector Stick") offer a steering wheel/knob, **single or twin bucket levers**, a **combo lever** (bucket + rpm in one lever, with a neutral detent), and a **3-axis joystick**. Joystick mapping (Kamewa Vector Stick manual and the Rolls-Royce/Talaria patents WO 00/13967, US 6 386 930): **twist = both nozzles**, **fore/aft = both buckets** (centre detent = neutral bucket, engines at idle), **left/right = differential buckets** (port bucket down + starboard up → bow to port); left + opposite twist → pure sideways. **Transit mode**: joystick locked to fore/aft, buckets and rpm together. **Docking mode**: free X/Y, nozzles, buckets and rpm individually, follow-up control (bucket goes to the position matching the stick). Displays show nozzle and bucket position. [S] – high for the systems; whether the HSM uses exactly this is not confirmed [E, medium].
* For the app: implement a "docking/joystick" mode with those three axes, plus the classic wheel + two bucket levers + two throttles.

---

## 8. Inside the unit (for an optional cutaway)

Flow path, forward to aft (FF-series manual component list: reversing bucket, steering nozzle, guide-vane chamber, impeller, impeller housing, steering shaft, inlet duct, anode hatch, bearing housing, inspection hatch, reversing cylinder, serial plate, oil dipstick) [S – high]:

1. **Inlet duct** – welded aluminium, base plate flat on the hull bottom, opening with a longitudinal **grid**; the duct curves up and aft at ≈ 25–30° to meet the shaft axis [S/E]. Water enters "both as a result of the movement of the boat and due to the action of the impeller".
2. **Shaft** – stainless, runs forward through the duct roof/inlet to the **thrust-bearing housing** inboard (at the G end, 1.34 m forward of the transom on the FF41), then the rubber-element intermediate shaft and centrifugal clutch to the engine flywheel [S: SHK "mellanaxlarna", "centrifugalkoppling"; manual]. A water-lubricated **rubber bearing** and a **mechanical seal** sit at the impeller end [S: manual, Pierce Marine].
3. **Impeller housing** – aluminium, **polyurethane-lined** for wear/corrosion, with a replaceable wear ring; inspection and anode hatches on top [S – high]. Located at/just inboard of the transom.
4. **Impeller** – stainless, single-stage **axial-flow**, ≈ 0.41 m diameter (FF41), max 2300 rpm; blade pitch angles are chosen per installation ("five different impeller blade pitch angles" on the A3 range). Blade count is not published; Kamewa axial impellers of this size have **4–6 blades** – use 5 [E, medium-low].
5. **Guide-vane chamber (stator)** – fixed vanes "eliminate the rotation of the water flow", converting swirl into axial thrust; ≈ 7–11 vanes [E, low-medium]; it is the part that pokes through the transom and ends in the **outlet nozzle** (≈ 0.24–0.28 m exit diameter [E], from ≈ 0.6–0.7 × impeller diameter and from 0.8–1.6 m³/s at 27–34 m/s jet velocity for 40 kn).
6. **Steering nozzle unit** on the vertical **steering shaft**, then the **bucket** on trunnions, as in §3–§5.

Entrained water inside the transom (water sitting in the duct when stopped): 170–192 L (FF41) [S].

---

## 9. Suggested model parameters (FF41-sized unit on a 90 H, hull frame: x aft-positive from the transom, y up from baseline, z to starboard)

| Part | Position / size | Motion |
|---|---|---|
| Transom flange | at x = 0, centred z = ±0.53 m, y = 0.12–0.92 m, 0.86 × 0.80 m plate, rake 3° | fixed |
| Jet axis | y ≈ 0.45 m (0.327 m above the local base plate) | – |
| Stator/nozzle housing | x = 0 → 0.2 m, Ø 0.48 m tapering to Ø 0.26 m exit | fixed |
| Steering-shaft bracket | over the housing at x ≈ 0.25 m | fixed |
| Steering unit | pivot at x = 0.25 m (vertical axis); body x = 0.2 → 0.55 m, 0.45 × 0.45 m | yaw ±30°, ≈ 25°/s |
| Bucket | trunnions on the steering unit at x = 0.47 m, y = jet axis; body 0.75 m wide, 0.5 m tall, aft end at x = 1.05 m when raised | pitch 0 → 50° (down), 25°/s; neutral at 35° |
| Reversing cylinder | on top of the steering unit, x = 0.2 → 0.55 m, Ø 0.08 m; rod to a lever on the bucket top | stroke ≈ 0.2 m |
| Steering cylinder + tie rod | behind the transom above the housings, tie rod at y ≈ 0.75 m spanning z = −0.53 → +0.53 m | – |
| Inlet | base plate x = 0 → −1.94 m, 0.86 m wide; grid opening x = −0.3 → −1.2 m, 0.45 m wide | fixed |
| Thrust-bearing housing | x = −1.34 m on the jet axis (inboard, engine room) | – |
| Trim planes | z ≈ ±1.3–1.4 m at the transom, y ≈ 0.05–0.2 m | tilt (separate note) |
| Jet spray | ahead: cone from the nozzle exit; reverse: two cones from the bucket side outlets pointing forward-down (−x, −y, ±z) | scaled with rpm and bucket position |

Confidence: sizes tied to A–G are high; positions along the jet (pivots, bucket trunnions) medium; z-spacing and y-height medium-low.

---

## 10. Open questions / caveats

* Exact CB90 jet spacing and axis height have no published source; measure from a stern photo with the 3.8 m beam as scale if precision matters.
* Which units a given hull carries (450 vs 410, and possibly later FF41 replacements) varies by batch; dimensions differ by only 2–4 %.
* Cylinder placement (outboard on the unit vs inboard with rods through the transom) is generation-dependent; the outboard arrangement is the better bet for 1990s FF-Jet units.
* Nozzle exit diameter, impeller blade count and stator vane count are estimates.
* The HSM's S32 mixed-flow jets (Kongsberg) have a different, more compact bucket and interceptors instead of trim planes; this note is for the H/HS.

---

## 11. Sources

* Rolls-Royce Oy Ab (Kokkola), *Fact sheet – Kamewa waterjets FF-series*, © 2002 – dimension table A–G, sprint power, shaft speed, weights, drawings. (mirror: storebropassion.de download `rrkamewaff450s`)
* Kongsberg Maritime, *Waterjets – aluminium series* fact sheet 03.Waterjet 01.06.18 – updated FF table incl. FF45, drawings with bucket in two positions. https://www.kongsberg.com/contentassets/8b800421dee947a890f80f746b98b70d/03.waterjet_2p_01.06.18.pdf
* Rolls-Royce marine product catalogue, *Waterjets* (FF/A3/S3 tables, "compact reversing bucket … around 70 per cent of forward thrust", interceptor note). https://werkenindeoffshore.nl/content/waterjets-rolls-royce.pdf
* Kamewa FF-series operating manual excerpts (FF375S/FF410): 30° steering, bucket positions, "lowered about 70 %", component list, parking of piston rods, Vector Stick transit/docking modes. https://pdfcoffee.com/kamewa-2-pdf-free.html ; https://pdfslide.net/documents/manual-for-waterjet-ff410.html (index only)
* KTH master thesis, *Water jet steering concept – evaluation of an environmental design* (Rolls-Royce Kamewa data: steering box rotates 30° each way, reversing mechanism attached to the steering unit, 45° bucket deflection, 650 mm rod travel, 125 kN reversing cylinder force on a size 125, cylinders outboard on current design). https://www.diva-portal.org/smash/get/diva2:708479/FULLTEXT01.pdf
* Riviera Maritime Media, *FF600 model boosts Kamewa's small waterjet series* (inboard cylinders on the FF600, materials). https://www.rivieramm.com/news-content-hub/news-content-hub/ff600-model-boosts-kamewas-small-waterjet-series-51894
* Marinelink, *Rolls-Royce Launches Light Waterjet* (FF67: reversing efficiency up to 65 %, new steering nozzle). https://www.marinelink.com/news/rollsroyce-launches329799
* Kongsberg Maritime, *Kamewa waterjets – 40 years* (FF Jet Kokkola 1985, Vickers 1994, FF name retired 2018) via https://cyprusshippingnews.com/2020/08/11/kongsberg-kamewa-waterjets-40-years-and-counting/
* Kongsberg Maritime, *Five wonders of waterjet* (30 % sideways thrust, buckets, crash stop). https://www.kongsbergmaritime.com/feature_articles/2025/10/five-wonders-of-waterjet/
* Kongsberg Maritime, Jet Control System Compact / Extended / Compact control system pages (bucket levers, combo lever, twin lever, 3-axis joystick, position display). https://kongsbergmaritime.com/products/propulsors-and-propulsion-systems/waterjets/waterjet-control-systems/
* Patents: WO 00/13967 & US 2001/0021613 (steering and thrust control: Helm/Docking/Power-steer modes, neutral bucket at joystick detent); US 6 386 930 (differential bucket control, sideways motion, neutral bucket ≈ half the stream); US 4 538 997 (Kamewa AB 1983 reversing flaps, horizontal transverse pivot); WO 92/07754 (Kamewa AB 1990 split deflectors with reversing scoops on the nozzle, flow exits "downwardly and forwardly"); WO 88/09288 (MJP 1987 flaps journalled in the steering means).
* Statens haverikommission RM 2000:02 (Strb 90H 820): boat data, helm description, hydraulic pumps/block, steering cylinder & tie rod, manoeuvring trials table (dysgir/skopgir/kraschstopp). https://shk.se/download/18.2d6f089b18faca29dc815df1/1698926520208/rm2000_02.pdf
* SHK RM 2004:01 (driver's station figure labels: propulsorkontroller, varvtalsreglage, trimkontroller; steering cylinder bolts). https://shk.se/download/18.2d6f089b18faca29dc817b52/1698926581112/rm2004_01.pdf
* SHK RM 2006:01 (boat 929 trials: 2-s bucket travel, crash-stop distances, turning radii; skopreglagen). https://shk.se/download/18.2d6f089b18faca29dc818bfc/1698926590852/rm2006_01.pdf
* SHK RM 2008:02 (boat 848: helm layout, FF Jet 450, centrifugal clutch). https://shk.se/download/18.2d6f089b18faca29dc81a571/1698926603898/10264848_rm2008_02.pdf
* SoldF, *Stridsbåt 90 H* (FF-Jet 450, 1 600 L/s, 2.5 boat lengths / 37 m, reversing by turning the stream forward). https://www.soldf.com/fartyg-och-batar/stridsbat-90h-strb90h/
* sv.Wikipedia *Stridsbåt 90H* (FF-Jet 450 on H, FF-jet 410 on HS, Kokkola prototypes); en.Wikipedia *CB90-class fast assault craft* ("partially ducted", control surfaces, 2.5 lengths). https://sv.wikipedia.org/wiki/Stridsb%C3%A5t_90H ; https://en.wikipedia.org/wiki/CB90-class_fast_assault_craft
* Dockstavarvet CB90 H specification (fire controls in the manoeuvring levers; 14.9 m, 3.85 m). https://www.dockstavarvet.se/products/combat-and-patrol-boats/combat-boat-90-h/specification/
* naval-technology.com, *Combat Boat 90* and *CB90 HSM* (partially ducted jets; S32 mix-flow with hydraulic clutches). https://www.naval-technology.com/projects/combatboat90/ ; https://www.naval-technology.com/projects/combat-boat-90-hsm/
* modellbygge.ifokus.se *Stridsbåt 90* thread (two throttle levers, two bucket levers, wheel, trim levers) – via web search snippet. https://modellbygge.ifokus.se/discussion/480583/stridsbat-90
* Cults3D, *RC scale combat boat with 3D-printed waterjets* (1:24 CB90H with Kamewa FF410 jets; two rods per jet: one bucket, one nozzle; individual jet control needed for sideways). https://cults3d.com/en/3d-model/game/rc-scale-combat-boat-with-3d-printed-waterjets
* Pierce Marine Engineering, *Kamewa waterjet maintenance cycle* (intake grids, rubber bearing, wear ring, cylinders/rods, anodes). https://piercemarine-eng.com/blog/kamewa-waterjet-maintenance-cycle
