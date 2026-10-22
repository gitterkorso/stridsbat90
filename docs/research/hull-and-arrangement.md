# Stridsbåt 90 H / HS (CB90) — Hull form and general arrangement

> Publiceringsnotis: Filnamn under Referens/, shots/, tmp/ och backups/ avser lokalt granskningsmaterial som inte distribueras. Källänkar och rapportens egna slutsatser finns kvar; se [licensinformationen](../../THIRD_PARTY_NOTICES.md).

> **Historic mixed-variant research note; superseded as a modelling specification on 2026-10-20.** The current hierarchy is Swedish CB90H, the user's 925 foredeck photo, and HEXM GA only for common construction. See [the current audit](full-model-audit-findings.md). This note retains old estimates and comparisons with HS/HSM for provenance, not as permission to mix their fittings into the selected H. Its coordinate convention also differs from the implementation: the model uses Y up and the waterline as Y=0.

**Corrections established 2026-10-20:** the selected older Swedish H interior follows SHK RM2008:02 printed p.12: nine inward-facing transport seats on each side plus two forward-facing seats against the aft bulkhead; three helm seats including a folding middle seat; one starboard display and two port displays with keyboard. The 925 foredeck reference has three separate front windows with a central pane and a horizontal guard hoop. Earlier estimates of glass counts, heights and positions below are not current dimensions. The earlier keel/deck station table in §5 is retained as history and must not replace the audited `src/constants.js` geometry.

Research note for the Three.js model. Coordinate convention used throughout:

* **x** = metres forward of the transom plating (x = 0 at the transom, x = 14.9 at the stem/ramp face).
* **y** = half-breadth from the centreline (metres).
* **z** = height above the baseline (underside of keel at the transom). Full-load waterline is at z ≈ 0.80 m (H) / 0.90 m (HSM).

Every figure is tagged **[S]** (sourced, with the source named) or **[E]** (estimate from proportions/photos/naval-architecture rules of thumb, with a confidence level). Sources are listed at the end.

---

## 1. Principal dimensions

| Item | Stridsbåt 90 H / HS | Stridsbåt 90 HSM (2019+) | Notes |
|---|---|---|---|
| Length overall (LÖA) | **15.9 m** [S: sv/en Wikipedia, SoldF, Högman] | **16.3 m** [S: Saab, naval-technology, Högman] | Includes waterjet nozzles/reversing buckets aft and the bow ramp/fender forward. Enforcer III (civil CB90H) also 15.90 m [S: Dockstavarvet]. |
| Hull length (skrovlängd) | **14.9 m** [S: SoldF, Dockstavarvet "Length OA 14.90"] | 14.9 m [S: Saab] | Transom to stem. en.Wikipedia calls this the "waterline" length; it is really the hull length. |
| Waterline length (static) | **≈ 13.0 m** at light/standard load [S: Dockstavarvet Enforcer III "Length CWL 13.00 m"; navypedia RCB "13.0 pp"], ≈ 14.0 m at full load [E, medium] | same | The forefoot is raked, so LWL grows with draft. |
| Beam moulded | **3.80 m** [S: all] | 3.8 m | 3.85–3.86 m overall incl. rubbing strake/fenders [S: Dockstavarvet 3.85; navypedia 3.86; root-nation 3.85]. |
| Draft | **0.8 m** [S: Wikipedia, SoldF] | **0.9 m** [S: Saab] | Enforcer III at 17 t light: 0.9 m [S: Dockstavarvet]. Measured to the keel/jet intakes at the transom. |
| Displacement | 13 000–13 300 kg empty; 15 300 kg "rustad" (standard); 18 200 kg design full load (19 200 kg with mine load) [S: Särtryck stridsbåt]; 18 300–20 500 kg loaded (max) [S: SoldF, sv.Wikipedia] | 18 000 kg light; 24 500 kg max [S: Saab] | Enforcer III 17 t light [S: Dockstavarvet]. US RCB 49 000 lb (22.2 t) operational [S: SAFE Boats via search]. |
| Height, keel to mast foot / wheelhouse roof | **3.8 m** [S: SoldF "mastfot: 3,8 m"] | ≈ 3.9 m [E] | Dockstavarvet: "Height (loaded on a standard low-loader) less than 4.5 m" — consistent with a boat ≈ 3.8–3.9 m high with the mast folded. |
| Height, keel to mast top (radar) | **5.0 m** [S: SoldF "masttopp: 5 m"] | ≈ 5.0–5.2 m [E] | ATLASt 1/35 kit: 470 × 110 × 150 mm = 16.45 × 3.85 × 5.25 m full scale. |
| Air draft above full-load WL | ≈ 3.0 m to wheelhouse roof; ≈ 4.2 m to mast top [E from the two figures above, high] | | The 90E (smaller sister) is quoted at 2.65 m above WL with mast folded [S: search snippet, sv sources]. |
| Fuel | 2 250 L [S: SoldF]; 2 200 L [S: Enforcer III]; 2 196 L [S: root-nation] | | |
| Hull material | Welded aluminium **SS 14 4140** (AlMg4.5Mn ≈ EN AW‑5083) [S: SoldF, root-nation]; US RCB in 5086 [S: SAFE Boats] | all-aluminium [S: Saab] | |
| Crew / troops | 3 (2 båtförare + 1 maskinist) / 18 fully equipped (21 max) or 4.5 t cargo [S: SoldF, Wikipedia] | 3 / 18 (up to 18–21 + 3) [S: FMV, Saab] | |

