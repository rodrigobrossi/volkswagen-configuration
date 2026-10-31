---
id: MOD-fusca-1973
type: model
title: Fusca 1973 (base model) — doors fused into the shell
status: active
tags: [model, vw-type1, reference]
links: [VEH-vw-type1, ALG-region-clip, ALG-trim-pass, L-0010, L-0012, ALG-donor-interior]
code: [src/vehicles/vw-type1/models/fusca-1973.profile.json]
updated: 2026-09-29
---

# Fusca 1973 (base) · `model-1973` · `fusca-1973.glb`

The user's base model (asset "FINAL_MODEL_68"). Sections: `SM_Base` (cabin + FUSED doors + glass),
`SM_Hood` (front lid, 2 meshes), `SM_FrontKit` / `SM_RearKit`, `SM_Interior` (own cabin — also the
family's donor cabin), `SM_Disk_*` / `SM_Hub_*` / `llanta` (wheels fused per axle → baked wheels stay).
- **Frame:** native length ~0.041 → scale 100.4. **Grouping:** by material.
- **Front lid:** `SM_Hood` token groups paint + trim into one hinge.
- **Doors (region-clip on `SM_Base`)** — tuned with the owner line by line:
  - bottom `yMin 0` = the paint mesh's own edge at the **running board** (clean edge, "antes de mudar de cor");
  - top `yMax 1` = the roof line incl. the metal above the glass, following the **vent-window** line;
  - rear `zMin 0.02` = the vertical gap just **behind the handle** (`Details_EXT_092` at z≈−0.13);
  - front `zMax 1` = the A-pillar / SM_Base front edge; outboard band `xMin 0.82`;
  - clipped at the planes, straight edges both sides ([L-0010](../../../learnings/L-0010-clip-not-centroid.md)).
- **Door card (trim pass on `SM_Interior`)**: the seat shares `Details_MAT_127` with the door card
  ([L-0012](../../../learnings/L-0012-seat-shares-door-card-material.md)); cut at the density gap
  (world x≈0.47 → `xMin 0.787`), above the internal sill (`yMin 0.14`), ahead of the B-pillar trim
  (`zMin 0.207`); seat cushions (`Details_Add_01_004`) excluded.
- **Painted interior metal** uses the body-paint material → follows the paint on this model; retinted
  when donated ([L-0011](../../../learnings/L-0011-interior-paint-bleed.md)).
- Known residue: the owner still reported small seat pieces on the left door (armrest area) at the
  last review — [T-0001](../../../roadmap/T-0001-1973-door-card.md). Rear engine lid is fused and not yet
  cut — [T-0002](../../../roadmap/T-0002-1973-engine-lid.md).

**Parity probe (2026-09-24):** 48 meshes · 134,155 verts (closed = open); hinges door L 14,184,
front lid 2,788, door R 17,112.
