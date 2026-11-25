---
id: T-0003
type: task
title: Derive the platform from measured hubs and enable it on the 1973
status: open
tags: [task, chassis, platform]
links: [ALG-platform, VEH-vw-type1-platform, ALG-measure-wheels, T-0006]
code: [src/vehicles/vw-type1/platform.ts, src/render/provisions/Platform.tsx]
updated: 2026-11-13
---

# T-0003 — Platform from hubs

The platform's 10 members are fixed coordinates anchored on model-1980 (axles z ≈ ±1.24, track ±0.66,
wheel centre y ≈ 0.35), so only the 1980 enables it. The owner wants it on the 1971–85 body (1973).

**Approach.** Express member coordinates relative to the measured axle line/track/wheel-centre
height (`BuiltVehicle.wheelHubs`) instead of absolutes. The 1973 has no wheel mounts today — depends
on measuring its fused wheels ([T-0006](T-0006-1973-wheels-as-base.md)).

**Acceptance.** `platform.enabled` on 1973 and 1980; the assembled platform sits under each body at its
own axles; 1980 output unchanged.
