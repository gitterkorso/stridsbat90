> Aktuell granskning: [CB90 H 845, 2026-10-13](research/reference-audit-2026-10-13.md). Den har företräde framför motstridiga mått nedan.

> Referensuppdatering 2026-09-06: Denna fil beskriver den äldre modellen. Användarens referensbilder och `docs/research/reference-corrections-2026-09-06.md` gäller före äldre geometrimått och utrustningsplaceringar nedan.

# Stridsbåt 90 H – interactive Three.js model: BUILD SPEC (single source of truth)

Goal: an interactive, articulated 3D model of the Swedish **Stridsbåt 90 H (CB90)** as ONE self-contained HTML page
(Three.js r128 UMD). The user can open every openable hatch/door/ramp, spin the navigation radar, steer the two waterjet
nozzles with the helm and operate the waterjet reversing buckets (backskopor) correctly, per jet or linked.
UI text is **Swedish**. Code comments/ids in English.

Research (read the one(s) relevant to your module): `docs/research/hull-and-arrangement.md`, `hatches-doors-ramp.md`,
`topside-equipment.md`, `waterjet-mechanics.md`, `threejs-approach.md`. Where research and this spec differ, THIS SPEC WINS.

## 1. Frame, units, conventions

* Units metres. **Y up, +X forward (bow), +Z starboard (SB). Port (BB) = −Z.** Origin = transom plane (x=0) × design
  waterline (y=0) × centreline (z=0). Hull from x=0 (transom) to x=14.9 (stem). Waterjets hang aft, x∈[−1.05, 0].
  Keel at transom y=−0.80. All numbers live in `src/constants.js` (`CB90.M`, `CB90.STATIONS`, `CB90.COLORS`) – USE THEM, don't retype.
* Rotation sign rules (right-handed, THREE.Euler XYZ on a Group):
  * about **+Z** by φ: (x,y)→(x cosφ − y sinφ, x sinφ + y cosφ). A lid extending **+X** from its hinge rises for φ>0; a lid extending **−X** rises for φ<0; a mast along +Y folds **aft** for φ>0.
  * about **+X** by φ: (y,z)→(y cosφ − z sinφ, y sinφ + z cosφ). A lid extending **+Z** (inboard from a port hinge) rises for φ<0; a lid extending **−Z** rises for φ>0.
  * about **+Y** by φ: x' = x cosφ + z sinφ, z' = −x sinφ + z cosφ. The aft-pointing jet (−X) swings to **starboard** for φ>0; a door panel extending −Z swings **aft** for φ>0.
* Every articulated part is a `CB90.util.hinge(...)` record (see §3). Moving meshes are children of `record.pivot`, positioned relative to the hinge line. `closed`/`open` are degrees on the given axis; value 0 = closed, 1 = open.

## 2. Files and load order (all plain scripts adding to `window.CB90`; NO import/export, NO fetch, NO external images)

`src/page.html` (fragment: `<title>`, `<style>`, markup, `<script>` tags – no html/head/body) loads, in order:
1. `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
2. `https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js` (defines `THREE.OrbitControls`)
3. `constants.js`, `util.js`, `hull.js`, `superstructure.js`, `waterjet.js`, `equipment.js`, `water.js`, `controls.js`, `ui.js`, `main.js`

`node tools/build.js` inlines the local scripts into `dist/artifact.html` (fragment) / `dist/index.html` (standalone) / `dist/dev.html` (live refs).
Smoke-test a module alone: `tools/smoke.sh src/<module>.js <buildFn> shots/<name>.png "<extra js using r>" <overview|stern|bow|top|jets|wheelhouse>` – prints `READY meshes=.. tris=.. bbox=..` or `ERROR ...`, and writes a screenshot you MUST look at (Read tool).

## 3. Shared helpers (`src/util.js`, already written – read it)

`U = CB90.util`: `deg, clamp, lerp, ease, moveTowards`; materials `mat(hex, opts)`, `glass(), metal(), darkMetal(), deck(), rubber(), jetAlu(), jetSteel(), hydraulic()`;
camo `camoIndex/camoColor/applyCamo(geometry, matrix)/camoMaterial()/camoMesh(geometry, matrix, opts)`;
geometry `box(w,h,d,mat,[x,y,z])`, `cyl(rTop,rBot,h,mat,segs,[x,y,z],axis'x'|'y'|'z')`, `tube(points,r,mat)`, `bar(a,b,r,mat)`+`setBar(mesh,a,b)`, `extrudeShape(pts2D, depth, mat)`, `loft(sections, {capStart,capEnd,flip})`, `stationAt(x)`, `hullHalfWidthAt(x,y)`, `trunkHalfW(x)` (trunk/front-deck half-width clipped to the hull), `deckYAt(x,z)` (walking-surface height – use it to place anything on deck);
hinges `hinge({id,label,kind,parent,pivot:[x,y,z],axis,closed,open,speed})` → `{id,label,kind,pivot(Group),axis,closed,open,speed,value}` and `setArticulation(rec, v01)`; `shadowed(obj)`.

**Module return shape (all build functions):**
```js
{ group: THREE.Group,            // add to scene; already in hull coordinates
  parts: { name: Object3D },     // named sub-objects for debugging / cutaway
  articulations: [ hingeRecord ],// generic hinges the UI lists (may be [])
  update(dt, state, t) {},       // per-frame (dt seconds, t seconds since start); may be a no-op
  setCutaway(on) {} }            // optional: make shell translucent / show interior
