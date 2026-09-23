/**
 * Real GLTF Beetle models — see .specs/3d-model.spec.md "Real GLTF Models" section and
 * CREDITS.md for licensing. These are actual sourced 3D models (not the procedural
 * FuscaModel.tsx placeholder), swapped in wholesale for specific presets/eras where a good
 * real-world match exists. See pickRealModel() for the selection rule.
 */

export type CarModelKey = 'model-1948' | 'model-1968' | 'model-1980' | 'model-1973'

export type OpenablePartKind = 'doors' | 'frontTrunk' | 'engineLid'

export interface OpenablePartConfig {
  part: OpenablePartKind
  /** Node name(s) within the model to detach and hinge — one per door for 'doors' (mirrored
   * automatically by which side of X=0 each one sits on), typically one for the lid parts. */
  nodeNames: string[]
  /** 'y' for doors (vertical hinge axis, swing outward), 'x' for lids (horizontal axis, swing up). */
  hingeAxis: 'x' | 'y'
  /** Rotation in radians when open. For doors this is mirrored per side automatically — write
   * it as if for the +X-side door. */
  openAngle: number
  /** Which edge of the node's own bounding box to hinge at, per axis — explicit rather than
   * inferred from a Z-sign convention, since not every model's calibrated "forward" was
   * double-checked against a world axis. Tuned per model by screenshot. */
  pivotZ: 'min' | 'max'
  pivotY: 'min' | 'max' | 'center'
  /** Rotation sign per node (parallel to nodeNames), e.g. [1, -1] for a left/right door pair.
   * Defaults to an auto-computed sign (based on which side of the car's centerline the node
   * sits on AND which side of the hinge its own mass sits on — see riggPart() in
   * RealCarModel.tsx) when omitted; only needed as an override for geometry the auto formula
   * gets wrong. */
  openSigns?: number[]
  /** nodeNames[0] names ONE node that actually contains BOTH left and right door geometry
   * merged into a single mesh (confirmed on model-1980's "porte_1" — isolating and rendering
   * just that node showed two separate door-shaped panels, not one) — a single hinge on a node
   * like that straddles the car's centerline no matter the rotation sign, since its own
   * bounding-box center sits at x≈0. When true, riggPart() splits that node's triangles by
   * world-space X sign into two independent nodes before hinging each normally. */
  splitLeftRight?: boolean
  /** Doors only. These GLTFs are organised BY MATERIAL, not by part — so a door's handle, mirror and
   * weatherstrip/friso live in SEPARATE per-side meshes that don't move when only the painted panel
   * hinges (the user's "os frisos e maçanetas permanecem no mesmo lugar" bug). Each entry is a
   * substring of such a node's name; riggPart() attaches every matching mesh to the NEAREST door
   * hinge (by X), so the whole door composition swings together. Only list PER-SIDE door-only parts
   * here — a mesh shared across both doors or fused with a neighbour (e.g. door glass baked together
   * with the quarter window, or the belt-line trim that runs into the fenders) can't be whole-moved
   * cleanly and is deliberately left out. */
  captureNodes?: string[]
  /** Doors only. Like captureNodes, but for a mesh whose door part is FUSED into a larger shared
   * mesh (e.g. model-1980's `vitres` — the door window baked together with the fixed quarter
   * window). riggPart() TRIANGLE-SPLITS each named mesh by the door panel's own X/Z footprint,
   * attaching the door-window slice to that door's hinge and leaving the rest (quarter glass) in
   * place. Kept separate from captureNodes because splitting is only safe on meshes known to be
   * pure glass/trim where a cut edge is invisible — never on the painted body. */
  captureSplitNodes?: string[]
  /** Doors/lids whose panel is FUSED into the body shell with NO separate node at all (this 1973's
   * doors + engine-lid live inside SM_Base). There's nothing to detach by name, so the panel is
   * TRIANGLE-CUT out of the shell by a region and the slice is hinged. Values are FRACTIONS (0..1) of
   * the `splitSourceNodes` combined bounding box — NOT metres — because riggPart runs at build time
   * when the model is still at native scale and uncentered; fractions are invariant to that. x/y/z:
   * 0 = the box's min corner, 1 = its max. Written for the +X (right) side; set `mirrorX` to also cut
   * the mirrored (1-x) region for a door pair. `splitSourceNodes` names the shell mesh(es) to cut
   * from (substring match, e.g. ['SM_Base']). The cut edge on painted metal is visible up close, so
   * the region is tuned by screenshot; last resort when a model can't be re-exported with separated
   * door meshes. */
  captureRegion?: { xMin: number; xMax: number; yMin: number; yMax: number; zMin: number; zMax: number }
  splitSourceNodes?: string[]
  mirrorX?: boolean
  /** Optional SECOND cut pass, for meshes that need a TIGHTER region than the shell — e.g. the door's
   * inner trim/door-card (SM_Interior), which shares its mesh with the internal sill (below it) and
   * the B-pillar trim (behind it): cutting it by the shell's full region would drag those into the
   * swinging door. `trimNodes` names the mesh(es); `trimRegion` is its own fractions of the SAME shell
   * bbox. Both passes' slices join the one door hinge. */
  trimNodes?: string[]
  trimRegion?: { xMin: number; xMax: number; yMin: number; yMax: number; zMin: number; zMax: number }
  /** Material-name substrings to EXCLUDE from the trim pass — meshes using them are skipped even if
   * they fall in trimRegion. Used to drop the seats (whose wide bolster overlaps the door box) while
   * still taking the door-card trim that shares the SM_Interior node group. */
  trimExcludeMaterials?: string[]
}

