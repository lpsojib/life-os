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

interface OfflineRecord {
  id: string;
  collection: string;
  data: unknown;
  updatedAt: number;
  syncStatus: "pending" | "synced";
}

/* ================================================= */
/* FIREBASE COLLECTION */
/* ================================================= */

function getNotesCollection() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
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
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(
        new Error(
          "IndexedDB is only available in the browser.",
        ),
      );

      return;
    }

    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION,
    );

    request.onupgradeneeded = () => {
      const database = request.result;

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
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ??
          new Error(
            "Failed to open offline database.",
          ),
      );
    };
  });
}

/* ================================================= */
/* OFFLINE HELPERS */
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
              "Failed to save offline note.",
            ),
        );
      };
    },
  );
}

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
              "Failed to delete offline note.",
            ),
        );
      };
    },
  );
}

/* ================================================= */
/* NOTE ID */
/* ================================================= */

function getOfflineNoteId(
  userId: string,
  noteId: string,
) {
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
    typeof timestamp === "object" &&
    "toDate" in timestamp &&
    typeof timestamp.toDate ===
      "function"
  ) {
    return timestamp
      .toDate()
      .toISOString();
  }

  if (
    typeof timestamp === "string"
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
) {
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
      record.data as {
        userId?: string;
        note?: Note;
        operation?: string;
      };

    if (
      data.userId !== user.uid
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
    record.data as {
      userId?: string;
      note?: Note;
      operation?: string;
    };

  if (
    data.userId !== user.uid
  ) {
    return;
  }

  if (
    data.operation ===
    "delete"
  ) {
    const noteId =
      data.note?.id;

    if (!noteId) {
      return;
    }

    const noteRef = doc(
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

  if (!data.note) {
    return;
  }

  const note =
    normalizeNote(data.note);

  const noteRef = doc(
    db,
    "users",
    user.uid,
    "notes",
    note.id,
  );

  await setDoc(
    noteRef,
    {
      title: note.title,
      type: note.type,
      content: note.content,
      blocks: note.blocks,
      checklist: note.checklist,
      pinned: note.pinned,
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

  await saveOfflineRecord({
    ...record,
    syncStatus: "synced",
  });
}

/* ================================================= */
/* SYNC ALL NOTES */
/* ================================================= */

export async function syncPendingNotes() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  if (!navigator.onLine) {
    return;
  }

  const user = auth.currentUser;

  if (!user) {
    return;
  }

  const records =
    await getOfflineRecords();

  const pending =
    records.filter(
      (record) =>
        record.syncStatus ===
          "pending" &&
        (
          record.data as {
            userId?: string;
          }
        ).userId ===
          user.uid,
    );

  for (const record of pending) {
    try {
      await syncNote(record);
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
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not authenticated.",
    );
  }

  /*
   * First return local notes.
   * This makes Notebook usable offline.
   */
  const localNotes =
    await getLocalNotes();

  /*
   * Try Firebase only when online.
   */
  if (
    typeof navigator !==
      "undefined" &&
    navigator.onLine
  ) {
    try {
      await syncPendingNotes();

      const notesRef =
        getNotesCollection();

      const q = query(
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
              id: noteDoc.id,

              title:
                data.title ??
                "",

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
                data.pinned ??
                false,

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
       * Save Firebase notes locally.
       */
      for (
        const note of firebaseNotes
      ) {
        await saveLocalNote(
          note,
          "synced",
        );
      }

      /*
       * Load local again so pending
       * offline changes are preserved.
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

  return localNotes;
}

/* ================================================= */
/* ADD NOTE */
/* ================================================= */

export async function addNote(
  title: string,
  type: NoteType = "text",
  content = "",
): Promise<string> {
  const user = auth.currentUser;

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
   * Firebase sync in background.
   * Do NOT wait for it.
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
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not authenticated.",
    );
  }

  const localNotes =
    await getLocalNotes();

  const existing =
    localNotes.find(
      (note) =>
        note.id === noteId,
    );

  if (!existing) {
    throw new Error(
      "Note not found.",
    );
  }

  const updatedNote =
    normalizeNote({
      ...existing,
      ...data,
      id: noteId,
      updatedAt:
        new Date().toISOString(),
    });

  /*
   * LOCAL FIRST
   */
  await saveLocalNote(
    updatedNote,
    "pending",
  );

  /*
   * Firebase in background
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
/* DELETE NOTE */
/* ================================================= */

export async function deleteNote(
  noteId: string,
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not authenticated.",
    );
  }

  const deleteId =
    getOfflineNoteId(
      user.uid,
      noteId,
    );

  /*
   * Keep delete operation locally.
   */
  await saveOfflineRecord({
    id: deleteId,

    collection:
      NOTE_COLLECTION,

    data: {
      userId: user.uid,

      note: {
        id: noteId,
      },

      operation: "delete",
    },

    updatedAt: Date.now(),

    syncStatus: "pending",
  });

  /*
   * Firebase in background.
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
) {
  await updateNote(
    noteId,
    {
      pinned,
    },
  );
}

/* ================================================= */
/* ONLINE SYNC LISTENERS */
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