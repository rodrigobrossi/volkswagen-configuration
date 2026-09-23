import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { CarModelDef, OpenablePartConfig, OpenablePartKind, WheelMountConfig } from '../data/carModels'
import { wheelOptions } from '../data/fusca'
import { realWheelModels, wheelOptionModel } from '../data/wheelModels'
import { useConfigStore } from '../store/configStore'
import { EngineBlock } from './EngineBlock'
import { EngineBay } from './EngineBay'
import { CabinFloor } from './CabinFloor'
import { Chassis } from './Chassis'
import { RealInterior } from './RealInterior'
import { RealWheel } from './RealWheel'
import { useBodyPaint } from './useBodyPaint'
import { usePartOverrides } from './usePartOverrides'
import { discoverParts } from '../data/carParts'
import { usePartsStore } from '../store/partsStore'
import { ExtraPart } from './ExtraPart'

// EngineBlock is authored at real-world (~1m) scale; nesting it inside this model's own
// calibrated <group scale={model.calibration.scale}> would shrink/enlarge it along with the
// car, so its own scale prop cancels that out to keep it at a true, model-independent size.
const ENGINE_REAL_SCALE = 0.55

// Real-world height (metres above the ground plane) the engine block's underside rests at inside
// the rear bay — the bay floor sits well above the wheel-bottoms, so this must be high enough that
// the block doesn't poke through the car's underside. Divided by each model's scale so it lands at
// the same world height regardless of native units. Tuned by screenshot.
const ENGINE_FLOOR_HEIGHT_M = 0.5

// Real-world metres the engine block's CENTRE sits forward of the car's rear boundary. Big enough
// that the whole block (~0.4m deep at ENGINE_REAL_SCALE) clears the inward-curving tail shell and
// stays fully within the chassis, small enough that it's still in the rear bay, not under the
// cabin. Verified against measured world bounding boxes. Divided by scale per model.
const ENGINE_REAR_INSET_M = 0.6

// Open-top engine-bay tub placed around the block to replace the car's dark hollow interior (see
// EngineBay.tsx). Real-world metres, divided by each model's scale like the engine constants above.
// A bit wider/deeper than the block so its walls don't clip it; height leaves the block's top edge
// poking just above the rim so it stays clearly exposed through the open lid.
// Short side walls: the block's top must rise clearly above the rim so it reads as sitting IN the
// bay, not boxed inside it. Floor is at ENGINE_FLOOR_HEIGHT_M - drop (~0.46m); this puts the side
// rim ~0.80m, with the block top (~0.97m) proud of it. (Bay width/depth aren't constants — they're
// derived per model from the engine-lid opening; see the render block.)
const ENGINE_BAY_HEIGHT_M = 0.34
// The cabin-side firewall is taller — it stands behind the engine and must rise high enough to hide
// the cabin seats (their tops ~1.0m) that would otherwise show through the engine opening.
const ENGINE_BAY_FIREWALL_HEIGHT_M = 0.56
// Floor sits this far below the block's underside (ENGINE_FLOOR_HEIGHT_M) so the block rests inside.
const ENGINE_BAY_FLOOR_DROP_M = 0.04

// Average colour of a texture's image, in linear working space. Some models (e.g. 1968) carry the
// paint colour in a texture with a white base-colour factor, so reading material.color alone yields
// white — sampling the map recovers the real colour. Draws the image tiny and averages its pixels;
// the GLTF (and thus its textures) is fully loaded by useGLTF before we render, so image is ready.
function averageTextureColor(map: THREE.Texture): THREE.Color | null {
  const img = map.image as CanvasImageSource & { width?: number; height?: number }
  if (!img || !img.width) return null
  const canvas = document.createElement('canvas')
  canvas.width = 16
  canvas.height = 16
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  try {
    ctx.drawImage(img, 0, 0, 16, 16)
  } catch {
    return null // cross-origin taint or undecodable — caller falls back
  }
  const data = ctx.getImageData(0, 0, 16, 16).data
  let r = 0
  let g = 0
  let b = 0
  const n = data.length / 4
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]
    g += data[i + 1]
    b += data[i + 2]
  }
  // Pixels are sRGB; convert to linear so it matches three's working colour space (same as what
  // Color.set('#rrggbb') does for the untextured path).
  return new THREE.Color(r / n / 255, g / n / 255, b / n / 255).convertSRGBToLinear()
}

// Picks the car's body-paint colour to tint the engine bay with, so the tub reads as part of the
// bodywork. Heuristic: the paint material covers the most surface — pick the opaque, non-glass
// material with the greatest summed mesh bounding-box volume. Robust across these models' wildly
// different material-naming schemes (1980's generic "Mat_0", 1968's "Paint_new", etc.) without a
// per-model name mapping. For a textured paint material (white base colour + map) the colour comes
// from the map, so sample it. Falls back to a neutral dark grey if nothing suitable is found.
function findBodyColor(object: THREE.Object3D): THREE.Color {
  const volumeByMat = new Map<THREE.MeshStandardMaterial, number>()
  const box = new THREE.Box3()
  const boxSize = new THREE.Vector3()
  object.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    const mat = mesh.material as THREE.MeshStandardMaterial
    if (!mat || Array.isArray(mat) || !mat.color) return
    if (mat.transparent && mat.opacity < 0.9) return // skip glass
    // skip flat near-black (interior/rubber/shadow); textured paint reads white here, so keep it
    if (!mat.map && mat.color.r + mat.color.g + mat.color.b < 0.12) return
    box.setFromObject(mesh)
    box.getSize(boxSize)
    const vol = boxSize.x * boxSize.y * boxSize.z
    volumeByMat.set(mat, (volumeByMat.get(mat) ?? 0) + vol)
  })
  let best: THREE.MeshStandardMaterial | null = null
  let bestVol = -1
  for (const [mat, vol] of volumeByMat) {
    if (vol > bestVol) {
      bestVol = vol
      best = mat
    }
  }
  if (!best) return new THREE.Color('#3a3a3a')
  if (best.map) {
    const sampled = averageTextureColor(best.map)
    if (sampled) return sampled
  }
  return best.color.clone()
}

// Finds a named node anywhere in the scene graph — used to pick just one car object out of
// fusca-1968.glb, which bundles two (see .specs/3d-model.spec.md Real GLTF Models section).
function findByName(root: THREE.Object3D, name: string): THREE.Object3D | undefined {
  let found: THREE.Object3D | undefined
  root.traverse((obj) => {
    if (!found && obj.name === name) found = obj
  })
  return found
}