export interface WheelMountConfig {
  /** Name of the node to hide (baked wheel) and measure (for the replacement RealWheel's hub
   * position + diameter) — see measureWheelMount()/RealCarModel.tsx. For model-1980's front/rear
   * axle nodes ("roue"/"roue_1") hiding just the outer one is enough: "roue_1" is nested as
   * "roue"'s OWN child (an authoring quirk, confirmed via the raw glTF node tree, not a normal
   * parent/child split), and a hidden parent's .visible=false already stops rendering of every
   * descendant — but both are still listed explicitly here since they're independently measured
   * (see splitLeftRight) and hiding an already-hidden descendant again is harmless. */
  nodeName: string
  /** True when this ONE node's geometry bundles BOTH the left and right wheel of an axle merged
   * together (confirmed on model-1980's "roue"/"roue_1" — same issue as the "porte_1" merged-door
   * node) — its own bounding box spans the full axle width, not one wheel. measureWheelMount()
   * splits the node's actual vertex data by world-space X sign to recover each wheel's real hub
   * + diameter, the same technique splitNodeByWorldX() uses to split the door's triangles. */
  splitLeftRight?: boolean
}

export interface CarModelDef {
  key: CarModelKey
  path: string
  label: string
  credit: string
  /** Name of the single node to render within the GLTF scene, if the file bundles more than
   * one object (the 1968 file bundles two cars — see the memory log entry for why). Undefined
   * means "render the whole loaded scene". */
  nodeName?: string
  /** Doors/trunk/engine-lid that can be hinged open on this specific model, keyed by finding
   * real named nodes in its scene graph — most of the 5 models aren't segmented this way, so
   * this is commonly empty. See RealCarModel.tsx for how these get detached and hinged. */
  openableParts?: OpenablePartConfig[]
  /** Node name(s) to HIDE while the engine lid is open. Some models bake an inner body/liner panel
   * that is textured dark on its bay-facing side and sits directly in front of the engine block, so
   * with the lid open it occludes the engine as a black frame (confirmed on model-1968's "Object_59"
   * via raycast — it's an inner shell spanning the car, distinct from the exterior paint mesh, so
   * hiding it while the bay is open exposes the engine without leaving a hole in the bodywork).
   * Restored when the lid closes. See RealCarModel.tsx. */
  engineBayHideNodes?: string[]
  /** Baked wheel node(s) to hide and measure so a real RealWheel model can be swapped in per the
   * `wheelOptions` selection (see RealCarModel.tsx). Undefined/empty means this model's wheels
   * aren't separable from the body (confirmed per model, not assumed — model-1948 and
   * model-ratlook are each one continuous fused shell with no wheel-shaped sub-mesh at all) and
   * stays on its baked-in wheels. Hub position + diameter are derived at runtime from each node's
   * own geometry, never hardcoded — see measureWheelMount(). */
  wheelMounts?: WheelMountConfig[]
  /** Explicit material name(s) to treat as body paint for exterior-color recoloring (see
   * useBodyPaint.ts). Undefined means auto-detect: the single largest-volume opaque non-glass
   * material (same heuristic as findBodyColor() in RealCarModel.tsx), which is enough for models
   * whose whole visible paint is one material (model-1948's "metal_schwarz", model-1980's
   * "Mat_0"). Only needed where the paint is split across more than one distinct material that
   * auto-detect could never pick all of at once — confirmed on model-1968, whose "Paint_new" and
   * "Body" materials both reference the identical baked paint texture. */
  paintMaterialNames?: string[]
  /** How the per-part editor groups this model's meshes into named "parts" (see carParts.ts). Some
   * files have good NODE names (model-1980: phares, feux_ar, porte…) and generic materials; others
   * the reverse (model-1968/1948: generic Object_NN nodes but good MATERIAL names — Body, Glass,
   * Chrom / metal_schwarz, glas…). Defaults to 'node'. */
  partGroupBy?: 'node' | 'material'
  /** False opts this model out of exterior-color recoloring entirely (see useBodyPaint.ts).
   * Defaults to true. Only model-ratlook sets this — its 8 generic `material0000..0007`
   * materials are all rust/patina photo textures with no distinct paint material to isolate,
   * confirmed by dumping its material list (no name resembles "paint"/"body"), and tinting them
   * would discolor the weathering rather than repaint the car, fighting the "Rat Look / Patina"
   * theme the model exists to represent. */
  recolorable?: boolean
  /** False if this model has no baked-in cabin (dashboard/seats) — gets RealInterior (model-1968's
   * real dashboard/seat/steering-wheel geometry, placed by reproducing 1968's own
   * interior-to-body relationship scaled to this model's dimensions — see RealInterior.tsx).
   * Defaults to true (has its own interior) when absent. */
  hasInterior?: boolean
  /** True when this model's geometry faces -Z where model-1968 faces +Z, so the merged interior's
   * depth placement and facing must be mirrored. Determined per model by screenshot. */
  interiorFlipZ?: boolean
  /** Caps the hollow cabin bottom with a body-coloured floor so an open door doesn't expose the dark
   * void underneath (the "área preta na lataria"). Authored in METRES, world-centered (X 0 = car
   * centreline, Z 0 = model centre), divided by the model's scale at render — see CabinFloor.tsx.
   * `halfWidth`/`zMin`/`zMax` bound the panel; `y` is its (thin) height. Only needed on models with
   * openable doors (a closed body hides the void). */
  cabinFloor?: { y: number; halfWidth: number; zMin: number; zMax: number }
  /** Multiplier (default 1) on the shared RealInterior's auto width-ratio scale. The interior is
   * sized by the host's FULL body width (fender to fender), but a model whose cabin/greenhouse is
   * proportionally narrower than the 1973 reference (e.g. model-1948, whose glass is only ±0.62 vs a
   * ±0.674 interior) has the interior poke out through the side windows. A value < 1 tucks it back
   * inside the cabin; tuned per model by screenshot. */
  interiorScale?: number
  /** Per-model placement calibration, determined by screenshot-verifying each model in the
   * scene (see .specs/3d-model.spec.md). X/Z centering and ground contact (Y) are computed
   * automatically from the object's bounding box (see RealCarModel.tsx) — only orientation and
   * real-world scale need to be figured out per model, since each was authored at a different
   * native unit scale and not necessarily facing the same way. */
  calibration: {
    rotationY: number
    /** Multiplies the model's native units so it matches LENGTH/WIDTH/HEIGHT in
     * .specs/3d-model.spec.md (1 unit = 1 meter in our scene) — derived from each model's
     * logged bounding box divided into the real ~4m target length, not assumed. */
    scale: number
  }
}

