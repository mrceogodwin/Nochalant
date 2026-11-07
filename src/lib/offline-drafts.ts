const DB_NAME = "nochalant-device";
const STORE_NAME = "drafts";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("Device storage is unavailable."));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open device storage."));
  });
}
export type OfflineDraft = { id: string; kind: "post" | "message" | "comment"; body: string; createdAt: number; syncState: "queued" };
export async function saveOfflineDraft(draft: OfflineDraft): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(draft);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Could not save draft."));
  });
  db.close();
}
export async function listOfflineDrafts(): Promise<OfflineDraft[]> {
  const db = await openDatabase();
  const rows = await new Promise<OfflineDraft[]>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as OfflineDraft[]);
    request.onerror = () => reject(request.error || new Error("Could not read drafts."));
  });
  db.close();
  return rows.sort((a, b) => b.createdAt - a.createdAt);
}
export async function deleteOfflineDraft(id: string): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Could not remove draft."));
  });
  db.close();
}