// Resolve one `nodeNames` entry to a SINGLE riggable node. Preferred path is an exact node match
// (model-1968/-1980, whose openable panels are their own single node). But some models author a part
// as SEVERAL meshes sharing a token in their (long, sanitized) node names and no clean parent group —
// e.g. this 1973's front hood is two meshes both containing "SM_Hood" (paint + trim). In that case,
// gather every mesh whose name includes the token and wrap them in one Group (attach() preserves each
// mesh's world pose), so riggPart hinges them together off ONE combined bounding box instead of
// splitting them into separate hinges that would drift apart. Returns undefined if nothing matches.
function resolveRigNode(object: THREE.Object3D, token: string): THREE.Object3D | undefined {
  const exact = findByName(object, token)
  if (exact) return exact
  const matches: THREE.Object3D[] = []
  object.traverse((o) => {
    if (o instanceof THREE.Mesh && o.name.includes(token)) matches.push(o)
  })
  if (matches.length === 0) return undefined
  if (matches.length === 1 && matches[0].parent) return matches[0]
  // Wrap under a group parented where the meshes live, so world transforms compose correctly.
  const host = matches[0].parent ?? object
  const group = new THREE.Group()
  group.name = `rig:${token}`
  host.add(group)
  group.updateMatrixWorld(true)
  matches.forEach((m) => group.attach(m))
  return group
}

interface WheelHub {
  /** Object-local (pre-`centering`, pre-outer-`scale`) position — same convention as
   * OpenableRig.centers below, combined with `centering` at render time. */
  position: THREE.Vector3
  /** Object-local diameter (average of the mount's own bounding-box Y/Z size) — used directly as
   * RealWheel's `diameter` prop with no unit conversion, same "already in this group's local
   * units" reasoning as the engine bay's size constants derived from the lid opening. */
  diameter: number
}

// Only this mount node's OWN direct children that are themselves meshes — deliberately shallow,
// NOT a full recursive descendant walk. On model-1980, "roue" (front axle) has "roue_1" (rear
// axle) as one of its own children (confirmed via the raw glTF node tree — an authoring quirk,
// not a normal nested grouping), so recursing into it would blend the front and rear wheels into
// one bogus combined box. Filtering to Mesh children skips it automatically, since it's a Group,
// with no per-model exclusion list needed.
function directMeshChildren(node: THREE.Object3D): THREE.Mesh[] {
  return node.children.filter((c): c is THREE.Mesh => c instanceof THREE.Mesh)
}

// Derives one mount's replacement-wheel hub(s) purely from its own baked geometry — same
// "measure the real thing, don't hardcode" precedent as the engine bay sizing itself from the
// lid opening's own bounding box (see the engineLidRig sizing below). A plain (non-split) mount
// yields exactly one hub from its own meshes' combined bounding box. A `splitLeftRight` mount
// (model-1980's "roue"/"roue_1", which each merge both wheels of an axle into one mesh per
// component — confirmed the same way as the "porte_1" merged-door node) instead reads each
// mesh's actual vertex data and splits it by world-space X sign, recovering the two individual
// wheels — trusting the combined bounding box here would land a single fake hub at the car's
// centerline (x=0), matching neither wheel.
function measureWheelMount(object: THREE.Object3D, config: WheelMountConfig): WheelHub[] {
  const node = findByName(object, config.nodeName)
  if (!node) return []
  const meshes = directMeshChildren(node)
  if (meshes.length === 0) return []

  function toHub(box: THREE.Box3): WheelHub | null {
    if (box.isEmpty()) return null
    const size = box.getSize(new THREE.Vector3())
    return { position: box.getCenter(new THREE.Vector3()), diameter: (size.y + size.z) / 2 }
  }

  if (!config.splitLeftRight) {
    const box = new THREE.Box3()
    meshes.forEach((m) => box.expandByObject(m))
    const hub = toHub(box)
    return hub ? [hub] : []
  }

  const left = new THREE.Box3()
  const right = new THREE.Box3()
  const v = new THREE.Vector3()
  meshes.forEach((mesh) => {
    const position = mesh.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld)
      ;(v.x >= 0 ? right : left).expandByPoint(v)
    }
  })
  return [right, left].map(toHub).filter((hub): hub is WheelHub => hub !== null)
}

interface OpenableRig {
  part: OpenablePartKind
  axis: 'x' | 'y'
  angle: number
  /** One hinge group per found node; doors get one per side, lids typically just one. */
  hinges: THREE.Group[]
  /** Mirrors angle sign per hinge — for doors, by which side of X=0 that door sits on;
   * always +1 for single-hinge lid parts. */
  signs: number[]
  /** Each node's own bounding-box center (object-local, pre-detachment) — for placing things
   * like EngineBlock in the middle of the bay. The hinge's own position is a box *edge* (the
   * pivot), not a usable "center of this part" reference — using it directly for engine
   * placement lands the engine near the panel's outer tip, floating past the bumper. */
  centers: THREE.Vector3[]
  /** Each node's own bounding-box SIZE (object-local, pre-detachment). For the engine lid this is
   * the opening's footprint (the closed lid spans the hole it covers), used to size the engine bay
   * to the actual opening per model rather than with fixed constants that only fit one car. */
  sizes: THREE.Vector3[]
}

function edgeValue(box: THREE.Box3, axis: 'x' | 'y' | 'z', edge: 'min' | 'max' | 'center') {
  if (edge === 'center') return (box.min[axis] + box.max[axis]) / 2
  return box[edge][axis]
}

// Sketchfab bakes a small "available under this license until <year>-<year>" watermark plate
// into some downloads as its own mesh/material — confirmed on fusca-1968.glb via a material→
// node map of the raw glTF (material "2020-2025" on a node inside the isolated "new" car
// subtree, not a scene-level decal). Matching by material-name pattern rather than a hardcoded
// node name (e.g. "Object_69") so this keeps working if the file is ever re-exported.
const WATERMARK_MATERIAL_PATTERN = /^\d{4}-\d{4}$/

function removeWatermarkNodes(object: THREE.Object3D) {
  const toRemove: THREE.Object3D[] = []
  object.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return
    const materials = Array.isArray(node.material) ? node.material : [node.material]
    if (materials.some((mat) => WATERMARK_MATERIAL_PATTERN.test(mat.name))) toRemove.push(node)
  })
  toRemove.forEach((node) => node.parent?.remove(node))
}

