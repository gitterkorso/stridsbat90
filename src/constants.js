// Stridsbåt 90 H (CB90) – shared dimensions and colours. Plain script (no modules).
// UNITS: metres. FRAME: Y up, +X = forward (towards the bow), +Z = starboard.
// ORIGIN: transom plane (x = 0) × design waterline (y = 0) × centreline (z = 0).
// The hull runs from the transom (x = 0) to the stem (x = 14.9); the waterjets hang aft of the transom (x < 0).
// Keel at the transom is at y = -0.80 (draught 0.8 m).
window.CB90 = window.CB90 || {};

CB90.M = {
  LOA: 15.9, LH: 14.9, LWL: 13.0, BEAM: 3.8, DRAFT: 0.8, // LWL: nominal written H dimension in SHK RM 2008:02
  KEEL_Y: -0.80,           // baseline (keel at transom)
  BOOTTOP_Y: 0.10,         // black antifouling below this height

  // ---- decks: CB90 H product-sheet profile, reconstructed to about ±0.08 m ----
  // 845 governs fittings; the general-arrangement drawing supplies the common hull datums.
  TROOP_HATCH_X0: 4.25, TROOP_HATCH_X1: 5.35,
  AFTDECK_Y: 1.07, AFTDECK_X0: 0.0, AFTDECK_X1: 4.15,      // low aft deck over the engine room
  TRUNK_X0: 4.15, TRUNK_X1: 10.78, TRUNK_Y: 1.65, TRUNK_HALFW: 1.55, // raised mid-deck (mellandäck) over the troop compartment; continues fwd under the wheelhouse. Half-width is clipped to the hull forward of x≈12 – use U.trunkHalfW(x)
  FRONTDECK_X0: 11.05, FRONTDECK_X1: 11.05, FRONTDECK_Y: 1.45,  // cabin foot; no raised gun-well platform ahead of the bridge
  FRONTDECK_SLOPE_X1: 11.75,                                   // cabin shoulder slopes down to the low foredeck (sheer about 1.32 there)
  FOREDECK_Y: 1.30, FOREDECK_X0: 11.75, FOREDECK_X1: 14.87,      // foredeck follows the falling sheer down to the landing ramp
  DECK_EDGE_DROP: 0.02,                                          // side decks and foredeck lie this far below the sheer line (deckY); the shell edge is the gunwale. Use U.deckYAt(x, z)
  TROOP_FLOOR_Y: -0.30, TROOP_X0: 4.0, TROOP_X1: 10.78,           // troop compartment (interior hint)
  ENGINE_FLOOR_Y: -0.45, ENGINE_X0: 0.6, ENGINE_X1: 4.0,         // engine room (interior hint)

  // ---- stem / bow ramp (Dockstavarvet CB90 H profile, measured at 87 px/m): a low, strongly raked landing bow ----
  // The deck corner of the stem is the forward-most point of the hull. Below a short vertical rubber nose the flat stem
  // face (= the stävport) rakes aft-down at ~54° from vertical to its bottom hinge on the sill; below the sill the stem
  // plate continues at ~60° to the waterline at x=13.00 and curves into the forefoot. The face is blunt: its half-width
  // is STATIONS.keelZ, so every section forward of x≈13 has a flat bottom strip instead of a sharp keel.
  STEM_X: 14.87, STEM_DECK_Y: 1.10, STEM_NOSE_Y: 0.97, STEM_HALFW_DECK: 0.52,
  RAMP_HINGE_X: 14.05, RAMP_HINGE_Y: 0.40,                              // sill / bottom hinge line of the stävport
  RAMP_FACE: { x0: 14.11, y0: 0.41, x1: 14.85, y1: 0.95 },              // outer face of the closed ramp (the drawn profile line)
  RAMP_T: 0.07, RAMP_OPEN_DEG: -60,                                     // lowered ramp lies ~25° below horizontal, tip at the waterline

  // ---- wheelhouse (styrhytt) ----
  WH_X0: 8.6, WH_X1: 11.05, WH_AFT_BASE_X: 8.10,           // aft face / lower front foot in the 845 reference
  WH_DOOR_X: 10.78, WH_CROUCH_X: 10.03, WH_CROUCH_END_X: 10.23,
  WH_BASE_Y: 1.45, WH_ROOF_Y: 2.50, WH_FLOOR_Y: 0.40,
  WH_HALFW_BASE: 1.45, WH_HALFW_ROOF: 1.25,
  HELM_PLATFORM_RISE: 0.20, // raised driver/navigator platforms above the previous cabin datum
  HELM_SEAT_LIFT: 0.28, // reconstructed upper-seat rise; cushion top 1.40 above WL, guided by GA section
  HELM_FOOTREST_LIFT: 0.18, // keeps the reconstructed footrest 0.44 below the cushion
  HELM_EYE_ABOVE_CUSHION: 0.84, // selected tall seated viewpoint, not an original boat dimension
  WH_WIDTH_SCALE: 0.90, // common transverse transform for cabin shell, furniture and controls
  CABIN_PLINTH_HALFW: 1.34, // narrower cabin pedestal leaves continuous side passages
  BOW_RUBBER_X0: 13.62, // local bow-corner protection in the supplied 925 photograph
  WH_DASH_TOP_X: 10.45, WH_DASH_TOP_Y: 1.85,   // sloped dash panel from (WH_X1, WH_BASE_Y) up to here
  WH_WS_TOP_X: 10.85,                          // upper edge 0.40 m FORWARD of the sill: characteristic reverse-raked bridge windows
  WH_ROOF_X0: 8.6, WH_ROOF_X1: 10.85,
  WH_WINDOW_SILL_Y: 1.90,                      // side windows from sill to roof-0.05

  // ---- waterjets (Kamewa FF-410 class), mirrored at z = ±JET_Z ----
  JET_Z: 0.55, JET_AXIS_Y: -0.35,
  JET_FLANGE_W: 0.86, JET_FLANGE_H: 0.80, JET_FLANGE_CY: -0.28, JET_FLANGE_T: 0.04,
  JET_HOUSING_X1: -0.20, JET_HOUSING_R0: 0.24, JET_HOUSING_R1: 0.15,   // fixed stator/outlet housing from x=0 to x=-0.20 (cone)
  JET_STEER_PIVOT_X: -0.25,                                            // vertical steering axis (through the jet axis)
  JET_NOZZLE_X0: -0.20, JET_NOZZLE_X1: -0.55, JET_NOZZLE_R0: 0.15, JET_NOZZLE_R1: 0.13, // steering nozzle (child of steering unit)
  JET_STEER_MAX_DEG: 30, JET_STEER_RATE_DEG_S: 30,
  JET_BUCKET_PIVOT_X: -0.47, JET_BUCKET_W: 0.75, JET_BUCKET_H: 0.50, JET_BUCKET_X1: -1.05, // trunnions on the steering unit at jet-axis height; hood extends aft to x=-1.05 when raised
  JET_BUCKET_MAX_DEG: 50, JET_BUCKET_NEUTRAL: 0.70, JET_BUCKET_RATE_PER_S: 0.5, // value 0..1; 0.70 = zero thrust; full travel in 2 s
  JET_ASTERN_FRACTION: 0.6,                                            // astern thrust = 60 % of ahead
  JET_TIEROD_Y: 0.05,                                                  // tie rod between the two steering levers
  JET_INTAKE_X0: 0.30, JET_INTAKE_X1: 1.20, JET_INTAKE_W: 0.45,        // intake grid in the hull bottom
  JET_IMPELLER_D: 0.41, JET_MAX_RPM: 2300,

  // ---- topside ----
  RADAR_X: 10.45, RADAR_Z: 0.73, RADAR_BASE_Y: 2.56,
  RADAR_AXIS_Y: 2.81, RADAR_ANT_L: 0.88, RADAR_ANT_H: 0.12, RADAR_ANT_D: 0.18, RADAR_RPM: 24,
  MAST_X: 8.95, MAST_Z: -0.67, MAST_FOOT_Y: 2.50, MAST_TOP_Y: 4.45, MAST_R: 0.027,
  SEARCHLIGHT: { x: 10.80, y: 2.55, z: 0.55, r: 0.10 },
  NAVLIGHT_X: 9.2, NAVLIGHT_Z: 1.22, NAVLIGHT_Y: 2.53,
  RING_MOUNT: { x: 7.3, y: 1.65, ringY: 2.70, r: 0.525, struts: 4 },   // 1.05 m above the troop deck; clear of the hatch and wheelhouse
  TWIN_MG: { x: 12.25, y: 1.62, z: 0.85, spacing: 0.115, barrelL: 1.1, elevMin: -10, elevMax: 30 },   // trunnions about 0.34 above the low foredeck
  EXHAUST: { z: 1.20, y: 0.30, r: 0.09 },     // at the transom
  TRIMPLANE: { z: 1.35, y: -0.35, w: 0.35, l: 0.40 },
  ENSIGN_STAFF: { x: 0.25, y: 1.07, z: -1.34, h: 1.60 }, // port aft corner; clear central companionway
  FENDER_R: 0.06,                              // rubbing strake along the sheer
  LIFERAFT: [], // 845 carries rectangular survival/stowage cases, not white cylindrical canisters
  BOLLARDS: [[1.0, -1.64], [1.0, 1.64], [7.8, -1.72], [7.8, 1.72], [13.85, -0.68], [13.85, 0.68]], // aft pair outboard of the mine rails; bow bitts follow the supplied 925 photograph
  HULL_NUMBER: '845',
};

