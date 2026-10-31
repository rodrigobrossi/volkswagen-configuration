import { useEffect } from 'react'
import type * as THREE from 'three'
import { findByName } from '../../core/geometry/scene'

/**
 * Visibility rule system — hides the named nodes while `hidden` is true and restores them after
 * (baked wheels replaced by swapped ones; inner shells that occlude the open engine bay).
 */
export function useNodeVisibility(object: THREE.Object3D, names: string[] | undefined, hidden: boolean) {
  const key = names?.join('|') ?? ''
  useEffect(() => {
    if (!key) return
    const nodes = key
      .split('|')
      .map((n) => findByName(object, n))
      .filter((n): n is THREE.Object3D => !!n)
    nodes.forEach((n) => (n.visible = !hidden))
    return () => nodes.forEach((n) => (n.visible = true))
  }, [object, key, hidden])
}
