"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import {
  Note,
  NoteType,
} from "../types/notebook.types";

/* ================================================= */
/* CONFIG */
/* ================================================= */

const DB_NAME = "life-os-offline";
const DB_VERSION = 1;
const STORE_NAME = "data";

const NOTE_COLLECTION = "notebook";

/* ================================================= */
/* TYPES */
/* ================================================= */

interface OfflineNoteData {
  userId: string;
  note?: Note;
  operation: "upsert" | "delete";
}

interface OfflineRecord {
  id: string;
  collection: string;
  data: OfflineNoteData;
  updatedAt: number;
  syncStatus: "pending" | "synced";
}

/* ================================================= */
/* FIREBASE COLLECTION */
/* ================================================= */

function getNotesCollection() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not authenticated.",
    );
  }

  return collection(
    db,
    "users",
    user.uid,
    "notes",
  );
}

/* ================================================= */
/* INDEXED DB */
/* ================================================= */

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise(
    (resolve, reject) => {
      if (
        typeof window ===
        "undefined"
      ) {
        reject(
          new Error(
            "IndexedDB is only available in the browser.",
          ),
        );

        return;
      }

      const request =
        indexedDB.open(
          DB_NAME,
          DB_VERSION,
        );

      request.onupgradeneeded = () => {
        const database =
          request.result;

        if (
          !database.objectStoreNames.contains(
            STORE_NAME,
          )
        ) {
          database.createObjectStore(
            STORE_NAME,
            {
              keyPath: "id",
            },
          );
        }
      };

      request.onsuccess = () => {
        resolve(
          request.result,
        );
      };

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              "Failed to open offline database.",
            ),
        );
      };
    },
  );
}

/* ================================================= */
/* GET OFFLINE RECORDS */
/* ================================================= */

async function getOfflineRecords(): Promise<
  OfflineRecord[]
> {
  const database =
    await openOfflineDB();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          STORE_NAME,
          "readonly",
        );

      const store =
        transaction.objectStore(
          STORE_NAME,
        );

      const request =
        store.getAll();

      request.onsuccess = () => {
        const records =
          (request.result ??
            []) as OfflineRecord[];

        resolve(
          records.filter(
            (record) =>
              record.collection ===
              NOTE_COLLECTION,
          ),
        );
      };

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              "Failed to read offline notes.",
            ),
        );
      };
    },
  );
}

/* ================================================= */
/* SAVE OFFLINE RECORD */
/* ================================================= */

async function saveOfflineRecord(
  record: OfflineRecord,
): Promise<void> {
  const database =
    await openOfflineDB();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          STORE_NAME,
          "readwrite",
        );

      const store =
        transaction.objectStore(
          STORE_NAME,
        );

      store.put(record);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(
          transaction.error ??
            new Error(
              "Failed to save offline record.",
            ),
        );
      };
    },
  );
}

/* ================================================= */
/* DELETE OFFLINE RECORD */
/* ================================================= */

async function deleteOfflineRecord(
  id: string,
): Promise<void> {
  const database =
    await openOfflineDB();

  return new Promise(
    (resolve, reject) => {
      const transaction =
        database.transaction(
          STORE_NAME,
          "readwrite",
        );

      const store =
        transaction.objectStore(
          STORE_NAME,
        );

      store.delete(id);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(
          transaction.error ??
            new Error(
              "Failed to delete offline record.",
            ),
        );
      };
    },
  );
}

/* ================================================= */
/* OFFLINE NOTE ID */
/* ================================================= */

function getOfflineNoteId(
  userId: string,
  noteId: string,
): string {
  return `notebook:${userId}:${noteId}`;
}

/* ================================================= */
/* TIMESTAMP */
/* ================================================= */

function timestampToISOString(
  timestamp: unknown,
): string {
  if (
    timestamp &&
    typeof timestamp ===
      "object" &&
    "toDate" in timestamp &&
    typeof (
      timestamp as {
        toDate?: unknown;
      }
    ).toDate === "function"
  ) {
    return (
      timestamp as {
        toDate: () => Date;
      }
    )
      .toDate()
      .toISOString();
  }

  if (
    typeof timestamp ===
    "string"
  ) {
    return timestamp;
  }

  return new Date().toISOString();
}

