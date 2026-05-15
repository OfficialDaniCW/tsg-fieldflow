// IndexedDB wrapper for offline job storage

const DB_NAME = 'tsg-offline';
const DB_VERSION = 1;
const STORE_PENDING = 'pending_jobs';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_PENDING)) {
        const store = db.createObjectStore(STORE_PENDING, { keyPath: 'offline_id' });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePendingJob(job) {
  const db = await openDB();
  const offline_id = `offline_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const record = { ...job, offline_id, created_at: new Date().toISOString(), synced: false };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, 'readwrite');
    tx.objectStore(STORE_PENDING).put(record);
    tx.oncomplete = () => resolve(offline_id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingJobs() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, 'readonly');
    const req = tx.objectStore(STORE_PENDING).getAll();
    req.onsuccess = () => resolve(req.result.filter(j => !j.synced));
    req.onerror = () => reject(req.error);
  });
}

export async function markJobSynced(offline_id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, 'readwrite');
    const store = tx.objectStore(STORE_PENDING);
    const req = store.get(offline_id);
    req.onsuccess = () => {
      const record = req.result;
      if (record) {
        record.synced = true;
        store.put(record);
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => resolve();
  });
}

export async function deletePendingJob(offline_id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PENDING, 'readwrite');
    tx.objectStore(STORE_PENDING).delete(offline_id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingCount() {
  const jobs = await getPendingJobs();
  return jobs.length;
}