// model-1980's "porte_1" node isn't one door — it's both left and right door panels merged
// into a single mesh (confirmed by isolating and rendering just that node: two separate
// door-shaped panels side by side, sharing the main body-paint material, ~4890 vertices —
// roughly double a normal single door). Rigging that as one hinge can never look right (its
// own bounding-box center sits at x≈0, straddling the car's centerline no matter the rotation
// sign). Splitting its triangles by which side of the car's centerline their world-space
// position falls on turns it into two independent, correctly-offset door meshes that the
// existing per-node hinge logic in riggPart() already handles correctly (same code path as
// 1968's two named door nodes) — see .specs/3d-model.spec.md.
function splitNodeByWorldX(sourceNode: THREE.Object3D): { left: THREE.Object3D; right: THREE.Object3D } {
  const leftClone = sourceNode.clone(true)
  const rightClone = sourceNode.clone(true)
  leftClone.name = `${sourceNode.name}_L`
  rightClone.name = `${sourceNode.name}_R`

  const origMeshes: THREE.Mesh[] = []
  sourceNode.traverse((n) => n instanceof THREE.Mesh && origMeshes.push(n))
  const leftMeshes: THREE.Mesh[] = []
  leftClone.traverse((n) => n instanceof THREE.Mesh && leftMeshes.push(n))
  const rightMeshes: THREE.Mesh[] = []
  rightClone.traverse((n) => n instanceof THREE.Mesh && rightMeshes.push(n))

  const v = new THREE.Vector3()
  origMeshes.forEach((origMesh, meshIndex) => {
    const geom = origMesh.geometry.index ? origMesh.geometry.toNonIndexed() : origMesh.geometry
    const position = geom.getAttribute('position') as THREE.BufferAttribute
    const normal = geom.getAttribute('normal') as THREE.BufferAttribute | undefined
    const uv = geom.getAttribute('uv') as THREE.BufferAttribute | undefined
    const leftTris: number[] = []
    const rightTris: number[] = []

    // Use the ORIGINAL (still-attached, matrixWorld-valid) mesh's world transform to decide
    // each triangle's side — the clones are detached and don't have a valid matrixWorld of
    // their own yet, but they share the same LOCAL vertex positions, which is all that's
    // needed once the filtered geometry is reattached under an identically-transformed clone.
    for (let tri = 0; tri < position.count; tri += 3) {
      let sumX = 0
      for (let k = 0; k < 3; k++) {
        v.fromBufferAttribute(position, tri + k).applyMatrix4(origMesh.matrixWorld)
        sumX += v.x
      }
      ;(sumX >= 0 ? rightTris : leftTris).push(tri, tri + 1, tri + 2)
    }

    function buildFiltered(indices: number[]): THREE.BufferGeometry {
      const g = new THREE.BufferGeometry()
      const p = new Float32Array(indices.length * 3)
      const n2 = normal ? new Float32Array(indices.length * 3) : null
      const u2 = uv ? new Float32Array(indices.length * 2) : null
      indices.forEach((srcI, i) => {
        p[i * 3] = position.getX(srcI)
        p[i * 3 + 1] = position.getY(srcI)
        p[i * 3 + 2] = position.getZ(srcI)
        if (normal && n2) {
          n2[i * 3] = normal.getX(srcI)
          n2[i * 3 + 1] = normal.getY(srcI)
          n2[i * 3 + 2] = normal.getZ(srcI)
        }
        if (uv && u2) {
          u2[i * 2] = uv.getX(srcI)
          u2[i * 2 + 1] = uv.getY(srcI)
        }
      })
      g.setAttribute('position', new THREE.BufferAttribute(p, 3))
      if (n2) g.setAttribute('normal', new THREE.BufferAttribute(n2, 3))
      if (u2) g.setAttribute('uv', new THREE.BufferAttribute(u2, 2))
      return g
    }

    leftMeshes[meshIndex].geometry = buildFiltered(leftTris)
    rightMeshes[meshIndex].geometry = buildFiltered(rightTris)
  })

  return { left: leftClone, right: rightClone }
}

// A door in these GLTFs is only the painted panel; its handle, mirror and weatherstrip/friso live in
// separate PER-SIDE by-material meshes (named in OpenablePartConfig.captureNodes) that otherwise stay
// put when the panel hinges (the user's "os frisos e maçanetas permanecem no mesmo lugar" bug). This
// attaches each such mesh to the NEAREST door hinge by X, so the whole door composition swings
// together. Whole-mesh reparenting (never triangle-splitting) means a neighbour can never be torn —
// only complete per-side parts are listed, so nothing shared (glass fused with the quarter window,
// belt trim running into the fenders, the VW badge, a wheel) is ever moved.
// Partitions a mesh's triangles by whether their world-space centroid falls inside `box`, returning
// two FRESH BufferGeometries (either null when empty). Never mutates the shared cached geometry
// (RealCarModel clones the graph but not geometries) — same safety reasoning as splitNodeByWorldX.
// Used to split a door part that's fused into a larger glass/trim mesh (see captureSplitNodes).
function partitionMeshByWorldBox(
  mesh: THREE.Mesh,
  box: THREE.Box3,
): { inside: THREE.BufferGeometry | null; outside: THREE.BufferGeometry | null } {
  const src = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry
  const position = src.getAttribute('position') as THREE.BufferAttribute
  if (!position) return { inside: null, outside: null }
  const normal = src.getAttribute('normal') as THREE.BufferAttribute | undefined
  const uv = src.getAttribute('uv') as THREE.BufferAttribute | undefined
  mesh.updateWorldMatrix(true, false)
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const cen = new THREE.Vector3()
  const inside: number[] = []
  const outside: number[] = []
  for (let tri = 0; tri < position.count; tri += 3) {
    a.fromBufferAttribute(position, tri).applyMatrix4(mesh.matrixWorld)
    b.fromBufferAttribute(position, tri + 1).applyMatrix4(mesh.matrixWorld)
    c.fromBufferAttribute(position, tri + 2).applyMatrix4(mesh.matrixWorld)
    cen.copy(a).add(b).add(c).multiplyScalar(1 / 3)
    ;(box.containsPoint(cen) ? inside : outside).push(tri, tri + 1, tri + 2)
  }
  const build = (indices: number[]) => {
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(indices.length * 3)
    const n2 = normal ? new Float32Array(indices.length * 3) : null
    const u2 = uv ? new Float32Array(indices.length * 2) : null
    indices.forEach((srcI, i) => {
      p[i * 3] = position.getX(srcI)
      p[i * 3 + 1] = position.getY(srcI)
      p[i * 3 + 2] = position.getZ(srcI)
      if (normal && n2) {
        n2[i * 3] = normal.getX(srcI)
        n2[i * 3 + 1] = normal.getY(srcI)
        n2[i * 3 + 2] = normal.getZ(srcI)
      }
      if (uv && u2) {
        u2[i * 2] = uv.getX(srcI)
        u2[i * 2 + 1] = uv.getY(srcI)
      }
    })
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    if (n2) g.setAttribute('normal', new THREE.BufferAttribute(n2, 3))
    if (u2) g.setAttribute('uv', new THREE.BufferAttribute(u2, 2))
    return g
  }
  return { inside: inside.length ? build(inside) : null, outside: outside.length ? build(outside) : null }
}