/* ================================================= */
/* NORMALIZE NOTE */
/* ================================================= */

function normalizeNote(
  note: Note,
): Note {
  return {
    ...note,

    id: note.id,

    title:
      note.title?.trim() ||
      "Untitled Note",

    content:
      note.content ?? "",

    blocks:
      note.blocks ?? [],

    checklist:
      note.checklist ?? [],

    pinned:
      Boolean(note.pinned),

    type:
      note.type ?? "text",

    createdAt:
      note.createdAt ||
      new Date().toISOString(),

    updatedAt:
      note.updatedAt ||
      new Date().toISOString(),
  };
}

/* ================================================= */
/* SAVE LOCAL NOTE */
/* ================================================= */

async function saveLocalNote(
  note: Note,
  syncStatus:
    | "pending"
    | "synced" = "pending",
): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not authenticated.",
    );
  }

  const normalized =
    normalizeNote(note);

  await saveOfflineRecord({
    id: getOfflineNoteId(
      user.uid,
      normalized.id,
    ),

    collection:
      NOTE_COLLECTION,

    data: {
      userId: user.uid,

      note: normalized,

      operation: "upsert",
    },

    updatedAt: Date.now(),

    syncStatus,
  });
}

/* ================================================= */
/* SAVE LOCAL DELETE */
/* ================================================= */

async function saveLocalDelete(
  noteId: string,
): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not authenticated.",
    );
  }

  await saveOfflineRecord({
    id: getOfflineNoteId(
      user.uid,
      noteId,
    ),

    collection:
      NOTE_COLLECTION,

    data: {
      userId: user.uid,

      note: {
        id: noteId,
      } as Note,

      operation: "delete",
    },

    updatedAt: Date.now(),

    syncStatus: "pending",
  });
}

/* ================================================= */
/* GET LOCAL NOTES */
/* ================================================= */

async function getLocalNotes(): Promise<
  Note[]
> {
  const user = auth.currentUser;

  if (!user) {
    return [];
  }

  const records =
    await getOfflineRecords();

  const notes: Note[] = [];

  for (const record of records) {
    const data =
      record.data;

    if (
      data.userId !==
      user.uid
    ) {
      continue;
    }

    if (
      data.operation ===
      "delete"
    ) {
      continue;
    }

    if (!data.note) {
      continue;
    }

    notes.push(
      normalizeNote(
        data.note,
      ),
    );
  }

  return notes.sort(
    (a, b) =>
      new Date(
        b.updatedAt,
      ).getTime() -
      new Date(
        a.updatedAt,
      ).getTime(),
  );
}

/* ================================================= */
/* GET LOCAL NOTE */
/* ================================================= */

async function getLocalNote(
  noteId: string,
): Promise<Note | null> {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  const records =
    await getOfflineRecords();

  const record =
    records.find(
      (item) =>
        item.id ===
        getOfflineNoteId(
          user.uid,
          noteId,
        ),
    );

  if (!record) {
    return null;
  }

  if (
    record.data.operation ===
    "delete"
  ) {
    return null;
  }

  if (!record.data.note) {
    return null;
  }

  return normalizeNote(
    record.data.note,
  );
}

/* ================================================= */
/* SYNC ONE NOTE */
/* ================================================= */

