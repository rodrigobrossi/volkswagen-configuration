---
id: ALG-engine-bay
type: algorithm
title: Engine bay provision
status: active
tags: [provision, powertrain]
links: [CON-vehicle-family, ALG-paint-detection]
code: [src/render/provisions/EngineProvision.tsx, src/render/provisions/EngineBay.tsx, src/render/provisions/EngineBlock.tsx]
updated: 2026-09-29
---

# Engine bay

Only for models with a rig of the family's `engine.accessGroup`, and only while it is open (a closed
lid is not a real enclosure). Body shells are hollow, so an open lid shows a black void:
- **bay**: opaque, body-coloured tub (floor + taller cabin-side firewall + side walls; open top and
  open tail so the rear viewer sees the engine), sized from the **lid's own footprint** × `fit`;
- **engine**: X centred on the lid, Z inset `rearInsetM` from the tail, Y at `floorHeightM`,
  scale `realScale / modelScale`;
- `engineBay.hideNodes` hides inner shells that occlude it (1968 `Object_59`).
