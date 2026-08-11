const DB_NAME = "life-os-offline";
const DB_VERSION = 1;

const STORE_NAME = "data";

export interface OfflineRecord {
  id: string;
  collection: string;
  data: unknown;
  updatedAt: number;
  syncStatus: "pending" | "synced";
}

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open IndexedDB
 */
function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error(
        "IndexedDB is only available in the browser."
      )
    );
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };

    request.onsuccess = () => {
      const db = request.result;

      /**
       * If the browser closes the database,
       * allow it to be opened again.
       */
      db.onclose = () => {
        dbPromise = null;
      };

      resolve(db);
    };

    request.onupgradeneeded = () => {
      const db = request.result;

      if (
        !db.objectStoreNames.contains(
          STORE_NAME
        )
      ) {
        const store =
          db.createObjectStore(
            STORE_NAME,
            {
              keyPath: "id",
            }
          );

        store.createIndex(
          "collection",
          "collection",
          {
            unique: false,
          }
        );

        store.createIndex(
          "syncStatus",
          "syncStatus",
          {
            unique: false,
          }
        );
      }
    };
  });

  return dbPromise;
}

/**
 * Save or update local data.
 */
export async function saveOfflineData(
  record: OfflineRecord
): Promise<void> {
  const db = await openDatabase();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORE_NAME,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          STORE_NAME
        );

      store.put(record);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    }
  );
}

/**
 * Get one local record.
 */
export async function getOfflineData(
  id: string
): Promise<OfflineRecord | null> {
  const db = await openDatabase();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORE_NAME,
          "readonly"
        );

      const store =
        transaction.objectStore(
          STORE_NAME
        );

      const request =
        store.get(id);

      request.onsuccess = () => {
        resolve(
          request.result ?? null
        );
      };

      request.onerror = () => {
        reject(request.error);
      };
    }
  );
}

/**
 * Get all records from one collection.
 *
 * Includes both:
 * - synced data
 * - pending data
 */
export async function getOfflineCollection(
  collection: string
): Promise<OfflineRecord[]> {
  const db = await openDatabase();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORE_NAME,
          "readonly"
        );

      const store =
        transaction.objectStore(
          STORE_NAME
        );

      const index =
        store.index("collection");

      const request =
        index.getAll(collection);

      request.onsuccess = () => {
        resolve(
          request.result ?? []
        );
      };

      request.onerror = () => {
        reject(request.error);
      };
    }
  );
}

/**
 * Get records waiting for Firebase sync.
 */
export async function getPendingOfflineData(): Promise<
  OfflineRecord[]
> {
  const db = await openDatabase();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORE_NAME,
          "readonly"
        );

      const store =
        transaction.objectStore(
          STORE_NAME
        );

      const index =
        store.index("syncStatus");

      const request =
        index.getAll("pending");

      request.onsuccess = () => {
        resolve(
          request.result ?? []
        );
      };

      request.onerror = () => {
        reject(request.error);
      };
    }
  );
}

/**
 * Delete local data.
 */
export async function deleteOfflineData(
  id: string
): Promise<void> {
  const db = await openDatabase();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        db.transaction(
          STORE_NAME,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          STORE_NAME
        );

      store.delete(id);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    }
  );
}

/**
 * Mark local data as synced.
 */
export async function markOfflineDataSynced(
  id: string
): Promise<void> {
  const record =
    await getOfflineData(id);

  if (!record) {
    return;
  }

  await saveOfflineData({
    ...record,
    syncStatus: "synced",
    updatedAt: Date.now(),
  });
}