async function syncNote(
  record: OfflineRecord,
): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    return;
  }

  const data =
    record.data;

  if (
    data.userId !==
    user.uid
  ) {
    return;
  }

  /* ------------------------------------------------ */
  /* DELETE */
  /* ------------------------------------------------ */

  if (
    data.operation ===
    "delete"
  ) {
    const noteId =
      data.note?.id;

    if (!noteId) {
      await deleteOfflineRecord(
        record.id,
      );

      return;
    }

    const noteRef =
      doc(
        db,
        "users",
        user.uid,
        "notes",
        noteId,
      );

    await deleteDoc(
      noteRef,
    );

    await deleteOfflineRecord(
      record.id,
    );

    return;
  }

  /* ------------------------------------------------ */
  /* UPSERT */
  /* ------------------------------------------------ */

  if (!data.note) {
    await deleteOfflineRecord(
      record.id,
    );

    return;
  }

  const note =
    normalizeNote(
      data.note,
    );

  const noteRef =
    doc(
      db,
      "users",
      user.uid,
      "notes",
      note.id,
    );

  await setDoc(
    noteRef,
    {
      title:
        note.title,

      type:
        note.type,

      content:
        note.content,

      blocks:
        note.blocks,

      checklist:
        note.checklist,

      pinned:
        note.pinned,

      createdAt:
        note.createdAt
          ? new Date(
              note.createdAt,
            )
          : serverTimestamp(),

      updatedAt:
        serverTimestamp(),
    },
    {
      merge: true,
    },
  );

  /*
   * Keep the local record as synced.
   */
  await saveOfflineRecord({
    ...record,

    syncStatus:
      "synced",
  });
}

/* ================================================= */
/* SYNC PENDING NOTES */
/* ================================================= */

export async function syncPendingNotes(): Promise<void> {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  if (!navigator.onLine) {
    return;
  }

  const user =
    auth.currentUser;

  if (!user) {
    return;
  }

  const records =
    await getOfflineRecords();

  const pending =
    records
      .filter(
        (record) =>
          record.collection ===
            NOTE_COLLECTION &&
          record.syncStatus ===
            "pending" &&
          record.data.userId ===
            user.uid,
      )
      .sort(
        (a, b) =>
          a.updatedAt -
          b.updatedAt,
      );

  for (
    const record of pending
  ) {
    try {
      await syncNote(
        record,
      );
    } catch (error) {
      console.error(
        "Note sync failed:",
        error,
      );
    }
  }
}

/* ================================================= */
/* GET NOTES */
/* ================================================= */

export async function getNotes(): Promise<
  Note[]
> {
  const user =
    auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not authenticated.",
    );
  }

  /*
   * First get local notes.
   */
  const localNotes =
    await getLocalNotes();

  /*
   * Offline:
   * immediately return local data.
   */
  if (
    typeof navigator ===
      "undefined" ||
    !navigator.onLine
  ) {
    return localNotes;
  }

  try {
    /*
     * Sync pending local changes first.
     */
    await syncPendingNotes();

    /*
     * Get Firebase notes.
     */
    const notesRef =
      getNotesCollection();

    const q =
      query(
        notesRef,
        orderBy(
          "updatedAt",
          "desc",
        ),
      );

    const snapshot =
      await getDocs(q);

    const firebaseNotes =
      snapshot.docs.map(
        (noteDoc) => {
          const data =
            noteDoc.data();

          return normalizeNote({
            id:
              noteDoc.id,

            title:
              data.title ?? "",

            type:
              (data.type ??
                "text") as NoteType,

            content:
              data.content ??
              "",

            blocks:
              data.blocks ??
              [],

            checklist:
              data.checklist ??
              [],

            pinned:
              Boolean(
                data.pinned,
              ),

            createdAt:
              timestampToISOString(
                data.createdAt,
              ),

            updatedAt:
              timestampToISOString(
                data.updatedAt,
              ),
          });
        },
      );

    /*
     * Get local records again after
     * Firebase sync.
     */
    const latestLocal =
      await getOfflineRecords();

    /*
     * Save Firebase notes locally only
     * when there is no pending local edit.
     */
    for (
      const firebaseNote of
        firebaseNotes
    ) {
      const localRecord =
        latestLocal.find(
          (record) =>
            record.id ===
            getOfflineNoteId(
              user.uid,
              firebaseNote.id,
            ),
        );

      /*
       * Never overwrite a pending
       * offline/local edit.
       */
      if (
        localRecord &&
        localRecord.syncStatus ===
          "pending"
      ) {
        continue;
      }

      await saveLocalNote(
        firebaseNote,
        "synced",
      );
    }

    /*
     * Return local version.
     */
    return getLocalNotes();
  } catch (error) {
    console.warn(
      "Firebase unavailable. Using offline notes.",
      error,
    );

    return localNotes;
  }
}