**Difference LOA − hull length (1.0 m on the H, 1.4 m on the HSM):** about 0.6–0.8 m is the waterjet nozzles and reversing buckets projecting aft of the transom, the rest is the bow ramp lip/fender at the stem; the HSM's extra 0.4 m is the larger S32 jets plus transom interceptors [E, medium].

---

## 2. Hull form

### 2.1 Type

Hard-chine **deep‑V planing monohull** with **reverse sheer** and a near‑vertical bow closed by a fold‑down landing ramp. Dockstavarvet: "a typical high-speed chine form hull, with reverse sheer and a narrow 1-man landing ramp forward" [S]. The hull and especially the bow and bottom are heavily reinforced for beaching ("förstärkt botten", "heavily reinforced for forceful landing on unprepared beaches", RCB: "reinforced keel and breaching plates") [S: SoldF, Dockstavarvet, SAFE Boats].

### 2.2 Deadrise

* **20° bottom angle on the production boat** [S: *Särtryck stridsbåt* — FMV designers Håkansson/Björklund chose 20° after SSPA tank tests; a 26° variant gave "större fartreduktion vid last" and "sämre egenskaper i medsjö"; root-nation: "Deadrise angle: 20º"]. Earlier prototypes were tried at 24° and 27° [S: SoldF forum].
* The 20° figure is the deadrise of the planing surface aft (transom to roughly midships). Forward it warps up to a fine entry: ≈ 24° at x = 7.5 m, ≈ 30° at x = 10.5 m, ≈ 45° at x = 13.5 m, 60°+ just abaft the stem [E, medium — normal practice for this type; the chine-height data below constrains it].

### 2.3 Chine, spray rails, keel

* Single hard chine. Chine height above baseline: **0.55 m at the transom ("slag akter"), 1.6 m at the bow ("slag för")** [S: SoldF]. With a chine half-breadth of ≈ 1.5 m at the transom this gives 20° deadrise exactly, which confirms the two numbers are consistent.
* The chine carries a horizontal chine flat / spray strip ≈ 0.10–0.15 m wide [E, medium]. One intermediate longitudinal spray rail per side on the bottom panel, running from the bow to about midships (fading out around x ≈ 5–6 m) [E, low; model one rail per side].
* Flat keel bar / beaching plate along the centreline, ≈ 0.15–0.20 m wide, thick plate forward [E, medium; the "reinforced keel/breaching plates" are documented].
* Keel line straight (no rocker) from the transom to about x = 9 m, then rising in a fair curve into a raked forefoot; the forefoot meets the ramp hinge ≈ 0.3–0.4 m above the full-load waterline [E, medium].
* Topsides: nearly vertical aft (≈ 5° flare), flaring to ≈ 15–20° in the bow above the rising chine [E, medium].
* No bulwarks: the deck edge is a rounded gunwale with a heavy rubbing strake/fender all round and low grab rails.

### 2.4 Bow

