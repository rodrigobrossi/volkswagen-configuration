---
id: SPEC-scene-viewer
type: spec
title: Scene viewer — camera, light, turntable
status: active
tags: [spec, render]
links: [SPEC-rendering, AGT-verifier]
code: [src/render/Scene.tsx, src/App.tsx]
updated: 2026-11-13
---

# Scene viewer

## Camera & controls
- **R1.** Perspective camera at `[4.5, 2.2, 5]`, `fov 40`, framing a ~4 m car with headroom. Re-tune
  if the target vehicle size changes enough to clip.
- **R2.** `OrbitControls`: no pan; distance 3–10; polar angle 0.3–π/2.1 (never under the ground,
  never fully overhead); damping 0.1.

## 360° turntable
- **R3.** `configStore.autoRotate` (default `true`) drives OrbitControls' built-in `autoRotate`
  (speed 2) — no custom animation loop.
- **R4.** A floating button over the viewer toggles it (`⏸ 360°` spinning / `⏵ 360°` paused);
  manual drag keeps working in both states.

## Lighting
- **R5.** No external HDRI: image-based lighting comes from three's procedural `RoomEnvironment`
  baked into a PMREM map (an HDRI fetch once hung in a sandboxed setup). Without an environment map
  metallic surfaces render near-black.
- **R6.** Hemisphere fill + ambient + a shadow-casting key directional (1024² map) + a weak opposite
  fill directional. `shadows` on the Canvas.

## Ground
- **R7.** `gridHelper` for spatial reference + `ContactShadows` under the car; no ground mesh.
  Background `#1b1d22`.

## Verification hooks
- **R8.** In DEV only, `onCreated` exposes `window.__r3f` and `window.__scene` for the
  [verifier](../agents/verifier-agent.md); never in production builds.