/* ================================================= */
/* ADD NOTE */
/* ================================================= */

export async function addNote(
  title: string,
  type: NoteType = "text",
  content = "",
): Promise<string> {
  const user =
    auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not authenticated.",
    );
  }

  const now =
    new Date().toISOString();

  const noteId =
    crypto.randomUUID();

  const note: Note = {
    id: noteId,

    title:
      title.trim() ||
      "Untitled Note",

    type,

    content,

    blocks: [],

    checklist: [],

    pinned: false,

    createdAt: now,

    updatedAt: now,
  };

  /*
   * LOCAL FIRST
   */
  await saveLocalNote(
    note,
    "pending",
  );

  /*
   * Firebase background sync.
   *
   * Don't await.
   */
  if (
    typeof navigator !==
      "undefined" &&
    navigator.onLine
  ) {
    void syncPendingNotes();
  }

  return noteId;
}

/* ================================================= */
/* UPDATE NOTE */
/* ================================================= */

export async function updateNote(
  noteId: string,
  data: Partial<
    Omit<
      Note,
      "id" |
        "createdAt" |
        "updatedAt"
    >
  >,
): Promise<Note> {
  const user =
    auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not authenticated.",
    );
  }

  /*
   * Try to find existing local note.
   *
   * It is OK if it doesn't exist.
   */
  let existing:
    | Note
    | null = null;

  try {
    existing =
      await getLocalNote(
        noteId,
      );
  } catch (error) {
    console.warn(
      "Could not read existing local note:",
      error,
    );
  }

  const now =
    new Date().toISOString();

  /*
   * If local note doesn't exist,
   * create a base note.
   *
   * IMPORTANT:
   * This prevents "Note not found"
   * from breaking Auto Save.
   */
  const baseNote: Note =
    existing ?? {
      id: noteId,

      title:
        "Untitled Note",

      type:
        "text",

      content: "",

      blocks: [],

      checklist: [],

      pinned: false,

      createdAt: now,

      updatedAt: now,
    };

  /*
   * Merge current editor data.
   */
  const updatedNote =
    normalizeNote({
      ...baseNote,

      ...data,

      id: noteId,

      createdAt:
        baseNote.createdAt ||
        now,

      updatedAt: now,
    });

  /*
   * =================================================
   * LOCAL FIRST
   * =================================================
   *
   * This finishes quickly and does not wait
   * for Firebase.
   */
  await saveLocalNote(
    updatedNote,
    "pending",
  );

  /*
   * =================================================
   * FIREBASE BACKGROUND SYNC
   * =================================================
   */
  if (
    typeof navigator !==
      "undefined" &&
    navigator.onLine
  ) {
    void syncPendingNotes();
  }

  return updatedNote;
}

/* ================================================= */
/* DELETE NOTE */
/* ================================================= */

export async function deleteNote(
  noteId: string,
): Promise<void> {
  const user =
    auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not authenticated.",
    );
  }

  /*
   * Local delete operation.
   */
  await saveLocalDelete(
    noteId,
  );

  /*
   * Firebase background delete.
   */
  if (
    typeof navigator !==
      "undefined" &&
    navigator.onLine
  ) {
    void syncPendingNotes();
  }
}

/* ================================================= */
/* PIN */
/* ================================================= */

export async function toggleNotePin(
  noteId: string,
  pinned: boolean,
): Promise<Note> {
  return updateNote(
    noteId,
    {
      pinned,
    },
  );
}

/* ================================================= */
/* ONLINE SYNC LISTENER */
/* ================================================= */

if (
  typeof window !==
  "undefined"
) {
  window.addEventListener(
    "online",
    () => {
      void syncPendingNotes();
    },
  );
}