```
main.js owns the single `state` object and animates every articulation itself (`U.setArticulation(rec, animatedValue)`), so modules never animate hatches – they only build them.

## 4. ARTICULATION MASTER TABLE (ids are fixed; labels are the Swedish UI text)

| id | label (sv) | kind | module | pivot (x,y,z) | axis | closed→open (deg) | lid/panel geometry relative to the pivot |
|---|---|---|---|---|---|---|---|
| ramp_bow | Stävport / landstigningsramp | ramp | hull | (14.9, 0.35, 0) | z | 0 → **−95** | door/ramp plate 1.00 wide (z±0.5) × 1.27 tall, extends +Y from the hinge, thickness 0.06 (x∈[−0.03,0.03]); ribs/treads on the inner face; two chains (thin bars) from the ramp top corners to the deck edge when open (optional) |
| hatch_bowP | Stävlucka babord | hatch | hull | (13.75, deckY−0.02 ≈ 1.65, −0.55) on a frame tilted with the foredeck slope | x | 0 → **−95** | lid x∈[−0.85,0.85], z∈[0,+0.55] (inboard), thickness 0.05 (y∈[0,0.05]); gas strut (bar) optional |
| hatch_bowS | Stävlucka styrbord | hatch | hull | (13.75, deckY−0.02 ≈ 1.65, +0.55) on the same frame | x | 0 → **+95** | lid x∈[−0.85,0.85], z∈[−0.55,0] |
| door_wtFwd | Vattentät dörr (förpik) | door | hull | (11.4, −0.25, +0.30) | y | 0 → **+90** | door panel z∈[−0.60,0], y∈[0,1.25], x∈[−0.03,0.03]; 4 dogs (small boxes); it is INSIDE the hull (bulkhead at x=11.4, doorway z±0.30, y −0.25…1.0) – visible in cutaway / through the bow corridor |
| hatch_troopAft | Transportrumslucka | hatch | hull | (6.40, 1.95, 0) | z | 0 → **−95** | lid x∈[−1.10,0] (aft of hinge), z±0.45, thickness 0.05; sits at the aft edge of the mid-deck; opening below (dark) into the troop compartment with a short ladder |
| hatch_engineP | Maskinrumslucka babord | hatch | hull | (2.50, 1.15, −1.45) | x | 0 → **−90** | flush lid x±0.90, z∈[0,+1.00], thickness 0.04; engine visible below when open (interior hint) |
| hatch_engineS | Maskinrumslucka styrbord | hatch | hull | (2.50, 1.15, +1.45) | x | 0 → **+90** | lid z∈[−1.00,0] |
| hatch_engineCompanion | Nedgångskapp maskinrum | hatch | hull | (0.30, 1.45, 0) | z | 0 → **+100** | lid x∈[0,+0.65], z±0.33, thickness 0.05 on a hood/coaming box x∈[0.30,0.95], z±0.33, y∈[1.15,1.45] |
| hatch_roofP | Taklucka styrhytt babord | hatch | superstructure | (10.15, 3.00, −0.825) | z | 0 → **−85** | lid x∈[−0.55,0] (aft of hinge), z±0.275, thickness 0.04; dark opening below |
| hatch_roofS | Taklucka styrhytt styrbord | hatch | superstructure | (10.15, 3.00, +0.825) | z | 0 → **−85** | same |
| mast_signal | Fällbar signalmast | mast | equipment | (8.72, 3.00, 0) | z | 0 → **+90** | mast tube r=0.03 from y=0 to y=1.20 (top at 4.20 hull), with a masthead light, a small crossbar with 2 whip antennas, and a tabernacle bracket at the foot |
| turret_ring | Ringlavett (vridning) | turret | equipment | (7.30, 3.00, 0) | y | 0 → **360** | the rotating cradle: gun pintle + 12.7 mm MG pointing outward (−X, i.e. AFT over the aft deck, at value 0 – a forward-pointing gun would lie across the wheelhouse roof and mast) + gunner back-rest opposite (+X side); the ring rail itself and 4 struts are fixed |
| elev_twinMg | Dubbelkulspruta 12,7 mm (elevation) | elev | superstructure | (11.90, 2.15, 0) | z | **−10 → +30** | twin M2HB: two barrels r=0.03 length 1.1 along +X at z=±0.18, receivers 0.45×0.18×0.14, ammo boxes; default UI value 0.25 (= 0°) |

UI: kinds `hatch|door|ramp|mast` → toggle switch; `turret|elev` → slider (0…1 mapped to closed…open). "Öppna alla"/"Stäng alla" affect only hatch/door/ramp/mast.

## 5. HULL module – `CB90.buildHull(THREE)` (`src/hull.js`)

* **Shell** lofted from `CB90.STATIONS` (12 stations). Build **two lofts per side** for a hard chine: bottom panel (keel→chine) and side panel (chine→deck edge); or one loft with a duplicated chine vertex. Subdivide each station edge into ≥3 points (slight convexity allowed) and interpolate between stations with `U.stationAt` at Δx≈0.5 m for smoothness. Full section order (looking from aft): deck-edge SB → chine SB → keel → chine BB → deck-edge BB; outward-facing normals (check with the screenshot; use `flip` if inside-out). **Transom**: flat cap at x=0 from keel to deck edge (raked 3–5° optional). **Stem**: the loft ends at x=14.9 with the narrow stem section; add a flat bow face at x=14.9 from `STEM_KEEL_Y` to `STEM_DECK_Y` (this is where the ramp sits – the face is the ramp itself when closed, so leave a 1.0×1.27 opening or simply overlap).
* Materials: `U.camoMesh(geometry)` for the shell (vertex-coloured splinter camo; automatically antifouling black below y=0.10). Add a thin **boot-top** stripe (black) is already covered by the antifouling cutoff.
* **Decks** (`U.deck()` material, receiveShadow): aft deck y=1.15 x∈[0,5.2]; mid-deck/trunk top y=1.95 x∈[5.2,12.3] z±`U.trunkHalfW(x)` (1.55, clipped 3 cm inside the sheer forward of x≈12 so nothing overhangs the shell) with vertical trunk sides down to below the side deck, running all the way to the end of the slope; the side decks between the trunk side and the shell at y=deckY(x)−`DECK_EDGE_DROP` (0.02: the shell edge is the gunwale); the step (vertical face x=5.2: trunk width from 1.15 up to 1.95, outboard of it only up to the side deck); front deck y=1.95 x∈[11.4,12.3] then a slope down to the foredeck at x=12.6; foredeck **follows the sheer**, y=deckY(x)−0.02 (1.68 at x=12.6 → 1.60 at the stem). Every deck plate has a real opening under its lid (`deckPlate` with holes) so an open hatch shows the dark recess. Toe rail 0.08 high along the sheer aft of x=5.2 and on the foredeck.
* Deck width at any x is `U.hullHalfWidthAt(x, y)`; the decks must meet the shell without gaps (overlap 2–3 cm into the shell is fine).
* **Openings & hatches** from §4 (ramp_bow, hatch_bowP/S, door_wtFwd, hatch_troopAft, hatch_engineP/S, hatch_engineCompanion). Under each lid model a dark recess (box with `U.mat(0x101214)`) so an open hatch shows a hole. Bow corridor: floor rising from y=−0.10 (x=11.4) to 0.42 (stem) between two dark walls that follow the hull section (half-width ≤ 0.56, clipped to the shell near the stem); the foredeck opening under the bow hatches looks straight down into it (visible when the hatches/ramp are open).
* **Interior hints** (group `parts.interior`, visible always but hidden by the shell): troop-compartment floor y=−0.30 x∈[4.0,11.4] z±1.5; benches along both sides (0.42 deep, seat y=0.22) lofted against the shell so they never poke through the topsides; engine room floor y=−0.45 x∈[0.6,4.0] with two engine blocks (0.9×0.9×1.6 m V8, dark) at z=±0.6, x∈[1.2,2.8] and shafts to the jets; two bulkheads shaped like the hull section (x=4.0 up to the aft deck, x=11.4 up to the trunk top – outboard of the trunk they stop at the side-deck level).
* Waterjet **intakes**: two dark recessed rectangles in the bottom at x∈[0.30,1.20], centred z=±0.55, width 0.45, with 5 grid bars; ensure they sit on the bottom surface (compute y from the bottom panel).
* `setCutaway(on)`: shell + decks opacity 0.25 (transparent, depthWrite false) when on; restore when off. Keep a list of the affected materials (clone materials for the shell/decks so other modules are unaffected).
* parts: `shell, transom, decks, interior, intakes`. articulations: the 8 hull hinges in §4 order. Target ≤ 60k triangles.

## 6. SUPERSTRUCTURE module – `CB90.buildSuperstructure(THREE)` (`src/superstructure.js`)

Wheelhouse (styrhytt), camo vertex-coloured walls (`U.camoMesh` with the mesh's matrix or build in hull coords):
* Footprint x∈[8.6,11.4] at base y=1.95, half-width 1.45 at the base tapering to 1.25 at the roof y=3.00 (tumblehome). Aft wall vertical at x=8.6 with two small aft-facing windows and a centre aft **doorway**? NO – there is no door; make the aft wall solid with two windows (0.5×0.35).
* **Dash / front**: sloped panel from (11.4,1.95) to (11.15,2.35) across the full width; **windscreen** glass (`U.glass()`, DoubleSide) from (11.15,2.35) to (10.75,3.00), split into 4 panes by thin mullions (0.03), 3 wipers (thin bars) on the outside; roof x∈[8.6,10.75] flat, thickness 0.06, slight overhang 0.05.
* **Side windows**: sill y=2.40 to y=2.95, three panes each side between x=8.75 and 10.7 with mullions; dark glass.
* Roof hatches `hatch_roofP/S` per §4 with dark openings below.
* MG **well** in the front deck: recess x∈[11.55,12.25], z±0.60, floor y=1.70 (dark box) – (the front deck plate itself is built by hull.js; you add the recess box + the twin MG). Twin MG = articulation `elev_twinMg` per §4 (pivot (11.9,2.15,0), barrels along +X).
* Searchlight at `M.SEARCHLIGHT` (small cylinder+drum, metal) on the roof front; horn; a GPS mushroom antenna.
* **Interior**: 2 pilot seats at x=9.6, z=±0.75, seat y=2.15 (raised platforms), a folding centre jump seat, console/dash under the windscreen with 2 dark screens, a helm wheel (torus r=0.18) on the SB side at (10.5, 2.55, 0.75) tilted 30°, two bucket levers + throttle on a pedestal. Floor y=1.95 with the corridor opening (dark) z±0.5 down to the troop floor.
* `setCutaway(on)`: walls+roof opacity 0.25. parts: `walls, roof, windscreen, interior, twinMg`. articulations: `[hatch_roofP, hatch_roofS, elev_twinMg]`. ≤ 30k triangles.

## 7. WATERJET module – `CB90.buildWaterjets(THREE)` (`src/waterjet.js`) — THE MECHANICS MUST BE RIGHT

Two identical units mirrored at z=±`M.JET_Z` (0.55), jet axis at y=`M.JET_AXIS_Y` (−0.35). Build one unit as a function `buildUnit(side)` (side 'P' z=−0.55 or 'S' z=+0.55).

Hierarchy per unit (all in hull frame, x negative = aft of the transom):
```
unit (Group at (0, JET_AXIS_Y, ±JET_Z))            // fixed to the transom
├─ flange: plate 0.86 (z) × 0.80 (y) × 0.04 (x) centred at y = JET_FLANGE_CY − JET_AXIS_Y = +0.07 (unit frame), x∈[−0.04,0]
├─ housing: cone/cylinder along −X from x=0 (r 0.24) to x=−0.20 (r 0.15)  (U.cyl with axis 'x'), jetAlu
├─ steerBracket: small box over the housing at x≈−0.25, y≈+0.22 (holds the vertical steering shaft, a cylinder r 0.03 from y=−0.22 to +0.30 at x=−0.25)
├─ steerLever: arm from the shaft top (x=−0.25, y=+0.40) pointing +Z (SB) 0.25 long — rotates with steering (child of steerUnit, see below)
├─ steerUnit (Group at (JET_STEER_PIVOT_X=−0.25, 0, 0))   ← rotation.y = helm yaw (deg→rad), ±30°
│  ├─ nozzle: cone along −X from local x=+0.05 (r 0.15) to x=−0.30 (r 0.13) (= hull x −0.20…−0.55), open end (draw a dark disc inside the exit), jetSteel
│  ├─ nozzleCollar / yoke: ring + two side cheeks (boxes) carrying the bucket trunnions at local x = JET_BUCKET_PIVOT_X − JET_STEER_PIVOT_X = −0.22, y=0, z=±0.28
│  ├─ bucket (Group at (−0.22, 0, 0))                     ← rotation.z = +bucketValue × 50° (0 = raised, 1 = fully lowered)
│  │  └─ hood: the split-duct reversing bucket. Model it as a curved hood ABOVE and BEHIND the nozzle exit when raised: use a LatheGeometry / half-torus or a swept profile: outer width 0.75 (z), height 0.50 (y), from local x≈−0.05 to x=−0.58 (hull x −0.52…−1.05), top of the hood at local y≈+0.30 when raised, with two lobes (a vertical centre seam) and two side outlets that face forward-down when the bucket is lowered. Simplest acceptable build: (a) a curved plate = half-cylinder segment (CylinderGeometry with thetaLength≈150°, openEnded, r=0.30, height 0.75 along Z, axis Z, DoubleSide, jetAlu) centred so that when raised it sits above/behind the jet and when rotated +50° it wraps over the exit; (b) two side cheek plates (thin boxes) on z=±0.375 closing the sides; (c) a lever arm on top (box 0.25 long pointing up/forward from the trunnion) where the reversing cylinder rod attaches at local (−0.05, +0.32, 0).
│  ├─ revCylinder: hydraulic cylinder body (U.cyl r 0.045 length 0.28, hydraulic material) anchored on a bracket on top of the steerUnit at local (+0.10, +0.32, 0); its rod (U.bar r 0.02) goes to the bucket lever attach point — recompute with U.setBar every frame (transform the bucket attach point into the steerUnit frame using localToWorld/worldToLocal or your own rotation maths).
│  └─ tieRodBall: small sphere at the end of steerLever (for the tie rod)
└─ intake tunnel is in hull.js (not here)
```
Across the two units: a **tie rod** (U.bar r 0.025, jetSteel) connecting the two steerLever ends at y≈+0.40 (unit frame) — recompute each frame so it follows both levers; and one **steering cylinder** (hydraulic) from a bracket on the transom at (−0.05, 0.05, +1.0) hull to the SB lever end, recomputed each frame.

**Kinematics / behaviour** (state comes in via setters; `update(dt, state)` moves smoothly toward targets):
* `setHelm(deg)`: target yaw for BOTH units, clamped ±30. Positive = starboard turn = nozzle exits swing to **starboard** (+Z) ⇒ `steerUnit.rotation.y = +yaw` (see §1 rule). Rate limit 30°/s.
* `setBucket(side, v01)`: target for that unit's bucket value; `bucket.rotation.z = +v × deg(50)` (lowered = positive about +Z ⇒ the hood's aft part goes DOWN over the jet – verify visually from the 'jets' camera). Rate limit 0.5/s (full travel 2 s).
* `setThrottle(v01)`: 0..1; impeller/rpm & stream length.
* Thrust model per unit: `f(v) = v<0.35 ? 1 : v<0.70 ? (0.70−v)/0.35 : −0.6·(v−0.70)/0.30` (ahead fraction; negative = astern). `getThrust()` → `{P, S}` = throttle × f(v).
* **Jet stream visualisation** (parts `streamAhead`, `streamRev1`, `streamRev2` per unit; material `U.mat(COLORS.JET_STREAM,{opacity:0.55, transparent:true, emissive:0x8fb8d0, roughness:1})`, no shadows):
  * ahead stream: a cone/cylinder (`U.cyl`) attached to the **steerUnit** starting at the nozzle exit (local x=−0.30) pointing −X, length = 0.4 + 5.0·throttle·max(0,f), radius growing 0.12→0.30; hidden when length ≤ 0.4·… (f≤0) — it therefore follows the helm yaw automatically.
  * reverse streams: two cones attached to the **bucket** group, originating at the two side outlets (local (−0.35, −0.15, ±0.30)), pointing along (+X, −Y, ±Z) normalised (i.e. forward-down-outboard in the bucket frame — when the bucket is lowered they will point forward and down under the hull), length = 0.3 + 3.5·throttle·max(0,−f); hidden when f≥0.
  * a small spray "neutral" effect is optional.
* Impeller (optional, for cutaway): a 5-blade impeller inside the housing rotating about X at throttle × 2300 rpm.
* `update(dt, state)`: smooth helm & buckets toward targets, update stream sizes, tie rod / cylinders via `U.setBar`, impeller spin. State fields it may read: `state.throttle`, `state.showJet` (hide streams when false).
* Return: `{ group, parts:{P:{unit,steerUnit,bucket,...},S:{...}, tieRod, steerCylinder}, articulations: [], setHelm, setBucket, setThrottle, getThrust, getAngles() → {helm, bucketP, bucketS (current, smoothed)}, update }`.
* Smoke test with: `tools/smoke.sh src/waterjet.js buildWaterjets shots/jets.png "r.setHelm(30); r.setBucket('P',1); r.setBucket('S',0); r.setThrottle(1); for(let i=0;i<200;i++) r.update(0.05,{throttle:1,showJet:true});" jets` and LOOK: SB unit raised bucket + long aft stream swung to starboard; BB unit lowered hood covering the exit + two forward-down streams.

## 8. EQUIPMENT module – `CB90.buildEquipment(THREE)` (`src/equipment.js`)

* **Radar arch** at x=9.0 on the wheelhouse roof: inverted U (U.tube through (9.0,3.0,−1.0)→(9.0,3.55,−0.8)→(9.0,3.60,0)→(9.0,3.55,0.8)→(9.0,3.0,1.0), r 0.035, metal) with a pedestal (cyl r 0.07 h 0.15) at (9.0,3.60,0) and the **antenna** `parts.radarAntenna` (Group at (9.0, 3.75, 0)): open-array bar 1.20 (z) × 0.12 (y) × 0.10 (x), white/light grey, plus a small rear box. `setRadar(on, rpm)`; `update(dt)`: `radarAntenna.rotation.y += on ? rpm/60·2π·dt : 0`.
* **Signal mast** `mast_signal` per §4 (folds aft). Nav lights: SB green box at (9.2,3.03,+1.22), BB red at (9.2,3.03,−1.22), white stern light on the ensign staff top, masthead white light at the mast top.
* **Ring mount**: ring torus r=0.525 tube 0.03 at (7.3, 3.00, 0) (clear of the troop hatch and its open lid) on 4 struts (cyl r 0.025 from y=1.95 to 3.0 at ±45° positions); rotating cradle = articulation `turret_ring` (see §4): MG (12.7 mm, barrel r 0.03 l 1.1 pointing −X (aft) from the pintle at radius 0.525 on the −X side at value 0, receiver box) and a back-rest (curved plate, box 0.5×0.3×0.05) on the +X side.
* **Railings**: stanchions (cyl r 0.015 h 0.45) every 1.2 m along the sheer aft of x=5.2 on both sides with a top rail (U.tube) at y=deckY(x)+0.45; grab rails on the trunk sides; a handrail around the wheelhouse roof edge (front and sides) r 0.012 at y=3.08.
* **Fenders**: rubbing strake `U.tube` along the sheer (points from `CB90.STATIONS` at (x, deckY−0.05, ±deckZ+0.06), r=`M.FENDER_R`, rubber) both sides, plus a bow fender wrapping the stem (tube from (14.7,1.4,−0.7)→(14.9,1.3,0)→(14.7,1.4,0.7)) and a stern fender bar across the transom at y=1.0.
* **Bollards** at `M.BOLLARDS` (double-post bollards, small); cleats; 4 lifting eyes.
* **Transom**: two exhaust pipes (cyl r 0.09, dark metal, pointing −X, 0.15 long) at z=±1.2, y=0.30; two trim planes (thin plates 0.35×0.40) at z=±1.35, y=−0.35 hinged at the transom (static, angled 5° down); ensign staff at (0.08,1.15,0) h 1.3 (right at the transom, clear of the open companionway lid) with a small Swedish flag (blue box with a yellow cross made of 2 thin boxes) at the top; mine rails: two rails (box 5.0×0.05×0.05) down the middle of the aft deck at z=±0.40, y=1.20 (between the engine-hatch lids); two life-raft canisters (cyl r 0.28 l 0.8 along X, white) at `M.LIFERAFT` on the aft deck edge y=1.15+0.3.
* **Hull number** "848" on both bows: build digits from thin white boxes (7-segment style, segment 0.06 thick), digit height 0.45, at x≈12.4–13.6 on the hull side at y≈0.9, offset 0.02 outboard of `U.hullHalfWidthAt(x, y)` and tilted to follow the flare (use the local panel angle from `U.stationAt`). Mirrored to both sides (digits read left-to-right from outside on both sides: on the port side flip the group about Y).
* Whip antennas (2× cyl r 0.008 h 1.6) on the roof aft corners; a horn; a GPS dome. Return `{group, parts:{radarAntenna, mast, ringMount,...}, articulations:[mast_signal, turret_ring], setRadar, update}`.

## 9. WATER + CONTROLS (`src/water.js`, `src/controls.js`)

* `CB90.buildWater(THREE)` → `{ mesh, update(t) }`: PlaneGeometry 160×160 with 96×96 segments at y=0, rotated flat, `U.mat(COLORS.WATER,{roughness:0.25, metalness:0.15, opacity:0.9, transparent:true})`, receiveShadow; `update(t)` displaces vertices with 3 summed sine waves (amp ≤ 0.04 m) and recomputes normals (cheap enough at 96²). Also returns `sky` (`THREE.Color(COLORS.SKY)`) and a helper `applyScene(scene)` that sets background + `scene.fog = new THREE.Fog(COLORS.SKY, 60, 160)`.
* `CB90.createControls(THREE, camera, domElement)` → `{ update(dt), setView(name, animateSeconds), views, autoRotate(bool), controls }`. Use `THREE.OrbitControls` if defined (enableDamping, dampingFactor 0.08, maxPolarAngle 0.49π+0.08 so you can look slightly from below the waterline, minDistance 2, maxDistance 60), else a minimal custom orbit (drag = orbit, wheel = dolly, shift/right-drag = pan). Views (camera position → target):
  `overview` (22,7,13)→(7.5,0.8,0); `bow` (24,3.5,6)→(14,1.0,0); `stern` (−8,2.5,5)→(0,0.5,0); `top` (7.5,26,0.01)→(7.5,0,0); `wheelhouse` (14.5,4.5,5.5)→(10,2.4,0); `jets` (−4.5,0.8,3)→(−0.5,−0.3,0). `setView` tweens position+target over animateSeconds (0 = instant) using `U.ease`.

## 10. APP: `src/page.html`, `src/ui.js`, `src/main.js`

**page.html** (fragment!): `<title>Stridsbåt 90 H</title>`, `<style>` (all CSS inline, no external fonts; dark UI panel, system-ui font, works on mobile: panel becomes a bottom sheet/collapsible under 720px), markup: `<div id="app"><div id="viewport"></div><aside id="panel">…</aside><button id="panelToggle">☰</button><div id="status" hidden></div><div id="hud"></div></div>`, then the script tags in §2 order. Theme: dark-first is fine, but paint background colours explicitly (`#viewport{background:#9db7cc}`; panel `#161a1d` with `#e8ecef` text).