// Like partitionMeshByWorldBox, but CLIPS triangles exactly at the box's six planes instead of
// assigning whole triangles by their centroid. Triangles straddling a plane are split, with new
// vertices interpolated (position/normal/uv) right on the plane — so both the extracted "inside"
// piece (the door) and the "outside" remainder (the body, now with a matching hole) get perfectly
// STRAIGHT cut edges along the box, not the stair-stepped/serrated edge the centroid method leaves.
// Used for the fused-door region cut (carModels.ts captureRegion) where the cut runs through the
// painted shell and the edge is seen up close. Works in the mesh's LOCAL space (the 6 world planes
// are transformed in by the inverse world matrix) so the built geometry keeps the source transform.
type ClipVert = { p: THREE.Vector3; n: THREE.Vector3 | null; uv: THREE.Vector2 | null }
function clipMeshByWorldBox(
  mesh: THREE.Mesh,
  box: THREE.Box3,
): { inside: THREE.BufferGeometry | null; outside: THREE.BufferGeometry | null } {
  const src = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry
  const position = src.getAttribute('position') as THREE.BufferAttribute
  if (!position) return { inside: null, outside: null }
  const normal = src.getAttribute('normal') as THREE.BufferAttribute | undefined
  const uv = src.getAttribute('uv') as THREE.BufferAttribute | undefined
  mesh.updateWorldMatrix(true, false)
  const inv = new THREE.Matrix4().copy(mesh.matrixWorld).invert()
  // Six inward-facing planes of the box (distanceToPoint >= 0 means inside), transformed to local.
  const planes = [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), -box.min.x),
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), box.max.x),
    new THREE.Plane(new THREE.Vector3(0, 1, 0), -box.min.y),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), box.max.y),
    new THREE.Plane(new THREE.Vector3(0, 0, 1), -box.min.z),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), box.max.z),
  ].map((pl) => pl.applyMatrix4(inv))

  const lerpVert = (A: ClipVert, B: ClipVert, t: number): ClipVert => ({
    p: A.p.clone().lerp(B.p, t),
    n: A.n && B.n ? A.n.clone().lerp(B.n, t).normalize() : null,
    uv: A.uv && B.uv ? A.uv.clone().lerp(B.uv, t) : null,
  })
  // Split a convex polygon by a plane into its inside (>=0) and outside parts.
  const split = (poly: ClipVert[], pl: THREE.Plane) => {
    const pos: ClipVert[] = []
    const neg: ClipVert[] = []
    for (let i = 0; i < poly.length; i++) {
      const A = poly[i]
      const B = poly[(i + 1) % poly.length]
      const dA = pl.distanceToPoint(A.p)
      const dB = pl.distanceToPoint(B.p)
      if (dA >= 0) pos.push(A)
      else neg.push(A)
      if (dA < 0 !== dB < 0) {
        const t = dA / (dA - dB)
        const I = lerpVert(A, B, t)
        pos.push(I)
        neg.push(I)
      }
    }
    return { pos, neg }
  }

  const insideTris: ClipVert[] = []
  const outsideTris: ClipVert[] = []
  const fan = (poly: ClipVert[], out: ClipVert[]) => {
    for (let i = 1; i + 1 < poly.length; i++) out.push(poly[0], poly[i], poly[i + 1])
  }
  const vAt = (i: number): ClipVert => ({
    p: new THREE.Vector3().fromBufferAttribute(position, i),
    n: normal ? new THREE.Vector3().fromBufferAttribute(normal, i) : null,
    uv: uv ? new THREE.Vector2().fromBufferAttribute(uv, i) : null,
  })
  for (let tri = 0; tri < position.count; tri += 3) {
    let insidePolys: ClipVert[][] = [[vAt(tri), vAt(tri + 1), vAt(tri + 2)]]
    for (const pl of planes) {
      const next: ClipVert[][] = []
      for (const poly of insidePolys) {
        const { pos, neg } = split(poly, pl)
        if (pos.length >= 3) next.push(pos)
        if (neg.length >= 3) fan(neg, outsideTris) // definitively outside the box
      }
      insidePolys = next
    }
    insidePolys.forEach((poly) => fan(poly, insideTris))
  }

  const build = (tris: ClipVert[]) => {
    if (!tris.length) return null
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(tris.length * 3)
    const n2 = normal ? new Float32Array(tris.length * 3) : null
    const u2 = uv ? new Float32Array(tris.length * 2) : null
    tris.forEach((v, i) => {
      p[i * 3] = v.p.x
      p[i * 3 + 1] = v.p.y
      p[i * 3 + 2] = v.p.z
      if (n2 && v.n) {
        n2[i * 3] = v.n.x
        n2[i * 3 + 1] = v.n.y
        n2[i * 3 + 2] = v.n.z
      }
      if (u2 && v.uv) {
        u2[i * 2] = v.uv.x
        u2[i * 2 + 1] = v.uv.y
      }
    })
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    if (n2) g.setAttribute('normal', new THREE.BufferAttribute(n2, 3))
    if (u2) g.setAttribute('uv', new THREE.BufferAttribute(u2, 2))
    return g
  }
  return { inside: build(insideTris), outside: build(outsideTris) }
}

// Splits `mesh` (a glass/trim mesh with a door part fused into it) by the door panel's X/Z footprint
// `region`: the door slice is reparented under `hinge` (as a fresh mesh keeping the same material),
// the remainder stays put. Nothing shared is torn because the cut runs through pure glass/trim.
function splitCaptureIntoHinge(mesh: THREE.Mesh, region: THREE.Box3, hinge: THREE.Group) {
  if (!mesh.parent) return
  const { inside, outside } = partitionMeshByWorldBox(mesh, region)
  if (!inside) return
  const captured = new THREE.Mesh(inside, mesh.material)
  captured.position.copy(mesh.position)
  captured.quaternion.copy(mesh.quaternion)
  captured.scale.copy(mesh.scale)
  mesh.parent.add(captured)
  hinge.attach(captured)
  mesh.geometry = outside ?? new THREE.BufferGeometry()
}

