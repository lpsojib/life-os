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

/* =========================================================
   OPEN DATABASE
   ========================================================= */

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

  dbPromise = new Promise<IDBDatabase>(
    (resolve, reject) => {
      const request = indexedDB.open(
        DB_NAME,
        DB_VERSION
      );

      request.onerror = () => {
        dbPromise = null;

        console.error(
          "IndexedDB open error:",
          request.error
        );

        reject(
          request.error ??
            new Error(
              "Failed to open IndexedDB."
            )
        );
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

      request.onsuccess = () => {
        const db = request.result;

        db.onclose = () => {
          dbPromise = null;
        };

        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };

        resolve(db);
      };

      request.onblocked = () => {
        console.warn(
          "IndexedDB upgrade is blocked. Close other Life OS tabs."
        );
      };
    }
  );

  return dbPromise;
}

/* =========================================================
   SAVE ONE RECORD
   ========================================================= */

export async function saveOfflineData(
  record: OfflineRecord
): Promise<void> {
  const db = await openDatabase();

  return new Promise<void>(
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

/* =========================================================
   SAVE MANY RECORDS
   ---------------------------------------------------------
   Used when Firebase returns many records.
   Much faster than opening a transaction for every item.
   ========================================================= */

export async function saveOfflineDataBatch(
  records: OfflineRecord[]
): Promise<void> {
  if (records.length === 0) {
    return;
  }

  const db = await openDatabase();

  return new Promise<void>(
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
        store.put(record);
      }

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(
          transaction.error ??
            new Error(
              "Failed to save offline data batch."
            )
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ??
            new Error(
              "Offline data batch transaction aborted."
            )
        );
      };
    }
  );
}

/* =========================================================
   GET ONE RECORD
   ========================================================= */

export async function getOfflineData(
  id: string
): Promise<OfflineRecord | null> {
  const db = await openDatabase();

  return new Promise<OfflineRecord | null>(
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
          request.result ??
            null
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

/* =========================================================
   GET COLLECTION
   ========================================================= */

export async function getOfflineCollection(
  collection: string
): Promise<OfflineRecord[]> {
  const db = await openDatabase();

  return new Promise<OfflineRecord[]>(
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
        const records =
          request.result ?? [];

        /**
         * Keep newest local version first.
         *
         * This is useful when multiple
         * local records exist.
         */
        records.sort(
          (a, b) =>
            b.updatedAt -
            a.updatedAt
        );

        resolve(records);
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

/* =========================================================
   GET ALL PENDING DATA
   ========================================================= */

export async function getPendingOfflineData(): Promise<
  OfflineRecord[]
> {
  const db = await openDatabase();

  return new Promise<OfflineRecord[]>(
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
        const records =
          request.result ?? [];

        /**
         * Oldest changes first.
         * This keeps sync order predictable.
         */
        records.sort(
          (a, b) =>
            a.updatedAt -
            b.updatedAt
        );

        resolve(records);
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

/* =========================================================
   DELETE ONE RECORD
   ========================================================= */

export async function deleteOfflineData(
  id: string
): Promise<void> {
  const db = await openDatabase();

  return new Promise<void>(
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

/* =========================================================
   MARK AS SYNCED
   ========================================================= */

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

/* =========================================================
   CLEAR ONE COLLECTION
   ========================================================= */

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

  return new Promise<void>(
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

      transaction.onabort = () => {
        reject(
          transaction.error ??
            new Error(
              "Clear offline collection transaction aborted."
            )
        );
      };
    }
  );
}

/* =========================================================
   CLEAR USER'S OFFLINE DATA
   ---------------------------------------------------------
   IMPORTANT:
   This only removes local IndexedDB cache.
   It does NOT delete Firebase data.
   ========================================================= */

export async function clearOfflineUserData(
  uid: string
): Promise<void> {
  const db = await openDatabase();

  return new Promise<void>(
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

      const request =
        store.openCursor();

      request.onsuccess = () => {
        const cursor =
          request.result;

        if (!cursor) {
          return;
        }

        const record =
          cursor.value as OfflineRecord;

        /**
         * User-specific collections normally
         * use the UID in their collection name.
         *
         * Example:
         * tasks:USER_UID
         * habits:USER_UID
         * goals:USER_UID
         */
        if (
          record.collection.endsWith(
            `:${uid}`
          )
        ) {
          cursor.delete();
        }

        cursor.continue();
      };

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              "Failed to clear user offline data."
            )
        );
      };

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(
          transaction.error ??
            new Error(
              "Failed to clear user offline data transaction."
            )
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ??
            new Error(
              "Clear user offline data transaction aborted."
            )
        );
      };
    }
  );
}