**state** (owned by main.js):
```js
state = { hatches: { [id]: {value:0, target:0} },   // one entry per articulation from all modules, keyed by id
          radarOn: true, radarRpm: 24,
          helm: 0, throttle: 0.5, bucketP: 0, bucketS: 0, linkBuckets: true,
          view: 'overview', autoRotate: false, cutaway: false, showJet: true, showWater: true, shadows: true }
```
**actions** (main.js → passed to ui): `setHatch(id, open01)`, `setAllHatches(open01)`, `setRadar(on)`, `setRadarRpm(rpm)`, `setHelm(deg)`, `setThrottle(v01)`, `setBucket('P'|'S', v01)` (when `linkBuckets` also sets the other), `setLink(bool)`, `preset(name)` with names `ahead|neutral|astern|spinP|spinS|stop`:
  ahead: throttle 1, bucketP=bucketS=0, helm 0 · neutral: throttle 0.6, buckets 0.70 · astern: throttle 0.8, buckets 1.0, helm 0 · spinP (turn on the spot to port): throttle 0.7, bucketP 1.0, bucketS 0, helm −20 · spinS: bucketS 1.0, bucketP 0, helm +20 · stop: throttle 0, buckets 0.70.
  `setView(name)`, `setAutoRotate(bool)`, `setCutaway(bool)`, `setShowJet(bool)`, `setShowWater(bool)`, `setShadows(bool)`.

