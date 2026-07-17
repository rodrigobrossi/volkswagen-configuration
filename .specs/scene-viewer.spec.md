# Scene / Viewer Spec — `Scene.tsx`

## Camera & controls

- Perspective camera, initial position framing the full car with some headroom (current:
  `[4.5, 2.2, 5]`, `fov: 40`) — re-tune if `3d-model.spec.md` dimensions change enough to clip.
- `OrbitControls` (drei): no panning, `minDistance`/`maxDistance` clamp zoom so the car can't be
  zoomed inside-out or shrunk to a dot, `minPolarAngle`/`maxPolarAngle` prevent flipping under
  the ground plane or fully overhead.
- `enableDamping` on, for smooth manual drag and a smooth auto-rotate transition.

## 360° turntable

- `configStore.autoRotate: boolean` (default `true`) is passed straight to `OrbitControls`'
  built-in `autoRotate`/`autoRotateSpeed` — no custom animation loop.
- A floating toggle button (in `App.tsx`, over the viewer pane) calls `toggleAutoRotate()`.
  Label reflects state (`⏸ 360°` when spinning, `⏵ 360°` when paused).
- Manual drag-to-orbit must keep working in both states.

## Lighting

- No external HDRI/environment map (an earlier attempt at drei's `<Environment>` hung silently
  in a network-restricted sandbox — do not reintroduce without confirming the deployment target
  has outbound network access, or self-host the HDRI asset).
- Lighting is fully local: ambient + hemisphere fill + a primary directional (shadow-casting)
  + a secondary low-intensity directional as fill from the opposite side.
- `shadows` enabled on the `Canvas`; body/wheels `castShadow`, ground/`ContactShadows` receive.

## Ground

- A `gridHelper` for spatial reference plus drei's `ContactShadows` for a soft contact shadow
  under the car — no full ground mesh/texture.
