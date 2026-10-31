import { useEffect } from 'react'
import type { Rig } from '../../core/contracts/built'
import type { OpenGroupId } from '../../core/ontology'

/**
 * Articulation system — drives the already-built hinges from the open-group toggles. Imperative
 * rotation only: never re-builds the vehicle on a toggle. Brain: brain/algorithms/articulate-hinge.md.
 */
export function useArticulation(rigs: Rig[], open: Record<OpenGroupId, boolean>) {
  useEffect(() => {
    for (const rig of rigs) {
      const isOpen = open[rig.group]
      rig.hinges.forEach((hinge, i) => {
        const angle = isOpen ? rig.angle * rig.signs[i] : 0
        if (rig.axis === 'y') hinge.rotation.y = angle
        else hinge.rotation.x = angle
      })
    }
  }, [rigs, open])
}
