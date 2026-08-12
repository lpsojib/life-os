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

    /**
     * Database open error
     */
    request.onerror = () => {
      dbPromise = null;

      console.error(
        "IndexedDB open error:",
        request.error
      );

      reject(
        request.error ??
          new Error("Failed to open IndexedDB.")
      );
    };

    /**
     * Database opened successfully
     */
    request.onsuccess = () => {
      const db = request.result;

      /**
       * If database connection closes,
       * allow it to be opened again.
       */
      db.onclose = () => {
        dbPromise = null;
      };

      /**
       * If database version changes
       * or another tab blocks the upgrade.
       */
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };

      resolve(db);
    };

    /**
     * Create database/store
     */
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

        /**
         * Collection index
         */
        store.createIndex(
          "collection",
          "collection",
          {
            unique: false,
          }
        );

        /**
         * Sync status index
         */
        store.createIndex(
          "syncStatus",
          "syncStatus",
          {
            unique: false,
          }
        );
      }
    };

    /**
     * Upgrade blocked
     */
    request.onblocked = () => {
      console.warn(
        "IndexedDB upgrade is blocked. Close other tabs using Life OS."
      );
    };
  });

  return dbPromise;
}

/**
 * Save or update local data.
 *
 * Used for:
 * - offline task creation
 * - offline task update
 * - offline task delete
 * - synced local data
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
        reject(
          transaction.error ??
            new Error(
              "Failed to save offline data."
            )
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ??
            new Error(
              "Offline data transaction aborted."
            )
        );
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
        reject(
          request.error ??
            new Error(
              "Failed to get offline data."
            )
        );
      };
    }
  );
}

/**
 * Get all records from one collection.
 *
 * Includes:
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
        reject(
          request.error ??
            new Error(
              "Failed to get offline collection."
            )
        );
      };
    }
  );
}

/**
 * Get all records waiting
 * for Firebase synchronization.
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
        reject(
          request.error ??
            new Error(
              "Failed to get pending offline data."
            )
        );
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
        reject(
          transaction.error ??
            new Error(
              "Failed to delete offline data."
            )
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ??
            new Error(
              "Delete transaction aborted."
            )
        );
      };
    }
  );
}

/**
 * Mark local data as synced.
 *
 * The record remains in IndexedDB so the app
 * can continue displaying data while offline.
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

/**
 * Clear all records from a collection.
 *
 * Useful when we need to reset local
 * cached data for a specific user.
 */
export async function clearOfflineCollection(
  collection: string
): Promise<void> {
  const records =
    await getOfflineCollection(
      collection
    );

  if (records.length === 0) {
    return;
  }

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

      for (const record of records) {
        store.delete(record.id);
      }

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(
          transaction.error ??
            new Error(
              "Failed to clear offline collection."
            )
        );
      };
    }
  );
}