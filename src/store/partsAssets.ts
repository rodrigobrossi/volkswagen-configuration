/**
 * Guarda os arquivos GLTF/GLB de peças ADICIONADAS pelo usuário no IndexedDB (o app não tem backend
 * — ver SDD). Só o BLOB fica aqui, referenciado por id; os metadados (modelo, transformação) ficam
 * no partsStore/localStorage. Ver ExtraPart.tsx / PartsPanel.tsx.
 */
const DB_NAME = 'fusca-part-assets'
const STORE = 'glb'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function putAsset(id: string, blob: Blob): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

/** Retorna um object URL para o blob (o chamador deve revogar quando descartar). Null se não existir. */
export async function getAssetURL(id: string): Promise<string | null> {
  const db = await openDB()
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(id)
    req.onsuccess = () => resolve(req.result as Blob | undefined)
    req.onerror = () => reject(req.error)
  })
  db.close()
  return blob ? URL.createObjectURL(blob) : null
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}