export const carModels: Record<CarModelKey, CarModelDef> = {
  'model-1948': {
    key: 'model-1948',
    path: '/models/fusca-1948.glb',
    label: 'VW Typ 11 (1948)',
    credit: 'Peter Boehm — CC-BY-4.0',
    // Native bounds ~(0.27,0.26,0.72) — authored much smaller than meters. scale =
    // target length (4.07m) / native length (0.724) ≈ 5.62, verified by screenshot.
    calibration: { rotationY: 0, scale: 5.62 },
    // Exterior-only — its single mesh's material submeshes are all body-panel/glass/mirror
    // names (metal_schwarz, glas, spiegel, ...), no seat/dash/interior naming, confirmed by
    // dumping the glTF node list directly (not assumed from the dark windows alone). Gets the
    // shared RealInterior (placement derived from 1968's own interior-to-body relationship, no
    // per-model anchor needed).
    hasInterior: false,
    // Cabin is narrower than the 1973 reference (glass ±0.62 vs a ±0.674 interior), so the shared
    // interior pokes through the side windows at full width-ratio scale — tuck it in ~15%.
    interiorScale: 0.85,
    // Nodes are generic; materials (metal_schwarz, glas, spiegel…) name the parts.
    partGroupBy: 'material',
  },
  'model-1968': {
    key: 'model-1968',
    path: '/models/fusca-1968.glb',
    label: '1968 Volkswagen Beetle',
    credit: 'KrStolorz — Sketchfab Standard',
    // three.js's GLTFLoader sanitizes node names (spaces -> underscores) at load time — this
    // must match the *sanitized* name, not the raw name from the source glTF JSON, or
    // findByName() silently fails to match and falls back to rendering the whole scene
    // (both bundled cars). Verified by loading the file through useGLTF and logging node names,
    // not by reading the raw JSON.
    nodeName: '1968_Volkswagen_Beetle_(new)_38',
    calibration: { rotationY: 0, scale: 1 },
    // Nodes are generic (Object_NN); materials (Body, Glass, Chrom, Wheel…) name the parts.
    partGroupBy: 'material',
    // Node names verified by loading through useGLTF and searching the isolated "new" car
    // subtree (not the raw glTF JSON, and not the whole scene — the "old" car has its own
    // identically-patterned Door/Hood/Trunk nodes that must not get picked up here). Despite
    // the names, "Hood_17" is this model's REAR engine lid and "Trunk_30" is its FRONT trunk —
    // confirmed by screenshot (Tampa do Motor/engine-lid toggle must open the end with the
    // taillights). Source-file node names aren't reliable evidence of which end is which.
    // Both lids follow the SAME pattern as model-1980 (the reference for openable parts): hinge
    // at the CABIN-SIDE top edge and rotate the outer tip up. Confirmed against runtime bbox
    // data — 1968's front trunk (Trunk_30) sits at +Z (nose at max.z 1.815, cabin side at min.z
    // 0.646) and its engine lid (Hood_17) at -Z (tail at min.z -1.991, cabin side at max.z
    // -1.48), the same layout as 1980's CAPOT/CAPOT_MOTEUR. The earlier config had both lids'
    // pivotZ+openAngle inverted (hinging at the outer tip), which swung each panel through a
    // huge arc and detached it from the body — the "opening out of scope" bug.
    openableParts: [
      { part: 'doors', nodeNames: ['DoorL_3', 'DoorR_7'], hingeAxis: 'y', openAngle: 1.3, pivotZ: 'max', pivotY: 'center' },
      { part: 'engineLid', nodeNames: ['Hood_17'], hingeAxis: 'x', openAngle: 1.1, pivotZ: 'max', pivotY: 'max' },
      { part: 'frontTrunk', nodeNames: ['Trunk_30'], hingeAxis: 'x', openAngle: -1.1, pivotZ: 'min', pivotY: 'max' },
    ],
    // "Object_59" (material "Body") is an inner shell textured dark on its bay-facing side; it sits
    // in front of the engine and reads as a black frame when the engine lid opens — hide it while
    // open (the exterior paint is a separate mesh, so no hole appears). Verified by raycast.
    engineBayHideNodes: ['Object_59'],
    // Each wheel is its own separate node with a dedicated "Wheel" material (unlike model-1980's
    // merged axle nodes) — one mesh child per group node, confirmed by dumping the raw glTF node
    // tree. Node names have spaces in the source glTF ("Wheel FL_20") — sanitized to underscores
    // by GLTFLoader at load time (see the nodeName comment above), so they must be matched here in
    // their sanitized form or findByName() silently fails (same pitfall documented there).
    wheelMounts: [
      { nodeName: 'Wheel_FL_20' },
      { nodeName: 'Wheel_FR_24' },
      { nodeName: 'Wheel_BL_8' },
      { nodeName: 'Wheel_BR_11' },
    ],
    // Within the isolated "new" car subtree, the visible paint is split across TWO distinct
    // materials — "Paint_new" (5 mesh instances) and "Body" (5 mesh instances) — rather than one,
    // confirmed by dumping the subtree's material usage directly. Both reference the exact same
    // embedded texture (verified offline: identical bufferView, average colour ~(112,88,38)/255),
    // so both must recolor together or the car would end up two-toned. See useBodyPaint.ts.
    paintMaterialNames: ['Paint_new', 'Body'],
    // Hollow shell: the baked "Interior" bottoms out at y≈0.40 with no floor pan below, so an open
    // door shows the dark void. Cap it just under the seat base across the cabin footprint (measured
    // at runtime: interior X ±0.6, Z −0.99..1.06). scale = 1, so metres == group-local here.
    cabinFloor: { y: 0.38, halfWidth: 0.62, zMin: -1.02, zMax: 1.08 },
  },
  'model-1980': {
    key: 'model-1980',
    path: '/models/fusca-1980.glb',
    label: 'VW 1303 (1980)',
    credit: 'Configcars / maxipub — CC-BY-4.0',
    // VW 1303 "Super Beetle": curved windshield + MacPherson-strut front end, exactly what
    // chassisYears['square-71-85'] describes — fills the gap where neither the user's own
    // reference-car era nor the meu-fusca preset previously had a matching real model.
    // Native bounds ~(3.18,2.87,7.82) — authored ~1.9x too large. scale = target length
    // (4.07m) / native length (7.821) ≈ 0.52, verified by screenshot.
    calibration: { rotationY: 0, scale: 0.52 },
    // Only one door node exists in the source file ("porte_1") — but it isn't a single door:
    // isolating and rendering just that node showed BOTH left and right door panels merged into
    // one mesh (~4890 vertices, sharing the main body-paint material) — confirmed by screenshot,
    // not assumed. splitLeftRight divides it by world-space X into two independently-hinged
    // doors — see riggPart() in RealCarModel.tsx. CAPOT/CAPOT_MOTEUR are the (French) parent
    // group nodes for the front trunk lid and engine lid respectively.
    openableParts: [
      {
        part: 'doors',
        nodeNames: ['porte_1'],
        hingeAxis: 'y',
        openAngle: 1.3,
        pivotZ: 'max',
        pivotY: 'center',
        splitLeftRight: true,
        // Peças por-lado da porta (malhas separadas por material) que giram junto com o painel:
        // retro_ext (retrovisor), plaquette (maçaneta), joint_porte (friso/borracha da porta).
        captureNodes: ['retro_ext', 'plaquette', 'joint_porte'],
        // Malhas onde a parte da porta está FUNDIDA com o resto, cortadas por triângulos na pegada
        // de cada porta: vitres = vidro da porta + custódia numa peça; jonc_lateral = friso corrido
        // que atravessa as duas portas e os para-lamas. Cada porta leva sua fatia; o resto fica.
        captureSplitNodes: ['vitres', 'jonc_lateral'],
      },
      { part: 'frontTrunk', nodeNames: ['CAPOT'], hingeAxis: 'x', openAngle: -1.1, pivotZ: 'min', pivotY: 'max' },
      { part: 'engineLid', nodeNames: ['CAPOT_MOTEUR'], hingeAxis: 'x', openAngle: 1.1, pivotZ: 'max', pivotY: 'max' },
    ],
    // "EXTERIEUR" in the source filename says it outright — confirmed by its node list too (no
    // seat/dash nodes, only body panels/trim/glass/lights). Gets the shared RealInterior
    // (placement derived from 1968's own interior-to-body relationship, no per-model anchor).
    hasInterior: false,
    // "roue" (front axle) and "roue_1" (rear axle) each merge BOTH the left AND right wheel's
    // rim/tire geometry into single meshes per component (jantes/pneus/Mat.1-3) — confirmed by
    // measuring: their own combined bounding box spans ~3m, almost the car's full 3.18m native
    // width, not one wheel. splitLeftRight recovers each side from the merged geometry's actual
    // vertex data (see measureWheelMount() in RealCarModel.tsx). "roue_1" is additionally nested
    // AS "roue"'s own child node in the raw glTF (not a sibling under "ROUES" as the name pattern
    // suggests) — harmless for hiding (a hidden parent already hides it) and irrelevant for
    // measuring (measureWheelMount only reads each node's own DIRECT mesh children, which
    // excludes the nested group automatically).
    wheelMounts: [
      { nodeName: 'roue', splitLeftRight: true },
      { nodeName: 'roue_1', splitLeftRight: true },
    ],
  },
  // Modelo BASE do usuário (asset "FINAL_MODEL_68" — Beetle round-tail, usado como o 1973). Peças por
  // seção: SM_Base (corpo, com portas fundidas), SM_Hood (capô dianteiro), SM_FrontKit/SM_RearKit,
  // SM_Interior (cabine própria → hasInterior padrão), SM_Disk/SM_Hub + Mesh11/17 (rodas). Autorado
  // em unidades minúsculas (comprimento ~0.041 no eixo Z) → escala ~100 para ~4,07 m. Agrupamento por
  // material (nomes de nó são muito longos/repetidos; materiais são mais legíveis). Portas/tampa
  // traseira estão fundidas no SM_Base → abrir via recorte por região (ver openableParts + captureRegion).
  'model-1973': {
    key: 'model-1973',
    path: '/models/fusca-1973.glb',
    label: 'VW Fusca 1973 (base)',
    credit: 'Modelo do usuário — FINAL_MODEL_68',
    calibration: { rotationY: 0, scale: 100.4 },
    partGroupBy: 'material',
    // SM_Hood is the FRONT luggage-lid, its own two meshes (paint + trim) sharing the "SM_Hood"
    // token — resolveRigNode() groups them into one hinge. Beetle front lid hinges at the cabin/
    // windshield edge (Z min) and lifts at the nose (Z max), same layout as the 1968's Trunk_30.
    // Doors + rear engine-lid are FUSED into SM_Base (no separate node) — not openable without a
    // region split of the body shell; deferred. Pivot/sign tuned by screenshot.
    openableParts: [
      { part: 'frontTrunk', nodeNames: ['SM_Hood'], hingeAxis: 'x', openAngle: -1.1, pivotZ: 'min', pivotY: 'max' },
      // Doors fused into SM_Base — cut out by region (metal band only for now), mirrored L/R, hinged
      // at the front vertical edge. Region tuned by screenshot. See captureRegion in carModels.ts.
      {
        part: 'doors',
        nodeNames: [],
        splitSourceNodes: ['SM_Base'],
        // Inner door-card (the SM_Interior trim — dominant material Details_MAT_127 there) swings with
        // the door, via a TIGHTER region so it doesn't drag the internal sill (below, y<~0.45) or the
        // B-pillar trim (behind, z<~0.03). The SEATS (material Details_Add_01_004, whose wide bolster
        // reaches into this box) are excluded by material so they stay put.
        trimNodes: ['SM_Interior'],
        trimExcludeMaterials: ['Details_Add_01_004'],
        // The door-card and the SEAT share material (Details_MAT_127), but a density scan across X in
        // the door slab found the physical GAP between them: seat at x 0.30–0.45, a valley at x
        // 0.45–0.48, then the door-card peaking at x≈0.575. xMin 0.787 (world ≈0.47) cuts in that gap
        // — taking the WHOLE door-card while leaving the seat behind (Add_01 cushion also excluded by
        // material). yMin clears the internal sill; zMin the B-pillar trim.
        trimRegion: { xMin: 0.787, xMax: 1.0, yMin: 0.14, yMax: 0.66, zMin: 0.207, zMax: 0.96 },
        // Fractions of SM_Base bbox (right/+X side). Door COLUMN. yMin 0 = the paint mesh's OWN
        // bottom edge (world y≈0.293, where the body colour ends and the separate chrome running-board
        // begins) — cutting at that natural border means the door's lower edge is clean (no serration)
        // and the door skin reaches all the way down to the estribo, per the user's red line. yMax
        // 0.95 takes the door glass with it (like the 1968's real door node y 0.42→1.47). Z REAR edge
        // is the vertical panel line just BEHIND the handle (vMAT_Details_EXT_092 at world z≈-0.13),
        // so zMin 0.02 clears it and reaches the B-pillar; splitSourceNodes cuts all SM_Base meshes so
        // the handle mesh comes into the door automatically. zMax is the A-pillar (front hinge) side.
        captureRegion: { xMin: 0.82, xMax: 1.0, yMin: 0.0, yMax: 1.0, zMin: 0.02, zMax: 1.0 },
        mirrorX: true,
        hingeAxis: 'y',
        openAngle: 1.0,
        pivotZ: 'max',
        pivotY: 'center',
      },
    ],
  },
}

