---
id: ALG-platform
type: algorithm
title: Platform (chassis) provision
status: active
tags: [provision, chassis]
links: [VEH-vw-type1-platform, T-0003]
code: [src/render/provisions/Platform.tsx, src/core/contracts/family.ts]
updated: 2026-09-29
---

# Platform

A family can declare procedural platform parts (boxes/tubes, metres, vehicle frame, with an `explode`
vector). On models whose profile enables it, the chassis view hides the body and shows the platform,
assembled or exploded. Today the parts are fixed coordinates anchored on one model's measured axles;
deriving them from measured wheel hubs (so any model gets a matching platform) is [T-0003](../roadmap/T-0003-platform-from-hubs.md).