function attachToNearestHinge(mesh: THREE.Mesh, hinges: THREE.Group[], hingeX: number[]) {
  const bb = new THREE.Box3().setFromObject(mesh)
  if (bb.isEmpty()) return
  const cx = (bb.min.x + bb.max.x) / 2
  let best = 0
  let bestDist = Infinity
  hingeX.forEach((hx, i) => {
    const d = Math.abs(cx - hx)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  })
  hinges[best]?.attach(mesh)
}

// Detaches the configured node(s) for one openable part from `object`, re-parents each under a
// new hinge group positioned at the node's own bounding-box edge (per pivotZ/pivotY), and adds
// the hinge group back into `object` — so it inherits the same centering/scale/rotation as
// everything else. Using Object3D.attach() (not manual matrix math) to preserve each node's
// world position while reparenting; see .specs/3d-model.spec.md Real GLTF Models section.
function riggPart(object: THREE.Object3D, config: OpenablePartConfig): OpenableRig | null {
  const hinges: THREE.Group[] = []
  const signs: number[] = []
  const centers: THREE.Vector3[] = []
  const sizes: THREE.Vector3[] = []

  // splitLeftRight: config.nodeNames names ONE merged node (e.g. model-1980's "porte_1",
  // which contains both doors' geometry in a single mesh) — split it into two independent,
  // correctly-offset nodes before rigging, then hinge each exactly like a normal 2-node config.
  const nodes: THREE.Object3D[] = []
  if (config.captureRegion && config.splitSourceNodes) {
    // Panel fused into the body shell with no node of its own: triangle-cut it out by a region given
    // as FRACTIONS of the source bbox (build-time frame is native/uncentered — see captureRegion in
    // carModels.ts) and hinge the slice.
    // Region bbox comes from the FIRST splitSourceNodes token only (the shell, e.g. SM_Base) so the
    // fractions stay tied to the door panel's own bounds — even when a second pass (trimNodes, e.g.
    // SM_Interior) cuts a mesh whose own bbox spans the whole cabin. Native units at build time.
    const refToken = config.splitSourceNodes[0]
    const collect = (tokens: string[]) => {
      const arr: THREE.Mesh[] = []
      object.traverse((o) => {
        if (o instanceof THREE.Mesh && tokens.some((t) => o.name.includes(t))) arr.push(o)
      })
      return arr
    }
    const srcBox = new THREE.Box3()
    collect([refToken]).forEach((m) => srcBox.expandByObject(m))
    const srcMin = srcBox.min.clone()
    const srcSize = new THREE.Vector3()
    srcBox.getSize(srcSize)
    // The cut PASSES: the shell (captureRegion) plus an optional tighter pass for inner trim
    // (trimNodes/trimRegion) — the door-card is a thin band that, cut by the SHELL's full sill-to-roof/
    // to-B-pillar region, would drag the internal sill and the B-pillar trim behind the door with it,
    // so it gets its own smaller box. Each pass names its meshes and its region-fractions.
    type Pass = { region: NonNullable<CarModelDef['openableParts']>[number]['captureRegion']; meshes: THREE.Mesh[] }
    const passes: Pass[] = [{ region: config.captureRegion, meshes: collect(config.splitSourceNodes) }]
    if (config.trimNodes && config.trimRegion) {
      let trimMeshes = collect(config.trimNodes)
      // Drop meshes whose material is excluded (e.g. the SEATS, whose bolster overlaps the door box
      // but must NOT swing with the door) — see trimExcludeMaterials in carModels.ts.
      if (config.trimExcludeMaterials?.length) {
        trimMeshes = trimMeshes.filter((m) => {
          const mat = Array.isArray(m.material) ? m.material[0] : m.material
          return !config.trimExcludeMaterials!.some((t) => mat?.name.includes(t))
        })
      }
      passes.push({ region: config.trimRegion, meshes: trimMeshes })
    }
    const sides = config.mirrorX ? [1, -1] : [1]
    sides.forEach((sx) => {
      const group = new THREE.Group()
      group.name = `cut:${config.part}:${sx > 0 ? 'R' : 'L'}`
      object.add(group)
      group.updateMatrixWorld(true)
      let got = false
      passes.forEach(({ region: r, meshes }) => {
        if (!r) return
        // Mirror the +X-authored x-fractions for the left side (x → 1 - x).
        const [fx0, fx1] = sx > 0 ? [r.xMin, r.xMax] : [1 - r.xMax, 1 - r.xMin]
        const box = new THREE.Box3(
          new THREE.Vector3(srcMin.x + fx0 * srcSize.x, srcMin.y + r.yMin * srcSize.y, srcMin.z + r.zMin * srcSize.z),
          new THREE.Vector3(srcMin.x + fx1 * srcSize.x, srcMin.y + r.yMax * srcSize.y, srcMin.z + r.zMax * srcSize.z),
        )
        // Snapshot the source list first: cutting reassigns geometry but never adds/removes meshes.
        meshes.forEach((src) => {
          if (!src.parent) return
          // Clip (not centroid-assign) so the door + the hole get straight cut edges, not serration.
          const { inside, outside } = clipMeshByWorldBox(src, box)
          if (!inside) return
          const slice = new THREE.Mesh(inside, src.material)
          slice.position.copy(src.position)
          slice.quaternion.copy(src.quaternion)
          slice.scale.copy(src.scale)
          src.parent.add(slice)
          group.attach(slice)
          src.geometry = outside ?? new THREE.BufferGeometry()
          got = true
        })
      })
      if (got) nodes.push(group)
      else object.remove(group)
    })
  } else if (config.splitLeftRight) {
    const source = findByName(object, config.nodeNames[0])
    if (source?.parent) {
      const { left, right } = splitNodeByWorldX(source)
      const parent = source.parent
      parent.remove(source)
      parent.add(left)
      parent.add(right)
      nodes.push(left, right)
    }
  } else {
    config.nodeNames.forEach((name) => {
      const node = resolveRigNode(object, name)
      if (node) nodes.push(node)
    })
  }

  // captureNodes: the per-side door-detail meshes (handle, mirror, door seal) named for this model.
  // Snapshot them BEFORE hinging (while still in place); after the hinges are built each is attached
  // to the nearest one so it swings with its door. Matched by name substring.
  const captureMeshes: THREE.Mesh[] = []
  if (config.captureNodes?.length) {
    object.traverse((o) => {
      if (o instanceof THREE.Mesh && config.captureNodes!.some((n) => o.name.includes(n))) captureMeshes.push(o)
    })
  }
  const splitMeshes: THREE.Mesh[] = []
  if (config.captureSplitNodes?.length) {
    object.traverse((o) => {
      if (o instanceof THREE.Mesh && config.captureSplitNodes!.some((n) => o.name.includes(n))) splitMeshes.push(o)
    })
  }

  nodes.forEach((node, i) => {
    if (!node.parent) return

    const box = new THREE.Box3().setFromObject(node)
    const center = new THREE.Vector3()
    box.getCenter(center)
    centers.push(center.clone())
    const nodeSize = new THREE.Vector3()
    box.getSize(nodeSize)
    sizes.push(nodeSize.clone())

    const pivot = new THREE.Vector3(
      center.x,
      edgeValue(box, 'y', config.pivotY),
      edgeValue(box, 'z', config.pivotZ),
    )

    // For a Y-hinged door, "outward" (away from the car's centerline) only equals "positive
    // rotation" when the hinge sits behind the door's own center in Z. All of our door configs
    // hinge at the FRONT edge (pivotZ 'max'), so the door's mass sits BEHIND the hinge (center.z
    // < pivot.z) — swinging it open by just Math.sign(center.x) sends it rotating the door's far
    // edge across the car's centerline and into the cabin instead of outward, confirmed by
    // reading each door's actual open-state world bounding box (both 1968 doors ended up
    // straddling x=0, the opposite side from where they started). The correct sign also depends
    // on which side of the hinge the door's mass sits (sign of center.z - pivot.z), not just
    // which side of the car it's on — see .specs/3d-model.spec.md.
    const dz = center.z - pivot.z
    const autoSide = config.hingeAxis === 'y' ? (Math.sign(dz) || 1) * (Math.sign(center.x) || 1) : 1
    const side = config.openSigns?.[i] ?? autoSide

    const hinge = new THREE.Group()
    hinge.userData.isHinge = true // so the per-part transform editor skips articulated parts
    hinge.position.copy(pivot)
    object.add(hinge)
    // attach() reads object.parent.matrixWorld to correctly compose the node's new
    // hinge-relative local transform — it must still be attached to its original parent when
    // this is called (attach() detaches it internally via add()). Manually detaching first
    // (node.parent.remove(node) before attach()) nulls node.parent, so attach() silently skips
    // that composition step and uses the node's raw pre-parent-chain local matrix instead —
    // fine for shallow nodes, badly wrong for ones whose ancestors (e.g. Body/Root coordinate-
    // conversion nodes) carry non-identity rotations that only cancel out once composed.
    hinge.attach(node)

    hinges.push(hinge)
    signs.push(side)
  })

  // Attach each per-side door detail (handle/mirror/seal) to the nearest door hinge, so it swings
  // with its door — see captureNodes / attachToNearestHinge.
  if ((captureMeshes.length || splitMeshes.length) && hinges.length) {
    const hingeX = centers.map((c) => c.x)
    captureMeshes.forEach((mesh) => attachToNearestHinge(mesh, hinges, hingeX))
    // Fused door parts (door window baked with the quarter glass; the belt-line friso that runs the
    // whole side through both doors and the fenders): triangle-split each named mesh by EVERY door
    // panel's own X/Z footprint (Y grown so the window above the panel is included). Each door takes
    // its own slice — a both-sides mesh like the friso is cut for the left AND right door — and the
    // remainder (quarter glass, fender trim) stays put. Iterating all hinges (not just the nearest)
    // is what lets one shared mesh feed both doors; splitCaptureIntoHinge reduces the mesh to the
    // remaining geometry after each cut, so the passes compose.
    splitMeshes.forEach((mesh) => {
      hinges.forEach((hinge, i) => {
        const c = centers[i]
        const s = sizes[i]
        // The door panel is thin in X (just the skin), but the parts we want sit PROUD of it — the
        // window glass slightly out, the belt-line friso further out still. So the X half-extent is
        // widened by a good fraction of the door's depth to reach them, while staying well shy of
        // the car centre so the other door's side is never grabbed. Y/Z stay tied to the door
        // footprint (Y grown up for the window above the panel).
        const xHalf = s.x / 2 + s.z * 0.35
        const region = new THREE.Box3(
          new THREE.Vector3(c.x - xHalf, c.y - s.y, c.z - s.z / 2 - s.z * 0.1),
          new THREE.Vector3(c.x + xHalf, c.y + s.y, c.z + s.z / 2 + s.z * 0.1),
        )
        splitCaptureIntoHinge(mesh, region, hinge)
      })
    })
  }

  return hinges.length
    ? { part: config.part, axis: config.hingeAxis, angle: config.openAngle, hinges, signs, centers, sizes }
    : null
}