const PRESET_MODEL: Partial<Record<string, CarModelKey>> = {
  'resto-stock': 'model-1968',
  // Modelo base do usuário (1973) — é o carro de referência agora.
  'meu-fusca': 'model-1973',
}

const CHASSIS_YEAR_MODEL: Partial<Record<string, CarModelKey>> = {
  'oval-59-65': 'model-1948',
  'round-66-70': 'model-1968',
  // 1973 cai em 1971–1985 → usa o novo modelo base do usuário.
  'square-71-85': 'model-1973',
}

/**
 * Selects which real GLTF model (if any) should render in place of the procedural FuscaModel.
 * A style preset with a curated real-model match (resto-stock → 1968, meu-fusca → 1980) wins
 * outright. Presets WITHOUT their own model — rat-look (now just the "patina" paint finish),
 * baja-bug, rebaixado-br — fall through to the era model for the preset's chassis year, so the look
 * is applied to a real body (e.g. rat-look = the era's model painted patina) rather than dropping to
 * the procedural placeholder. Freeform (no preset) uses chassis year alone. Returns null only when
 * even that has no model, meaning: render the procedural FuscaModel.
 */
export function pickRealModel(activePresetId: string | null, chassisYearId: string): CarModelDef | null {
  if (activePresetId) {
    const key = PRESET_MODEL[activePresetId]
    if (key) return carModels[key]
    // preset sem modelo próprio → cai para o modelo da era (abaixo)
  }
  const key = CHASSIS_YEAR_MODEL[chassisYearId]
  return key ? carModels[key] : null
}