* Stem is a **vertical (0–5° forward rake) truncated face ≈ 1.1 m wide at deck level**, formed by the raised ramp ("In the raised position, the ramp gives the bow section a characteristic truncated shape" [S: root-nation]). Dockstavarvet: "narrow 1-man landing ramp forward" [S].
* The SHK report on Strb 848 (RM 2008:02, per search snippet) names the parts: the bow compartment (*förpik*) has **hatches on deck (stävluckor)** and **a door in the stem (stävport) which in the open position forms the ramp**. Root‑nation: "the corridor is covered from above by a two-part hatch that opens during disembarkation" [S].
* Ramp: bottom-hinged, ≈ 1.0 m wide × ≈ 1.3 m high, folding forward/down through ≈ 90–100° to rest on the rock/beach; hinge ≈ 0.3–0.4 m above the WL at rest so the lip lands dry when the bow is driven up on a rock [E, medium]. The two deck hatches above the corridor are hinged along their outboard edges and open upward/outward to give standing headroom in the corridor [E, medium; the fact that they open is sourced, the hinge line is estimated].
* Below the ramp the forefoot sweeps aft to the keel; the bow is protected by a wrap-around fender.
* Overhang: with LWL ≈ 13–14 m and hull length 14.9 m the stem overhangs the static waterline by ≈ 1–1.9 m [E from sourced numbers].

### 2.5 Transom / stern

