---
id: GLO-glossary
type: vision
title: Glossary
status: active
tags: [glossary]
links: [ONT-overview, CON-model-profile]
updated: 2026-09-24
---

# Glossary

| Term | Meaning |
|---|---|
| **Family** | A vehicle line sharing catalog, presets and provisions (e.g. `vw-type1`). [contract](../contracts/vehicle-family.md) |
| **Model / asset** | One 3D file of a vehicle. Its knowledge is a **profile**. [contract](../contracts/model-profile.md) |
| **Slot** | A canonical part position in the ontology (`closure.door.left`). |
| **Open group** | Slots toggled together (`doors`, `frontLid`, `rearLid`). |
| **Binding** | A profile entry mapping asset geometry to slots, with an extraction strategy. |
| **Build frame** | The asset's native units after zeroing its root transform (uncentered). |
| **Vehicle frame** | Metres, centred on X/Z, grounded at Y=0, +Z forward, +X right. |
| **Provision** | Geometry the software supplies to a model (engine, donor interior, cabin floor, platform, wheels). |
| **Companion** | A mesh that must ride a hinge with its panel (handle, mirror, fused glass). |
| **Signature** | A part's geometric fingerprint in the vehicle frame, used to learn and classify. |
| **Estribo** | Running board — the chrome/dark strip below the doors (the door's lower limit). |
| **Quebra-vento** | Vent window at the front of the door glass. |
| **Chapéu de napoleão** | The Type 1 front tunnel fork anchoring the axle beam. |