// SHK RM 2008:02, Fig.4 (the original boat handbook) and Fig.5 show a low
// forepeak landing followed by horizontal stair treads. Four rises and their
// spacing are a reconstruction of those views, not dimensioned workshop data.
CB90.BOW_STEPS = [0.28, 0.47, 0.64, 0.80];
CB90.bowPassageFloorAt = function(x) {
  const M=CB90.M, along=(x-M.WH_DOOR_X)/(M.RAMP_HINGE_X-M.WH_DOOR_X);
  const rises=CB90.BOW_STEPS.filter(f=>along>=f).length;
  return M.TROOP_FLOOR_Y+(M.RAMP_HINGE_Y+.02-M.TROOP_FLOOR_Y)*rises/CB90.BOW_STEPS.length;
};

// Hull loft stations (from transom x=0 to the stem deck corner x=14.87). y is height above the waterline; z is half-breadth.
// Section shape at a station (starboard half, from keel to deck edge): keel -> chine -> deck edge (straight panels = hard chine).
// keelZ is the half-width of the section bottom: 0 = sharp keel; > 0 = the blunt raked stem face (bow, x >= 13).
// Forward of x = 12 the values are reconstructed from the Dockstavarvet profile and plan (deckZ = drawn outline minus
// rubber shoulder pads); from x = 13.00 on, keelY IS the stem line: 0.00 at the nominal waterline, 0.40 at the ramp sill
// (x 14.05), 0.62 at x 14.4 and 0.97 at the foot of the vertical nose under the deck corner (14.87, 1.10). The sheer
// falls toward the bow as drawn. October audit removes the inherited tall midbody sheer.
CB90.STATIONS = [
  { x: 0.0,   keelY: -0.80, keelZ: 0,    chineZ: 1.50, chineY: -0.25, deckZ: 1.65, deckY: 1.10 },
  { x: 1.5,   keelY: -0.80, keelZ: 0,    chineZ: 1.58, chineY: -0.23, deckZ: 1.75, deckY: 1.10 },
  { x: 3.0,   keelY: -0.80, keelZ: 0,    chineZ: 1.64, chineY: -0.21, deckZ: 1.83, deckY: 1.16 },
  { x: 4.5,   keelY: -0.80, keelZ: 0,    chineZ: 1.67, chineY: -0.18, deckZ: 1.88, deckY: 1.34 },
  { x: 6.0,   keelY: -0.80, keelZ: 0,    chineZ: 1.68, chineY: -0.14, deckZ: 1.90, deckY: 1.34 },
  { x: 7.5,   keelY: -0.80, keelZ: 0,    chineZ: 1.66, chineY: -0.06, deckZ: 1.90, deckY: 1.34 },
  { x: 9.0,   keelY: -0.80, keelZ: 0,    chineZ: 1.60, chineY:  0.05, deckZ: 1.88, deckY: 1.34 },
  { x: 10.5,  keelY: -0.79, keelZ: 0,    chineZ: 1.48, chineY:  0.12, deckZ: 1.80, deckY: 1.33 },
  { x: 11.5,  keelY: -0.69, keelZ: 0,    chineZ: 1.36, chineY:  0.16, deckZ: 1.67, deckY: 1.32 },
  // The 13.00m waterline is written source data; intermediate offsets remain
  // an interpolated reconstruction tied to the old-H profile, not a lines table.
  { x: 12.0,  keelY: -0.56, keelZ: 0,    chineZ: 1.22, chineY:  0.20, deckZ: 1.55, deckY: 1.31 },
  { x: 12.5,  keelY: -0.32, keelZ: 0,    chineZ: 1.04, chineY:  0.25, deckZ: 1.40, deckY: 1.29 },
  { x: 13.0,  keelY:  0.00, keelZ: 0.01, chineZ: 0.88, chineY:  0.29, deckZ: 1.21, deckY: 1.27 },
  { x: 13.25, keelY:  0.12, keelZ: 0.12, chineZ: 0.80, chineY:  0.32, deckZ: 1.11, deckY: 1.24 },
  { x: 13.5,  keelY:  0.22, keelZ: 0.17, chineZ: 0.72, chineY:  0.36, deckZ: 1.01, deckY: 1.21 },
  { x: 13.75, keelY:  0.32, keelZ: 0.22, chineZ: 0.60, chineY:  0.42, deckZ: 0.92, deckY: 1.185 },
  { x: 13.94, keelY:  0.38, keelZ: 0.25, chineZ: 0.52, chineY:  0.46, deckZ: 0.85, deckY: 1.175 },
  { x: 14.05, keelY:  0.40, keelZ: 0.26, chineZ: 0.48, chineY:  0.49, deckZ: 0.80, deckY: 1.17 },
  { x: 14.4,  keelY:  0.62, keelZ: 0.34, chineZ: 0.44, chineY:  0.70, deckZ: 0.68, deckY: 1.145 },
  { x: 14.84, keelY:  0.94, keelZ: 0.45, chineZ: 0.49, chineY:  0.99, deckZ: 0.53, deckY: 1.105 },
  { x: 14.87, keelY:  0.97, keelZ: 0.46, chineZ: 0.49, chineY:  1.01, deckZ: 0.52, deckY: 1.10 },
];

CB90.COLORS = {
  CAMO: [0x4b5a40, 0x7c8577, 0x2a2e2b],  // olive green, grey-green, near-black (splinter camouflage)
  HULL_BASE: 0x5d6656,
  ANTIFOULING: 0x141414,
  DECK: 0x3b3e3c,
  DECK_LIGHT: 0x6c706d,       // hatch lids (light grey)
  GLASS: 0x1d2b36,
  METAL: 0x6f7477,
  DARK_METAL: 0x2e3133,
  RUBBER: 0x121212,
  JET_ALU: 0x8d9296,
  JET_STEEL: 0xb8bcc0,
  HYDRAULIC: 0x3d4448,
  WATER: 0x28506a,
  SKY: 0xbfd3e6,
  JET_STREAM: 0xcfe6f5,
  WHITE: 0xe6e6e6,
  RED: 0xc0392b,
  GREEN: 0x27ae60,
  INTERIOR: 0xc8ccc9,
};