export function RealCarModel({ model }: { model: CarModelDef }) {
  const { scene } = useGLTF(model.path)
  const doorsOpen = useConfigStore((s) => s.doorsOpen)
  const frontTrunkOpen = useConfigStore((s) => s.frontTrunkOpen)
  const engineLidOpen = useConfigStore((s) => s.engineLidOpen)
  const wheelId = useConfigStore((s) => s.wheelId)
  const chassisView = useConfigStore((s) => s.chassisView)

  const { object, rigs, wheelHubs } = useMemo(() => {
    const target = model.nodeName ? findByName(scene, model.nodeName) : scene
    const obj = (target ?? scene).clone(true)
    // `target` (when set — e.g. isolating the "new" car out of fusca-1968.glb's two-cars-in-
    // one-file scene) keeps its own local transform from its ORIGINAL position within the full
    // source scene (for 1968, a (2,0,0) translation) — meaningless now that it's a detached
    // clone used as a standalone root, but left in place it contaminates every descendant's
    // matrixWorld. That contamination happens to cancel out for the car body's own rendering
    // (centering subtracts the same constant it introduces) and looked harmless — but it does
    // NOT cancel out inside riggPart()'s attach() calls, which pick up a *double* dose of it
    // for the hinge specifically (once via `object`'s own matrixWorld, once via the pivot
    // already being computed from a contaminated box) vs. a single dose for the door's normal
    // parent chain — the mismatch sends the door's final local position wildly off (confirmed
    // by an on-screen debug readout: both 1968 doors showed a spurious ~(-2,0,0) local offset
    // matching this exact contamination). Zeroing the clone's own transform removes the problem
    // at its source instead of relying on it to cancel out downstream.
    obj.position.set(0, 0, 0)
    obj.quaternion.identity()
    obj.scale.set(1, 1, 1)
    obj.updateMatrixWorld(true)
    removeWatermarkNodes(obj)

    const riggedParts = (model.openableParts ?? [])
      .map((config) => riggPart(obj, config))
      .filter((rig): rig is OpenableRig => rig !== null)

    // Measured from `obj`'s OWN baked wheel nodes, still in their original position at this
    // point (riggPart() only detaches door/lid nodes, never wheels) — see measureWheelMount().
    const hubs = (model.wheelMounts ?? []).flatMap((config) => measureWheelMount(obj, config))

    return { object: obj, rigs: riggedParts, wheelHubs: hubs }
  }, [scene, model.nodeName, model.openableParts, model.wheelMounts])

  // Centering (X/Z) and ground contact (Y) are derived from the object's own bounding box in
  // its native (pre-scale) units, then applied as a position on the primitive itself — since
  // that position is inside the scaled outer group, it's automatically scaled along with
  // everything else, so this works regardless of the model's native unit scale (some of these
  // models are authored in meters, some in units ~100x larger — verified per-model by logging
  // bounds, not assumed). Only rotationY and scale are manually calibrated per model.
  const { centering, size } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(object)
    const center = new THREE.Vector3()
    box.getCenter(center)
    const boxSize = new THREE.Vector3()
    box.getSize(boxSize)
    return {
      centering: [-center.x, -box.min.y, -center.z] as [number, number, number],
      size: boxSize,
    }
  }, [object])

  // Body-paint colour, used to tint the engine bay so it reads as part of the car (see findBodyColor).
  const bodyColor = useMemo(() => findBodyColor(object), [object])

  // Repaints the body-paint material(s) to match the selected exterior color/finish — see
  // useBodyPaint.ts. `bodyColor` above is computed once per `object` (its useMemo deps don't
  // include the selected color), so the engine bay keeps tracking the model's ORIGINAL authored
  // paint color even after this hook recolors the body — unchanged, on-purpose behavior per
  // .specs/3d-model.spec.md's engine-bay section.
  useBodyPaint(object, model)

  // Per-part editor: discover this model's parts (grouped per model — see carParts.ts), publish them
  // for the "Peças" panel, and apply the saved per-part overrides (hide / recolor).
  const partGroupBy = model.partGroupBy ?? 'node'
  const setDiscoveredParts = usePartsStore((s) => s.setDiscoveredParts)
  const extraParts = usePartsStore((s) => s.extraParts)
  useEffect(() => {
    setDiscoveredParts(discoverParts(object, partGroupBy))
  }, [object, partGroupBy, setDiscoveredParts])
  usePartOverrides(object, model, partGroupBy)

  // Imperative rotation update on the already-built hinge groups — avoids re-cloning/re-rigging
  // the whole model every time a door/trunk/engine-lid toggle changes.
  useEffect(() => {
    for (const rig of rigs) {
      const isOpen = rig.part === 'doors' ? doorsOpen : rig.part === 'frontTrunk' ? frontTrunkOpen : engineLidOpen
      rig.hinges.forEach((hinge, i) => {
        const angle = isOpen ? rig.angle * rig.signs[i] : 0
        if (rig.axis === 'y') hinge.rotation.y = angle
        else hinge.rotation.x = angle
      })
    }
  }, [rigs, doorsOpen, frontTrunkOpen, engineLidOpen])

  // Hide the dark inner-shell panel(s) that occlude the engine while the lid is open, restore on
  // close (see engineBayHideNodes in carModels.ts). Kept separate from the hinge effect so it only
  // re-runs on engineLidOpen changes.
  useEffect(() => {
    const names = model.engineBayHideNodes
    if (!names?.length) return
    const nodes = names.map((n) => findByName(object, n)).filter((n): n is THREE.Object3D => !!n)
    nodes.forEach((n) => (n.visible = !engineLidOpen))
    return () => nodes.forEach((n) => (n.visible = true))
  }, [object, model.engineBayHideNodes, engineLidOpen])

  // Hide the baked wheels for good on models with a configured wheelMounts (see carModels.ts) —
  // unlike the engine bay hide above, this isn't conditional on any toggle: the replacement
  // RealWheel instances below always take their place, so the baked ones must always stay hidden
  // while this model is mounted. Restored on unmount/config change (same cleanup pattern as
  // above) even though in practice RealCarModel is always remounted (key={model.key} in
  // CarModel.tsx) before this would matter, for the same defensive-cleanup reason as elsewhere.
  useEffect(() => {
    const names = model.wheelMounts?.map((m) => m.nodeName)
    if (!names?.length) return
    const nodes = names.map((n) => findByName(object, n)).filter((n): n is THREE.Object3D => !!n)
    nodes.forEach((n) => (n.visible = false))
    return () => nodes.forEach((n) => (n.visible = true))
  }, [object, model.wheelMounts])

  const { rotationY, scale } = model.calibration

  // Model calibration overrides from the editor (see partsStore): scaleMul multiplies the whole
  // car's scale uniformly (so it matches the gabarito), rotationYDeg adds to its heading. Only the
  // OUTER group uses these — all inner sizing keeps dividing by the BASE `scale`, so engine/wheels/
  // parts scale together with the body, staying in proportion.
  const calib = usePartsStore((s) => s.modelCalib[model.key])
  const effScale = scale * (calib?.scaleMul ?? 1)
  const effRotationY = rotationY + THREE.MathUtils.degToRad(calib?.rotationYDeg ?? 0)

  // Only models with a configured engineLid part get an engine — showing one for models
  // without a working engine lid would float an engine visibly through solid closed bodywork.
  const engineLidRig = rigs.find((rig) => rig.part === 'engineLid')

  // Real wheel swap: which of the 3 real wheel models (see wheelModels.ts) stands in for the
  // currently-selected wheelOptions entry, only rendered for models with measured hub positions
  // (wheelHubs is empty when the model has no wheelMounts configured — its wheels aren't
  // separable from the body, see carModels.ts — so it silently stays on its baked wheels).
  const wheelOption = wheelOptions.find((w) => w.id === wheelId) ?? wheelOptions[0]
  const wheelModel = realWheelModels[wheelOptionModel[wheelOption.id] ?? 'retro']

  // One diameter for all four wheels: the SMALLEST measured hub diameter. Each hub's diameter comes
  // from its baked wheel node's AABB, which OVER-estimates the true tire whenever that node bundles
  // the (often rotated) brake/knuckle assembly — badly so on model-1968, whose four wheels measured
  // 0.71–0.88 and would otherwise render visibly oversized AND mismatched left/right. A tire is one
  // size on all four corners, and an axis-aligned box can only be ≥ the true tire, so the tightest
  // (minimum) box is the least rotation-corrupted estimate. Leaves model-1980 unchanged (its four
  // measure equal). Hub POSITIONS stay per-wheel (measured centres); only the diameter is unified.
  const wheelDiameter = wheelHubs.length ? Math.min(...wheelHubs.map((h) => h.diameter)) : 0

  // Chassi montável: substitui o corpo fixo pela plataforma (assoalhos, túnel, chapéu de napoleão,
  // travessas) — ver Chassis.tsx. Só o model-1980 (que representa o 1973) tem chassi calibrado por
  // enquanto; os demais ignoram o modo. As rodas reais continuam, virando um chassi rolante.
  const chassisActive = chassisView !== 'off' && model.key === 'model-1980'

  return (
    <group rotation={[0, effRotationY, 0]} scale={effScale}>
      <primitive object={object} position={centering} visible={!chassisActive} />
      {chassisActive && <Chassis scale={scale} exploded={chassisView === 'exploded'} />}
      {!chassisActive &&
        engineLidRig &&
        engineLidOpen &&
        (() => {
          // X is centred on the lid; Z is INSET forward from the car's rear boundary by a fixed
          // real-world distance rather than sitting at the lid itself. The lid marks the tail, and
          // the tail shell curves inward there, so a block placed at the lid pokes out through the
          // sloped bodywork — the inset keeps the whole block inside the chassis on every model.
          // rearSign picks which Z end is the rear from where the lid sits.
          const rearSign = Math.sign(engineLidRig.centers[0].z + centering[2]) || -1
          const engineX = engineLidRig.centers[0].x + centering[0]
          const engineZ = rearSign * (size.z / 2 - ENGINE_REAR_INSET_M / scale)

          // The engine bay fills the LID OPENING (the lid's own footprint = the hole it covers),
          // derived per model rather than with one-size constants — the 1968's opening is far larger
          // than the 1980's. Centred in X/Z on the opening; the engine is inset forward of it toward
          // the cabin, so the firewall sits at the cabin edge of the opening and the open tail edge
          // faces the rear viewer. All values here are group-local units (lid size/center already
          // are), so no /scale. BAY_FIT keeps walls just inside the opening rim.
          const BAY_FIT = 0.94
          const lidCenterZ = engineLidRig.centers[0].z + centering[2]
          const bayWidth = engineLidRig.sizes[0].x * BAY_FIT
          const bayDepth = engineLidRig.sizes[0].z * BAY_FIT
          // Floor spans between the engine (forward) and the tail opening; centre the tub so its
          // firewall lands just forward of the engine and its open tail edge reaches the opening.
          const bayCenterZ = (engineZ + lidCenterZ) / 2
          return (
            <>
              {/* Bay first: opaque tub that hides the dark hollow interior, sized to the lid opening. */}
              <EngineBay
                position={[engineX, (ENGINE_FLOOR_HEIGHT_M - ENGINE_BAY_FLOOR_DROP_M) / scale, bayCenterZ]}
                size={[bayWidth, ENGINE_BAY_HEIGHT_M / scale, bayDepth]}
                firewallHeight={ENGINE_BAY_FIREWALL_HEIGHT_M / scale}
                color={bodyColor}
              />
              <EngineBlock
                position={[engineX, ENGINE_FLOOR_HEIGHT_M / scale, engineZ]}
                scale={ENGINE_REAL_SCALE / scale}
              />
            </>
          )
        })()}
      {!chassisActive && model.cabinFloor && (
        // Caps the hollow cabin so an open door doesn't reveal the dark void (see CabinFloor.tsx).
        // Config is in metres/world-centered; divide by scale for this scaled group's local frame.
        <CabinFloor
          position={[0, model.cabinFloor.y / scale, (model.cabinFloor.zMin + model.cabinFloor.zMax) / 2 / scale]}
          size={[
            (model.cabinFloor.halfWidth * 2) / scale,
            0.04 / scale,
            (model.cabinFloor.zMax - model.cabinFloor.zMin) / scale,
          ]}
        />
      )}
      {!chassisActive && model.hasInterior === false && (
        // The host body box in this group's local space: `object` is drawn at `centering`, which
        // puts its box X/Z-centered on 0 and grounded at Y=0. So min = (-size.x/2, 0, -size.z/2).
        // RealInterior maps 1968's own interior-to-body relationship onto this box — see there.
        <RealInterior
          hostBoxMin={[-size.x / 2, 0, -size.z / 2]}
          hostBoxSize={[size.x, size.y, size.z]}
          flipZ={model.interiorFlipZ}
          scaleMul={model.interiorScale}
        />
      )}
      {wheelHubs.map((hub, i) => {
        // hub.position is object-local (pre-`centering`), same convention as engineX/engineZ above —
        // add `centering` to land it in this group's frame. Renders the real TEXTURED wheel .glb
        // (wheelModels maps every option to the tyred/textured asset) scaled to the measured baked
        // diameter, so wheels keep their texture and stay a consistent size across models.
        const worldX = hub.position.x + centering[0]
        const isRightSide = worldX >= 0
        const rotationY = wheelModel.axleRealignYaw + (isRightSide ? 0 : Math.PI)
        return (
          <RealWheel
            key={i}
            path={wheelModel.path}
            position={[worldX, hub.position.y + centering[1], hub.position.z + centering[2]]}
            rotation={[0, rotationY, 0]}
            diameter={wheelDiameter}
            tint={wheelOption.rimColor}
          />
        )
      })}
      {extraParts
        .filter((p) => p.modelKey === model.key)
        .map((p) => (
          <ExtraPart key={p.id} data={p} baseScale={scale} />
        ))}
    </group>
  )
}

// Preload the real models so switching between presets doesn't show a blank frame while fetching.
useGLTF.preload('/models/fusca-1948.glb')
useGLTF.preload('/models/fusca-1968.glb')
useGLTF.preload('/models/fusca-1980.glb')
useGLTF.preload('/models/fusca-1973.glb')