**ui.js** `CB90.createUI(panelEl, state, actions, articulations)` builds the panel DOM (Swedish) and returns `{ refresh() }` to resync inputs from state. Sections (collapsible `<details open>`):
1. Header "Stridsbåt 90 H" + subtitle "Interaktiv 3D-modell · dra för att rotera, scrolla för att zooma".
2. **Luckor och portar** – a switch row per articulation of kind hatch/door/ramp/mast (label = record.label), buttons "Öppna alla" / "Stäng alla".
3. **Vapen** – sliders for kind turret (`Ringlavett` 0–360°) and elev (`Dubbelkulspruta` −10…+30°).
4. **Radar** – switch "Radar på", slider "Varvtal" 0–48 rpm with value.
5. **Framdrivning (vattenjet)** – slider "Roder" −30…30 (value shown as "BB 15°"/"0°"/"SB 15°"), slider "Gas" 0–100 %, slider "Backskopa BB" 0–100 %, slider "Backskopa SB" 0–100 %, switch "Koppla skoporna", preset buttons: "Full fart framåt", "Neutral (nollskjut)", "Full back", "Sväng på stället BB", "Sväng på stället SB", "Stopp". Readout line: "Skjut BB +100 % · SB +100 %" (from `getThrust`, negative = back), and a hint "Nollskjut vid ca 70 % nedfälld skopa".
6. **Kamera** – buttons Översikt · För · Akter · Ovanifrån · Styrhytt · Vattenjet; switch "Autorotera".
7. **Visa** – switches "Genomskinligt skrov", "Vattenstråle", "Vatten", "Skuggor".
8. Footer: keyboard help "Tangenter: ←/→ roder · ↑/↓ gas · Z/X skopa BB · C/V skopa SB · H alla luckor · R radar · 1–6 kamera · T genomskinlig".
Also `#hud` (top-left over the viewport): one line "Roder 0° · Gas 50 % · Skopa BB 0 % / SB 0 % · Skjut BB +50 % / SB +50 %" updated each frame by main (via `ui.updateHud(text)`).

