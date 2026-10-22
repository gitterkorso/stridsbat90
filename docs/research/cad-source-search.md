# CB90H source catalogue — 2026-10-20

> Publiceringsnotis: Filnamn under Referens/, shots/, tmp/ och backups/ avser lokalt granskningsmaterial som inte distribueras. Källänkar och rapportens egna slutsatser finns kvar; se [licensinformationen](../../THIRD_PARTY_NOTICES.md).

The working target is the Swedish **CB90H**, with the user's **925 foredeck photo**. The 2020 **HEXM** general arrangement is supporting evidence only. A downloadable model is not automatically a dimensionally verified manufacturer model.

## Acquired sources

Original downloaded URLs are recorded in `Referens/additional/download-sources.json`.

| Local file under `Referens/additional/` | Source and scope | Useful evidence and limits |
|---|---|---|
| `shk-rm2008-02-stridsbat848.pdf` | [Swedish Accident Investigation Authority, RM 2008:02](https://shk.se/download/18.2d6f089b18faca29dc81a571/1698926603898/10264848_rm2008_02.pdf), Swedish H / 848 | Strongest new interior/forepeak reference. PDF pp.13–20: H seating arrangement, original handbook forepeak diagram, photographs of intact hatch/door hardware. Report distinguishes the intact reference boat from the accident vessel. Source permits reuse with attribution except its chart figure 13. |
| `shk-rm2004-01-stridsbat881.pdf` | [SHK RM 2004:01](https://shk.se/download/18.2d6f089b18faca29dc817b52/1698926581112/rm2004_01.pdf), Swedish H / 881 | Historical H cockpit/navigation description. No complete measured CAD or hull lines. |
| `shk-2026-02-stridsbat90.pdf` | [SHK 2026:02](https://shk.se/download/18.4687375319b230b9ea91400/1770186115871/SHK%202026_02%20Slutrapport%20Stridsb%C3%A5t%2090.pdf), Swedish H / 826 in 2025 | PDF pp.20 and 22–24 provide cockpit photos and dated seat/control configuration. The accident photos show damage; do not reproduce deformation. SeaCross display arrangement is a later refit, not proof of 925's original equipment. |
| `user-centered-helm-design-2025.pdf` | [Landström & Lindfors, Luleå University of Technology](https://www.diva-portal.org/smash/get/diva2%3A1999131/FULLTEXT02.pdf), collaboration with Dockstavarvet/Knightec | PDF p.16 shows current driver controls; p.35 says a manufacturer Inventor helm model was supplied to the authors. **That CAD file is not included in the public thesis.** Most later figures show proposed future controls, not the production H helm. |
| `docksta-cb90h-general-arrangements.gif` | [Dockstavarvet H general-arrangement page](https://www.dockstavarvet.se/products/combat-and-patrol-boats/combat-boat-90-h/general-arrangements/) | Official but only 458×335 pixels. It does not improve on the existing product-sheet drawing or 2020 GA. |
| `docksta-cb90h-swedish-navy-01.jpg` | [Dockstavarvet H photo collection](https://www.dockstavarvet.se/products/combat-and-patrol-boats/combat-boat-90-h/photos-and-videos/) | Original download, 1280×705. Swedish Navy exterior proportions. |
| `docksta-cb90h-113.jpg` | Same official collection | Original download, 1597×1029. Clear bow-quarter view, front-window and foredeck details. Number 113; not asserted to be 925 or the same fit-out. |
| `docksta-cb90-krebs-jet.jpg` | Same official collection | Original download, 4000×2250. Civilian conversion in profile. Useful only for visible common shell/cabin relationships; its high rails, paint and fittings differ. |

The existing `Referens/cb-90-h-product-sheet.pdf` was inspected. Both arrangement views are embedded JPEGs of **750×275**, not vector drawings. `docksta-product-sheet-4x.png` is a rendering for easier viewing, not added information. The official site's GIF is smaller. No higher-resolution/vector version of the user's 2020 HEXM drawing was located in the checked public sources. Its uncropped original already exists as `Referens/cb90h-ga-saab-original.jpg` (1920×1280).

`helm-thesis-pages/`, `shk-pages/` and `shk-2008-pages/` contain readable rendered source pages. `shk-cockpit-originals/` contains images extracted without upscaling from SHK 2026 p.20. Extracted text files are search aids; visual pages remain authoritative.

## CAD/model candidates checked

| Candidate | Result | Fidelity/license assessment |
|---|---|---|
| [GrabCAD — Combat Boat 90 H](https://grabcad.com/library/combat-boat-90-h-1) | Public listing was reached; no model file downloaded. | Community reconstruction. Author description calls it a personal interpretation. GrabCAD's page explicitly disclaims manufacturer affiliation. No verified dimensional provenance found. |
| [DIGITAL01 — CB-90 Fast Class Assault Craft](https://sketchfab.com/3d-models/cb-90-fast-class-assault-craft-1a674c118767487a8d0f63063be9d87c) | Search-index listing confirms a free model, CC Attribution, published 2024-06-16; direct page fetch returned 403. No asset downloaded or embedded. | Third-party visual model, 260.4k triangles. No original dimension/CAD provenance shown. If obtained later, preserve author attribution and verify every reused part independently. |
| [Depronized — RC scale combat boat](https://cults3d.com/en/3d-model/game/rc-scale-combat-boat-with-3d-printed-waterjets) | Current listing is paid; no purchase, sign-up or download made. | Author's 1:24 RC/3D-printing reconstruction, about 70cm including platform; functional scaled waterjet modifications. Useful hobby reference, not original engineering geometry. |
| [Marathon OS — Combat Boat 90 H 1](https://marathon-os.com/library/well-my-vision-of-legendary-combat-boat-68ab1a55c82722b4637ab6a5) | Public page advertises free STEP; direct fetch returned 403. No file downloaded. | Listing appears related to the community reconstruction. Metadata is contradictory: file name mentions a blasting hopper and one reported dimension is 20,000,000mm. Reject as a measurement authority. |
| [Saab HSM leaflet](https://www.saab.com/globalassets/products/kockums/saab_dockstacb90hsm.pdf) | Read through web source; local download returned 403. | Later HSM; no useful complete original H CAD identified. The official product page lists the 2020 HEXM GA separately. |

No access restriction was bypassed, no account created and no purchase made. No authenticated manufacturer STEP, IGES, Inventor assembly, dimensioned construction drawing or full hull lines were acquired. CAD candidates cannot close the exact-dimensions gap.

## Evidence applied in this pass

SHK RM 2008:02 PDF p.13 places the familiar **Borg 845 cutaway** immediately above its H arrangement description. It specifies nine inward-facing troop seats on each side and two forward-facing seats at the aft bulkhead. This supports **9+9+2**, not 4×5 or 10+10. The troop seats have no safety belts; the three crew positions have waist belts. Exact cushion dimensions and individual frame spacing remain reconstructed.

The same report, PDF pp.15–16, establishes the forward watertight door's **starboard hinge and aft opening direction**. That is applied to the model. The floor height and leaf dimensions remain inferred from the combined views; no millimetre-accurate door schedule was found.

SHK 2026 PDF p.23 describes a later 826 configuration with nine side seats per side but does not mention the two aft seats. SHK 2008 printed p.44 §1.17.3 records a later FMV order reducing the permitted passenger count from 20 to 18. The 9+9+2 arrangement represents the historical H configuration, consistent with the familiar Borg/845 cutaway; it should not be asserted to be the current 826 fit-out.

### Applied geometry and remaining inference

- **Lids and ramp hardware:** SHK 2008 printed p.15 and Fig.4/5 specify gas springs on the two bow lids and troop hatch, the port lid's espagnolette/overlap, two ramp hinges, two rubber-damped supporting chains with elastic keepers, rope-and-tackle, two over-centre locks, stops and a continuous gasket. These are now represented. The visible spring ends, chain ends and moving tackle follow their respective lid/ramp at every opening angle. Exact hardware sizes, spring mount offsets, rope routing and the implementation's two spring positions on the troop hatch remain photographic reconstruction. The public source does not give those dimensions.
- **Forepeak steps:** Fig.4 explicitly labels horizontal steps; Fig.5 shows the intact stepped passage. Four 0.18m rises are used between the existing −0.30m low aisle and +0.42m ramp sill. **The count, rise and spacing are inferred, not measured or manufacturer-certified.** A shared floor function drives both physical treads and walk height. The risers were placed to retain a usable centre aisle above the reconstructed rising hull bottom.
- **Bow exit:** The old H plan and 925 photograph put the bow lids directly at the ramp edge. The former fixed deck bridge from x14.38 to about14.77 was removed, and the lid/opening extended to that edge. Source-plan estimate is around x14.78±0.05m, not an exact workshop dimension. The final moving ramp nose closes the last strip.
- **Engine working lids:** Independently checked inner U outlines of the old H plan imply about x0.94–2.83m. Model uses x0.95–2.85m, centre1.90m. This moves the inherited 1.80m lids aft and makes them1.90m long. The longer parallel lines continuing to the bulkhead are mine rails; the initially suggested2.85m hatch length was rejected after enlarged source inspection. The existing1.00m width is retained because the overlapping rail lines make a precise transverse reading uncertain.
- **Waterline length:** SHK's written13.00m KVL datum and the old H profile support the corrected bow keel crossing at x13.00. Neighbouring offsets were interpolated to meet the existing ramp sill without changing deck/chine coordinates. This is a reconstructed curve, not recovered hull-line CAD.
- **Loose mooring line:** The starboard-lid rope now has irregular overlapping coils and uneven stacking height, based on the user's925 photograph. Rope stowage is a variable, non-structural detail.
- **Forepeak stowage:** SHK Fig.4 labels two storage fields; Fig.5 confirms a low aft starboard recess holding green rope and a larger higher trapezoid recess. The model now has actual cut openings and recessed backs in those two positions. Their22cm depth and exact polygon sizes are inferred within the available hull volume. The partly hidden port side is not automatically mirrored, and the two small forward fields are not asserted to be identical stowage pockets.
- **Forward-door dogs:** Four dogs are required by the report text. Fig.5/7 place one low at the centre and two on the free port edge, replacing the old symmetrical corner pattern. The upper-centre location of the fourth is explicitly inferred because the photograph's lintel obscures it. Handles are represented on both faces, consistent with the written operation description. The door-frame gasket is continuous. Generic exterior D handles were removed from the two bow hatch tops because the925 photograph shows plain tops and the espagnolette/pull fittings belong underneath.

Actual geometry checks in `tools/interior-test.js` cover seat count/orientation, aisle and ladder clearance, door sweep above the floor, physical tread/navigation agreement, gas-spring attachment, constant chain length/end attachment through21 poses, the unobstructed bow exit, corrected engine-lid placement, real starboard recess depth and door-dog layout. Static-frame tests ensure chains are not rebuilt/uploaded when a mechanism has not moved. Gas springs, chains and tackle cache their articulation value; the chain paths reuse buffers. Visual review captures are in `shots/hardware-2026-10-20-stowage/`; these are development inspection views, not source material.

## Remaining evidence gaps

A verified exact reconstruction still needs dimensioned data for the specific Swedish H fit-out: full hull sections/lines, absolute interior floor/seat/platform elevations, leaf/frame dimensions, stair geometry, hidden machinery/pipework, and close photographs of all unobserved surfaces. The new sources resolve several layout errors but do not establish every dimension.