* Transom is flat and near-vertical (≈ 5–10° rake, top aft) [E, medium]; width ≈ 3.3 m at the deck edge, ≈ 3.0 m at the chine; height from keel to deck edge ≈ 2.3 m on the centreline [E, medium — see §3 for the deck-height discussion].
* Bottom edge is the 20° V. Two waterjet intake tunnels are cut into the bottom immediately forward of the transom, centred at y ≈ ±0.55 m [E, medium]. The jet units (Kamewa FF‑450 on the H; Kamewa S32 mixed-flow with hydraulic clutches on the HSM [S: SoldF, Saab, FMV]) bolt to the transom with steering nozzles and reversing buckets ("backskopor") projecting ≈ 0.7 m aft.
* "Partially ducted" jets with "underwater control surfaces, similar to a submarine's diving planes" (Docksta's patented vertical stern fin/dive plane) give the sharp turning and the 2.5-boat-length crash stop [S: en.Wikipedia, navalreview.ca].
* HSM: transom **interceptors** ("interceptorer, en slags datorstyrda trimplan") added [S: FMV]; HS: 6 mm armour plate on the transom [S: Högman].
* Above the transom the aft deck runs flat to a low toe-rail; a Swedish ensign staff on the centreline; mine/depth-charge rails on the H run out over the transom (removed on the HSM) [S: Wikipedia/SoldF forum for the rails; geometry E].

### 2.6 Sheer and freeboard

* Reverse sheer: the deck edge is highest at about the wheelhouse (x ≈ 10–12 m) and falls gently toward both ends [S: Dockstavarvet "reverse sheer"; magnitudes E].
* Deck-edge heights used for the loft (see table in §5): transom 2.30 m, midships 2.42–2.50 m, wheelhouse 2.52 m, stem 2.48 m above baseline [E, medium-low]. Full-load freeboard is then ≈ 1.5 m at the stern, ≈ 1.7 m amidships and ≈ 1.7 m at the bow.
* Two published numbers bear on this and are worth recording verbatim: SoldF lists "Akterdäck: 2,8 m" among the heights "från botten", and a fandom copy of an older infobox lists "freeboard 2.4 m" (not verifiable — the page could not be fetched). 2.4 m matches a moulded depth of ≈ 2.4 m amidships; 2.8 m only fits if it refers to the raised mid-deck/coaming or a different datum. If the model looks too low-sided against reference photos, raise the whole sheer line by up to 0.3 m and keep the wheelhouse roof at 3.8 m.

---

## 3. General arrangement (fore to aft)

Longitudinal blocks (x from transom). All x-ranges are estimates from the Saab profile drawing, the Dockstavarvet description and photos unless noted [E, medium].

| Block | x range (m) | Description |
|---|---|---|
| Aft peak / jet space | 0 – 0.6 | Waterjet stator housings, hydraulics for nozzles/buckets, steering gear. Small deck hatch near the transom ("luckan till akterdelen av båten" [S: modellbygge.ifokus]). |
| **Engine room (maskinrum)** | 0.6 – 4.0 | "The aft 25% of the hull, behind an insulated watertight bulkhead, is dedicated to the machinery" [S: Dockstavarvet]; 25 % of 14.9 m ≈ 3.7 m. Two Scania DSI14 V8 (625 hp) [later DI13 700 hp on life-extended boats; DI16 900 hp on HSM] on beds either side of the centreline, driving the jets through shafts and clutches. **Two engine-room hatches in the aft deck**, each with an extra lock operable from inside the engine room [S: SHK RM 2008:02 per search snippet]. |
| Aft deck (akterdäck) | 0 – 7.0 | Low, flat, open deck over the engine room. Fittings: the two engine hatches (≈ 1.5 × 0.8 m each, side by side over the engines at x ≈ 1.8–3.3, y = ±0.5…±1.3 [E]); mine/depth-charge rails along both sides (H only); life-raft canisters (4 × 6-man rafts on the H [S: SoldF]); HS: air-conditioning unit; HSM: fixed pillar mounts for MGs — "the aft deck has three weapon mounts" on the NG demonstrator [S: naval-technology on-board feature]. |
| Watertight, insulated bulkhead | x ≈ 4.0 | Between engine room and troop compartment [S: Dockstavarvet]. |
| **Troop compartment (truppkabin/transportutrymme)** | 4.0 – 9.5 | "A cabin with seating for 20 troops, together with their equipment, occupies the mid-body of the craft" [S: Dockstavarvet]. "Passagerarna sitter … i individuella säten längs sidorna. På den relativt stora öppna golvytan i mitten placeras utrustningen" [S: SoldF]. Floor ≈ 0.5 m above baseline, headroom ≈ 1.9 m, ceiling = underside of the mid-deck [E]. Entered from the aft deck through a hatch/door in the step up to the mid-deck ("akterluckan ner mot lastrummet" [S: modellbygge.ifokus]; "a light grey hatch can be entered from the lower aft deck, which takes you into the troop compartment" [S: naval-technology]). HSM: fixed stowage boxes ("fasta lastlådor") replaced pallets/nets; weapons can be strapped in [S: FMV]. HS: ballistic lining, NBC over-pressure, AC, toilet [S: Högman, defencetalk]. |
| Mid-deck (mellandäck) | 7.0 – 8.8 | Raised trunk over the aft end of the troop compartment, ≈ 0.3 m above the aft deck [E]. Carries the **ring mount (ringlavett)** for a Ksp 88 (12.7 mm) or Grsp 92 (40 mm AGL): "en granatspruta i ringlavetten på mellandäcket … avfyras av skytt på däck" [S: sv.Wikipedia]; the mount rotates 360° and has a backrest for one gunner [S: search snippet, SoldF]. Gunner stands on a step inside the compartment through a hatch in the mid-deck [E, medium]. HSM/NG: two pillar mounts on the mid-deck [S: naval-technology]. |
| **Wheelhouse (styrhytt)** | 8.8 – 11.8 | See §4. Splinter-protected module "located between the troop compartment and the bow ramp landing area" [S: Dockstavarvet]. Mast and radar on the roof. |
| Bulkhead with centre passage | x ≈ 11.8 | "Immediately below the cockpit is a bulkhead that is divided by a passageway, extending to a bow ramp landing area" [S: naval-technology]. |
| Bow compartment (förpik) with landing corridor | 11.8 – 14.9 | Centreline corridor ≈ 1.0 m wide from between the two helm seats forward to the ramp: "man 'går' genom en gång som går mitt emellan de båda förarna och vidare under fören ut på en fällbar ramp i bogen" [S: SoldF]. Covered by the two bow deck hatches (stävluckor). Fenders, bow fender plate, anchor/mooring gear either side. |
| Foredeck (fördäck) | 11.8 – 14.9 | Flat, at sheer height, with the two hatches on the centreline; **two fixed forward-firing 12.7 mm MGs** either side of the hatches on the H/HS, fired from the helm ("två 12,7 mm kulsprutor i fören (avfyras från förarplatsen)" [S: sv.Wikipedia]); on the HSM these are replaced by the **Saab Trackfire RWS "integrerad vapenstation på fördäck"** [S: FMV], carrying Ksp 88/Grsp 92 with a Ksp 58 as coaxial weapon. |

Vertical datums for the blocks (z above baseline) [E unless noted]: aft deck 2.30–2.45 m; mid-deck ≈ 2.75 m; foredeck ≈ 2.50 m; troop-compartment floor ≈ 0.5 m; engine-room floor plates ≈ 0.35 m; wheelhouse roof **3.8 m [S]**; mast top **5.0 m [S]**.

---

## 4. Wheelhouse and crew positions

* Position: front windscreen base ≈ 3.1 m abaft the stem (x ≈ 11.8), aft face ≈ 6.1 m abaft the stem (x ≈ 8.8), i.e. the wheelhouse occupies roughly the 20–40 % length band from the bow — Saab: "wheelhouse in the front" [S; x-values E, medium from the Saab profile drawing].
* Size: ≈ 3.0 m long; ≈ 2.9 m wide at the base (≈ 0.45 m side decks each side), ≈ 2.5 m wide at the roof; roof ≈ 1.3 m above the surrounding deck (roof at z = 3.8 m) [E, medium]. Low, wedge-shaped glazed cabin: windscreen raked ≈ 35–40° from vertical in three to five panes, two to three side panes per side, small aft-facing panes; roof flat with a slight camber [E, medium]. HS: 38 mm bullet-resistant glass in all windows and 20 mm polyethylene on the deck [S: Högman].
* Layout: "helmsman to starboard and the CO/navigator to port in a compact, cockpit type, layout with an extra chair in the center line for an instructor/troop commander" [S: Dockstavarvet]; "two operator seats and a middle jump seat within a compact aircraft-style cockpit … can swing in and out of place" [S: naval-technology]. The helmsman has one display (radar/chart); the navigator has a small table with two displays [S: Särtryck]. The corridor to the bow runs between the two seats at the lower (troop-compartment) floor level; the seats sit on raised platforms so that the crews' eyes are at ≈ z 2.7–2.9 m, just above the sill of the windscreen [E, medium].
* **Roof hatches: two, over the starboard and port seats; they can only be opened and locked from inside** [S: SHK report per search snippet]. They are the crew's external access and standing/observation positions. No side doors on the H [E, medium — verify against photos]; the crew otherwise enter from the troop compartment.
* Mast: hinged (folds aft for transport/low bridges), stepped on the roof at about x ≈ 9.8; carries the navigation radar scanner (Furuno on export boats [S: Dockstavarvet Enforcer III]) at the top, nav lights, GPS and radio whips; mast foot 3.8 m, top 5.0 m above baseline [S: SoldF]. HS boats have additional whip antennas on the side rails and bollards ("pållare") and a differently shaped hatch on the port side forward of the cabin [S: IPMS Stockholm].
* Third crew member (maskinist/engineer) has no fixed cockpit seat; the middle jump seat or the forward end of the troop compartment [E].

---

## 5. Station table for lofting

Hull only (no ramp, jets, fenders). Half-breadths are to the outside of plating. Deadrise is the local angle keel–chine. Chine heights at x = 0 and the stem are sourced (0.55 m / 1.6 m, SoldF); deadrise 20° aft is sourced; keel line, deck heights and all half-breadths are estimates (medium confidence aft of x = 12, medium-low forward). Full-load WL at z = 0.80.

| Stn | x (m) | Keel z | Chine y | Chine z | Deck-edge y | Deck-edge z | Local deadrise | Remarks |
|---|---|---|---|---|---|---|---|---|
| 0 | 0.0 | 0.00 | 1.50 | 0.55 | 1.65 | 2.30 | 20° | Transom. Jet intakes at y ≈ ±0.55. |
| 1 | 1.5 | 0.00 | 1.58 | 0.57 | 1.75 | 2.32 | 20° | Engine room; engine hatches above. |
| 2 | 3.0 | 0.00 | 1.64 | 0.59 | 1.83 | 2.35 | 20° | Engine room. |
| 3 | 4.5 | 0.00 | 1.67 | 0.62 | 1.88 | 2.38 | 20° | Just fwd of ER bulkhead (x ≈ 4.0). |
| 4 | 6.0 | 0.00 | 1.68 | 0.66 | 1.90 | 2.42 | 21° | Max beam. Troop compartment. |
| 5 | 7.5 | 0.00 | 1.66 | 0.74 | 1.90 | 2.46 | 24° | Mid-deck / ring mount begins. |
| 6 | 9.0 | 0.00 | 1.60 | 0.85 | 1.88 | 2.50 | 28° | Aft end of wheelhouse. |
| 7 | 10.5 | 0.08 | 1.48 | 0.98 | 1.80 | 2.52 | 31° | Helm seats. |
| 8 | 12.0 | 0.28 | 1.22 | 1.15 | 1.60 | 2.52 | 36° | Windscreen / passage bulkhead. |
| 9 | 13.5 | 0.63 | 0.82 | 1.45 | 1.25 | 2.50 | 45° | Bow hatches over corridor. |
| 10 | 14.5 | 0.92 | 0.35 | 1.60 | 0.80 | 2.48 | ≈ 63° | Forefoot. |
| Stem | 14.9 | 1.02 | 0.10 | 1.65 | 0.55 | 2.48 | — | Ramp face 1.1 m wide; ramp hinge ≈ z 1.2. |

Derived checks: chine beam at transom 3.0 m, max chine beam 3.36 m (88 % of 3.8 m — typical); transom deck width 3.3 m; static waterline crosses the keel at x ≈ 14.1 (full load) / ≈ 13.5 (light), consistent with the 13.0 m "CWL" quoted by Dockstavarvet given some rounding; the chine is immersed at rest from the transom to x ≈ 8.5 at full load (normal for a 20 t boat on a 15 m hull).

Section shape between keel and chine: straight (single deadrise) from the transom to about x = 9; a slight convexity may be added forward of x = 10 [E]. Above the chine the topsides are straight with the flare implied by the table; deck camber ≈ 2 % of the beam, aft deck effectively flat.

---

## 6. Deck fittings and openings the model should articulate

| Item | Where | Motion | Source |
|---|---|---|---|
| Bow ramp (stävport) | Stem, centreline, ≈ 1.0 × 1.3 m | Bottom hinge, folds forward/down ≈ 90–100° | SHK snippet; SoldF ("fällbar ramp i bogen"); root-nation |
| Bow deck hatches (stävluckor), two | Foredeck over the corridor, x ≈ 12.8–14.4 | Hinged along outboard edges, open up/out | SHK snippet; root-nation ("two-part hatch that opens during disembarkation") |
| Wheelhouse roof hatches, two | Over stbd and port seats | Hinged, open from inside only | SHK snippet |
| Troop-compartment access hatch/door | Forward end of aft deck / step to mid-deck | Hinged | modellbygge.ifokus; naval-technology |
| Engine-room hatches, two | Aft deck over the engines | Hinged, lockable from inside | SHK RM 2008:02 snippet |
| Aft-peak hatch | Near transom | Hinged | modellbygge.ifokus |
| Mid-deck gunner's hatch under the ring mount | x ≈ 8 | Hinged/sliding | E |
| Ring mount | Mid-deck | 360° rotation | sv.Wikipedia, SoldF |
| Trackfire RWS (HSM) | Foredeck, centreline | Train/elevate | FMV |
| Mast | Wheelhouse roof | Folds aft; radar scanner rotates | SoldF (heights); E (fold) |
| Waterjet nozzles and reversing buckets, two | Transom | Nozzle steers ±≈ 30°; bucket drops over the jet for reverse | Wikipedia (Kamewa FF); details for the propulsion note |

---

## 7. Colour scheme and markings

* **Swedish Navy / Amphibious Corps boats (H, HS, HSM):** hard-edged **splinter camouflage** over hull sides, wheelhouse and superstructure. Commons photo caption: "A CB90 of the Swedish Amphibious Corps demonstrates its outstanding camouflage pattern" [S]. The Tiger Model 1/35 "Sweden CB‑90" kit (6290) calls for **Olive Green, Medium Gray and Flat Black** for the exterior [S: i-modelist/kitchecker paint list], which matches the usual reading of photos: a dark olive/moss green, a lighter grey or grey-green, and black in large angular fields [E, medium]. Pattern is boat-specific; copy from photographs of the hull number you model.
* Official Swedish naval paint set that modellers cite for these boats (from IPMS Scala 2/1981, scanned to NCS): **MF 048 gulgrå NCS 6502‑Y, MF 049 mörkt gulgrå NCS 7502‑Y, MF 062 grå NCS 7005‑Y20R, MF 072 mörkgrå NCS 8500‑N**, all "fruktansvärt matta" [S: IPMS Stockholm threads t=4418, p=86151]. Modern grey navy ships use **Sea Gray 032M = NCS S 4005‑R80B** and **Dark Sea Gray 033M = NCS S 5005‑R80B**, finish "så matt som möjligt" [S: IPMS Stockholm t=4334]. Which of these codes are used for the green tones on the amphibious boats is not documented online — treat the greens as photo-matched.
* Decks and wheelhouse roof: dark grey/black non-skid ("dark grey deck", hatch "light grey" on the Saab NG demonstrator [S: naval-technology]) [E for Swedish boats, medium].
* Underwater hull: black (copper-free antifouling for aluminium) up to a boot-top just above the static waterline [E, medium].
* Interior: bridge light grey/white; troop-compartment bulkheads white [S: Britmodeller colours thread via search snippet]; HSM troop space "bright colours and LED light" [S: naval-technology].
* Markings: three-digit hull number on both bows (prototypes 801 "Helge" and 802 "Helga"; series boats 8xx–9xx, e.g. 802, 848, 935 photographed) [S: sv.Wikipedia, SHK, Flickr]; digit colour varies with the underlying camouflage field (black on light fields, light on dark) [E, low]. Swedish naval ensign at the stern. No other large markings.
* Export/other liveries for reference: Norwegian S90N and Mexican/Malaysian boats overall grey; Hellenic Coast Guard grey/white with stripes; US RCB grey; Swedish Police 90H white with blue; Ukrainian boats grey [S: Tiger kit decal options, Commons category, Wikipedia].

---

## 8. Variant differences that affect the exterior

| Variant | Exterior differences |
|---|---|
| **90 H** (147 + 18 built) | Baseline: cabin with plain glass panes, twin fixed bow MGs, ring mount on mid-deck, mine rails along the aft deck, four life-raft canisters. |
| **90 HS** (27) | Splinter- and NBC-protected: 38 mm glass, polyethylene deck lining, 6 mm plate on transom; AC unit, auxiliary generator, toilet; bollards, extra whip antennas on the side rails, different port-side hatch forward of the cabin [S: Högman, IPMS Stockholm]. |
| **90 HSM** (18 + follow-on orders) | LOA 16.3 m, draft 0.9 m, 18/24.5 t; Scania DI16 900 hp × 2, Kamewa S32 mixed-flow jets with hydraulic clutches; Trackfire RWS on the foredeck instead of the fixed MGs; mine rails, water tanks and toilet removed; fixed stowage boxes inside; transom interceptors; pillar MG mounts on aft and mid-deck; engine moved to improve CG [S: Saab, FMV, SoldF forum, naval-technology]. |
| 90 L / 90 KompL | Command boats: extra antennas, command equipment in the troop space [S: Högman]. |

---

## 9. Gaps and how to close them

1. **Absolute deck heights / freeboard** are the weakest numbers (±0.3 m). Best fix: scale an orthographic side photo of a boat at rest against the sourced 3.8 m beam (from a bow/stern view) or the 3.8 m roof height, or read the *Profil- och planritning till Stridsbåt 90* held by Sjöhistoriska museet (DigitaltMuseum record 021025847019 — blocked to scripts, open it in a browser).
2. The original draft used SHK search snippets. **Updated 2026-10-20:** RM2008:02 and SHK2026:02 have now been downloaded and read directly; local copies are in `Referens/additional/`. Their documented Swedish-H seating, door, hatch and helm arrangements take precedence over the original speculative descriptions.
3. Exact spray-rail count/position and the forward deadrise distribution are estimates; a photo of a hull on a trailer settles them.
4. Wheelhouse door(s): confirm whether the H has any external door besides the roof hatches.

---

## Sources

* sv.wikipedia — Stridsbåt 90H: https://sv.wikipedia.org/wiki/Stridsb%C3%A5t_90H
* en.wikipedia — CB90-class fast assault craft: https://en.wikipedia.org/wiki/CB90-class_fast_assault_craft
* SoldF — Stridsbåt 90 H (heights, chine heights, fuel, layout text): https://www.soldf.com/fartyg-och-batar/stridsbat-90h-strb90h/
* SoldF forum — Strb 90H (HSM weight changes, mine rails): https://forum.soldf.com/topic/5266-strb-90h/ ; prototypes 24°/27° deadrise: https://forum.soldf.com/topic/12496-stridsb%C3%A5t-90/
* Dockstavarvet — CB 90 H specification (14.90 m, 3.85 m, 18 t, reverse sheer, GA text, height < 4.5 m): https://www.dockstavarvet.se/products/combat-and-patrol-boats/combat-boat-90-h/specification/
* Dockstavarvet — CB90H Enforcer III (LOA 15.90, hull 14.90, CWL 13.00, 0.9 m, 17 t, 2 200 L): https://www.dockstavarvet.se/products/boats-from-stock/cb90h-enforcer-iii/
* Saab — Docksta CB90 / CB90 NG at a glance (HSM: 16.3 m, 14.9 m hull, 3.8 m, 0.9 m, 18/24.5 t, profile drawing): https://www.saab.com/products/docksta-cb90 ; https://www.saab.com/contentassets/e40e2f9b6b3b4c1f8e4b86080dc36111/cb90-ng-at-a-glance.pdf
* Saab newsroom — CB90 HSM: https://www.saab.com/newsroom/stories/2019/october/meet-the-new-combat-boat-from-saab
* naval-technology — CB90: https://www.naval-technology.com/projects/combatboat90/ ; CB90 HSM: https://www.naval-technology.com/projects/combat-boat-90-hsm/ ; on-board feature (deck mounts, hatches): https://www.naval-technology.com/features/cb90-saab-combat-boat-next-generation-sweden-dsei-trackfire/
* FMV — Stridsbåt 90HSM en potent plattform (interceptors, stowage boxes, 15 m/3.8 m/0.9 m/18 t): https://www.fmv.se/aktuellt--press/aldre-handelser/stridsbat-90hsm-en-potent-plattform/ ; Marin vapenstation (RWS on foredeck): https://www.fmv.se/projekt/amfbat-2030/marin-vapenstation/
* Hans Högman — Svenska stridsbåtar (variants, HS protection, HSM data): https://www.hhogman.se/stridsbatar-1-sve.htm ; https://www.hhogman.se/combat-boats-1-swe.htm
* Särtryck stridsbåt (design history, 20° vs 26° deadrise, 18.2/19.2 t, SSPA tests): https://fliphtml5.com/gpui/rwiy/S%C3%A4rtryck_stridsb%C3%A5t_utkast_l%C3%A5guppl%C3%B6st/
* Root-Nation — Stridsbåt 90H (deadrise 20°, SS 144140, two-part bow hatch, wheelhouse/troop compartment text): https://root-nation.com/en/articles-en/weapons-en/en-stridsbat-90-ukraine/
* navypedia — US riverine command boats (13.0 m pp, 3.86 m, 0.80 m): https://www.navypedia.org/ships/usa/us_aws_cb90.htm
* SAFE Boats RCB (52'10", 12'6", 36", 49 000 lb, 5086 alloy) via search: https://safeboats.com/rcb/
* Naval Review (Canada) — CB-90 for Canada (dive plane, 4-person crew): https://www.navalreview.ca/2022/10/cb-90-for-canada/
* MarineLink — Swedish Combat Boat 90: https://www.marinelink.com/news/navy-swedish-combat-boat-a-warrior-a-500735
* SHK accident reports (originally cited as search snippets; RM2008:02 and SHK2026:02 directly read on 2026-10-20): RM 2008:02 https://shk.se/download/18.2d6f089b18faca29dc81a571/1698926603898/10264848_rm2008_02.pdf ; RM 2000:02 https://shk.se/download/18.2d6f089b18faca29dc815df1/1698926520208/rm2000_02.pdf ; RM 2004:01 https://shk.se/download/18.2d6f089b18faca29dc817b52/1698926581112/rm2004_01.pdf ; SHK 2026:02 https://shk.se/download/18.4687375319b230b9ea91400/1770186115871/SHK%202026_02%20Slutrapport%20Stridsb%C3%A5t%2090.pdf
* Sjöhistoriska museet drawing record (profile and plan of Stridsbåt 90; blocked to scripts): https://digitaltmuseum.se/021025847019/ritning
* IPMS Stockholm — Flottans kamofärger (MF codes/NCS): https://ipmsstockholm.se/phpBB3/viewtopic.php?t=4418 ; Stridsbåt 90 thread: http://ipmsstockholm.se/phpBB3/viewtopic.php?p=86151 ; modern grey 032M/033M: https://www.ipmsstockholm.se/phpBB3/viewtopic.php?t=4334 ; CB90 update sets (H vs HS details): https://www.ipmsstockholm.se/phpBB3/viewtopic.php?t=10080
* modellbygge.ifokus — Stridsbåt 90 (hatch names, interior): https://modellbygge.ifokus.se/discussion/480583/stridsbat-90
* Tiger Model 1/35 kits 6290/6293 (paint list, versions): https://i-modelist.com/goods/model/flot/2115/2116/48638.html ; https://kitchecker.com/reviews_2018_2/tiger_model_6293.htm ; ATLASt 1/35 kit dimensions: https://mbs-rcmodels.se/butik/bat-batbyggsatser/stridsbat-90-470mm/
* Wikimedia Commons — Category CB90 & SRC90 and file "Stridsbåt 90, Ostholmen.jpg" (camouflage caption), "CB90-802 Stockholm.jpg": https://commons.wikimedia.org/wiki/Category:CB90_&_SRC90
* Praktiskt Båtägande — Stridsbåt 90 prototypen (Korpen 13.5 m; production boats "tyngre, bredare och lite större"): https://www.praktisktbatagande.se/artiklar/nu-finns-chansen-att-kopa-stridsbat-90-prototypen