**main.js**: renderer (antialias, `setPixelRatio(min(devicePixelRatio,2))`, `outputEncoding = THREE.sRGBEncoding`, `toneMapping = THREE.ACESFilmicToneMapping`, exposure 1.05, `shadowMap.enabled`, PCFSoft), scene via `water.applyScene`, lights: HemisphereLight(0xdfe9f3, 0x3a4a3a, 0.75) + DirectionalLight(0xfff4e0, 1.3) at (12,20,10) with shadow camera ±14 m, mapSize 2048, bias −0.0005 + a fill light from (−10,6,−8) 0.3. Build all modules, `scene.add` groups, collect `articulations` from hull, superstructure, equipment (in that order) into `state.hatches`. Animation loop with clock: animate each hatch `value` toward `target` at 1/record.speed per second, apply `U.setArticulation(rec, U.ease(value))`; call `waterjets.setHelm/setBucket/setThrottle` from state then `waterjets.update(dt, state)`; `equipment.setRadar(state.radarOn, state.radarRpm)`; each module's `update`; `controls.update(dt)`; water update; HUD text. Keyboard shortcuts as in §10.8. Window resize. Expose `window.CB90.app = { state, actions, scene, camera, renderer, modules }`.
**URL params** (read once at start, applied before the first frame; no animation for these): `view`, `hatches=open|closed`, `open=id1,id2` (open just these), `helm`(deg), `throttle`(0–100), `bucketP`, `bucketS`(0–100), `radar=0|1`, `rpm`, `cutaway=0|1`, `jet=0|1`, `water=0|1`, `ui=0|1` (hide the panel + HUD), `ring`(deg), `elev`(deg), `autorotate=0|1`, `cam=x,y,z`+`tgt=x,y,z` (free camera for close-up verification renders), `settle=1` (jump helm/buckets/hatches instantly to targets – used for screenshots; default when any of helm/bucket/hatches params are present).
**Status/diagnostics**: `window.onerror` + `unhandledrejection` append `ERROR: <msg>` to `#status` (keep it `hidden` but text readable via DOM) ; after the first rendered frame set `#status` text to `READY meshes=<n> tris=<n> articulations=<list of ids>`; if any module throws during build, still show the rest and record the error.

## 11. Visual quality targets
Camo shell, dark non-skid decks, light-grey hatch lids, dark glass, aluminium jets with black hydraulic cylinders, water with soft waves and shadows, sky-blue background with fog. ≤ 250k triangles total, ≥ 30 fps on a laptop. Nothing should z-fight (offset coplanar surfaces by ≥ 5 mm).

## 12. Verification checklist (screenshots via `tools/shot.sh dist/index.html?...`)
1. `?view=overview` – whole boat, camo, wheelhouse forward of the mid-deck ring mount, radar arch, low aft deck, jets aft.
2. `?view=stern&helm=30&bucketS=0&bucketP=100&throttle=100` – both nozzles yawed to starboard; SB bucket raised with a long stream aft-starboard; BB bucket lowered over the exit with two streams forward-down.
3. `?view=stern&bucketP=70&bucketS=70` – both buckets ~35° down (neutral), short/no streams.
4. `?view=bow&hatches=open` – ramp folded forward/down ≈ horizontal, bow hatches up/outboard, twin MG in the well.
5. `?view=top&hatches=open` – every lid visibly open: engine hatches outboard, troop hatch forward-up, roof hatches forward-up, companion lid aft-up.
6. `?view=wheelhouse&cutaway=1` – interior seats/console visible, WT door and corridor visible.
7. `?view=overview&radar=1` – radar bar rotating (compare two shots at different `settle` times not needed; just ensure it renders).
Mechanical assertions: bucket pivot on the steering unit (rotates with helm); bucket axis transverse; nozzle yaw vertical; ramp hinge at the deck-level... NO: at (14.9, 0.35, 0) i.e. just above the waterline at the stem foot, folding forward/down; hatch hinge edges as in §4.
