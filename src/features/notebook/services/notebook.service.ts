import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import {
  Note,
  NoteBlock,
} from "../types/notebook.types";

/* =========================================================
   CONFIG
========================================================= */

const DB_NAME = "life-os-notebook-v2";

const DB_VERSION = 1;

const STORE_NAME = "notes";

/* =========================================================
   LOCAL RECORD
========================================================= */

interface LocalNoteRecord {
  id: string;

  userId: string;

  note: Note;

  syncStatus: "pending" | "synced";

  deleted: boolean;

  updatedAt: number;
}

/* =========================================================
   USER
========================================================= */

function getUser() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not authenticated.",
    );
  }

  return user;
}

/* =========================================================
   FIREBASE COLLECTION
========================================================= */

function getNotesCollection() {
  const user = getUser();

  return collection(
    db,
    "users",
    user.uid,
    "notes",
  );
}

/* =========================================================
   LOCAL ID
========================================================= */

function getLocalId(
  userId: string,
  noteId: string,
) {
  return `${userId}:note:${noteId}`;
}

/* =========================================================
   INDEXED DB
========================================================= */

function openDatabase(): Promise<IDBDatabase> {
  return new Promise(
    (resolve, reject) => {
      if (
        typeof window ===
        "undefined"
      ) {
        reject(
          new Error(
            "IndexedDB is only available in browser.",
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
              "Could not open notebook database.",
            ),
        );
      };
    },
  );
}

/* =========================================================
   LOCAL GET ALL
========================================================= */

async function getLocalRecords(): Promise<
  LocalNoteRecord[]
> {
  const database =
    await openDatabase();

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
        database.close();

        resolve(
          (request.result ??
            []) as LocalNoteRecord[],
        );
      };

      request.onerror = () => {
        database.close();

        reject(
          request.error ??
            new Error(
              "Could not read local notes.",
            ),
        );
      };
    },
  );
}

/* =========================================================
   LOCAL SAVE
========================================================= */

async function putLocalRecord(
  record: LocalNoteRecord,
): Promise<void> {
  const database =
    await openDatabase();

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
        database.close();

        resolve();
      };

      transaction.onerror = () => {
        database.close();

        reject(
          transaction.error ??
            new Error(
              "Could not save local note.",
            ),
        );
      };
    },
  );
}

/* =========================================================
   LOCAL DELETE
========================================================= */

async function deleteLocalRecord(
  id: string,
): Promise<void> {
  const database =
    await openDatabase();

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
        database.close();

        resolve();
      };

      transaction.onerror = () => {
        database.close();

        reject(
          transaction.error ??
            new Error(
              "Could not delete local note.",
            ),
        );
      };
    },
  );
}

/* =========================================================
   NORMALIZE BLOCK
========================================================= */

function normalizeBlock(
  block: NoteBlock,
): NoteBlock {
  return {
    id:
      block.id ||
      crypto.randomUUID(),

    type:
      block.type ===
      "checklist"
        ? "checklist"
        : "text",

    text:
      typeof block.text ===
      "string"
        ? block.text
        : "",

    checked:
      block.type ===
      "checklist"
        ? Boolean(
            block.checked,
          )
        : undefined,
  };
}

/* =========================================================
   NORMALIZE NOTE
========================================================= */

function normalizeNote(
  note: Note,
): Note {
  const now =
    new Date().toISOString();

  const blocks =
    Array.isArray(
      note.blocks,
    )
      ? note.blocks.map(
          normalizeBlock,
        )
      : [];

  return {
    id: note.id,

    title:
      typeof note.title ===
      "string"
        ? note.title
        : "Untitled Note",

    type:
      note.type ===
      "checklist"
        ? "checklist"
        : "text",

    content:
      typeof note.content ===
      "string"
        ? note.content
        : "",

    blocks,

    checklist:
      Array.isArray(
        note.checklist,
      )
        ? note.checklist.map(
            normalizeBlock,
          )
        : [],

    pinned:
      Boolean(note.pinned),

    createdAt:
      note.createdAt ||
      now,

    updatedAt:
      note.updatedAt ||
      now,
  };
}

/* =========================================================
   LOCAL NOTES
========================================================= */

async function getLocalNotes(): Promise<
  Note[]
> {
  const user =
    auth.currentUser;

  if (!user) {
    return [];
  }

  const records =
    await getLocalRecords();

  return records
    .filter(
      (record) =>
        record.userId ===
          user.uid &&
        !record.deleted,
    )
    .map((record) =>
      normalizeNote(
        record.note,
      ),
    )
    .sort(
      (a, b) =>
        new Date(
          b.updatedAt,
        ).getTime() -
        new Date(
          a.updatedAt,
        ).getTime(),
    );
}

/* =========================================================
   GET LOCAL ONE
========================================================= */

async function getLocalNote(
  noteId: string,
): Promise<Note | null> {
  const user =
    auth.currentUser;

  if (!user) {
    return null;
  }

  const records =
    await getLocalRecords();

  const record =
    records.find(
      (item) =>
        item.id ===
        getLocalId(
          user.uid,
          noteId,
        ),
    );

  if (
    !record ||
    record.deleted
  ) {
    return null;
  }

  return normalizeNote(
    record.note,
  );
}

/* =========================================================
   ADD NOTE
========================================================= */

export async function addNote(
  title = "Untitled Note",
): Promise<Note> {
  const user = getUser();

  const now =
    new Date().toISOString();

  const note: Note = {
    id: crypto.randomUUID(),

    title:
      title.trim() ||
      "Untitled Note",

    type: "text",

    content: "",

    blocks: [
      {
        id: crypto.randomUUID(),
        type: "text",
        text: "",
      },
    ],

    checklist: [],

    pinned: false,

    createdAt: now,

    updatedAt: now,
  };

  await putLocalRecord({
    id: getLocalId(
      user.uid,
      note.id,
    ),

    userId: user.uid,

    note,

    syncStatus: "pending",

    deleted: false,

    updatedAt: Date.now(),
  });

  if (
    typeof navigator !==
      "undefined" &&
    navigator.onLine
  ) {
    void syncPendingNotes();
  }

  return note;
}

/* =========================================================
   GET NOTES
========================================================= */

export async function getNotes(): Promise<
  Note[]
> {
  const user =
    auth.currentUser;

  if (!user) {
    return [];
  }

  const localNotes =
    await getLocalNotes();

  if (
    typeof navigator ===
      "undefined" ||
    !navigator.onLine
  ) {
    return localNotes;
  }

  try {
    await syncPendingNotes();
  } catch {
    // Keep local data.
  }

  try {
    const snapshot =
      await getDocs(
        getNotesCollection(),
      );

    const firebaseNotes =
      snapshot.docs.map(
        (item) => {
          const data =
            item.data();

          return normalizeNote({
            id: item.id,

            title:
              typeof data.title ===
              "string"
                ? data.title
                : "Untitled Note",

            type:
              data.type ===
              "checklist"
                ? "checklist"
                : "text",

            content:
              typeof data.content ===
              "string"
                ? data.content
                : "",

            blocks:
              Array.isArray(
                data.blocks,
              )
                ? (data.blocks as NoteBlock[])
                : [],

            checklist:
              Array.isArray(
                data.checklist,
              )
                ? (data.checklist as NoteBlock[])
                : [],

            pinned:
              Boolean(
                data.pinned,
              ),

            createdAt:
              typeof data.createdAt ===
              "string"
                ? data.createdAt
                : new Date().toISOString(),

            updatedAt:
              typeof data.updatedAt ===
              "string"
                ? data.updatedAt
                : new Date().toISOString(),
          });
        },
      );

    const localRecords =
      await getLocalRecords();

    for (
      const firebaseNote of
        firebaseNotes
    ) {
      const local =
        localRecords.find(
          (record) =>
            record.id ===
            getLocalId(
              user.uid,
              firebaseNote.id,
            ),
        );

      if (
        local?.syncStatus ===
        "pending"
      ) {
        continue;
      }

      await putLocalRecord({
        id: getLocalId(
          user.uid,
          firebaseNote.id,
        ),

        userId: user.uid,

        note: firebaseNote,

        syncStatus: "synced",

        deleted: false,

        updatedAt: Date.now(),
      });
    }
  } catch (error) {
    console.warn(
      "Firebase notebook unavailable.",
      error,
    );
  }

  return getLocalNotes();
}

/* =========================================================
   SAVE NOTE
========================================================= */

export async function saveNote(
  note: Note,
): Promise<Note> {
  const user = getUser();

  const existing =
    await getLocalNote(
      note.id,
    );

  const now =
    new Date().toISOString();

  const normalized =
    normalizeNote({
      ...(existing ?? note),

      ...note,

      id: note.id,

      createdAt:
        existing?.createdAt ??
        note.createdAt ??
        now,

      updatedAt: now,
    });

  await putLocalRecord({
    id: getLocalId(
      user.uid,
      normalized.id,
    ),

    userId: user.uid,

    note: normalized,

    syncStatus: "pending",

    deleted: false,

    updatedAt: Date.now(),
  });

  if (
    typeof navigator !==
      "undefined" &&
    navigator.onLine
  ) {
    void syncPendingNotes();
  }

  return normalized;
}

/* =========================================================
   UPDATE NOTE
========================================================= */

export async function updateNote(
  note: Note,
): Promise<Note> {
  return saveNote(note);
}

/* =========================================================
   DELETE NOTE
========================================================= */

export async function deleteNote(
  noteId: string,
): Promise<void> {
  const user = getUser();

  const existing =
    await getLocalNote(
      noteId,
    );

  const note =
    existing ??
    normalizeNote({
      id: noteId,
      title: "Untitled Note",
      type: "text",
      content: "",
      blocks: [],
      checklist: [],
      pinned: false,
      createdAt:
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString(),
    });

  await putLocalRecord({
    id: getLocalId(
      user.uid,
      noteId,
    ),

    userId: user.uid,

    note,

    syncStatus: "pending",

    deleted: true,

    updatedAt: Date.now(),
  });

  if (
    typeof navigator !==
      "undefined" &&
    navigator.onLine
  ) {
    void syncPendingNotes();
  }
}

/* =========================================================
   TOGGLE PIN
========================================================= */

export async function toggleNotePin(
  note: Note,
): Promise<Note> {
  return saveNote({
    ...note,

    pinned: !note.pinned,
  });
}

/* =========================================================
   SYNC ONE
========================================================= */

async function syncOneNote(
  record: LocalNoteRecord,
): Promise<void> {
  const user =
    auth.currentUser;

  if (
    !user ||
    record.userId !==
      user.uid
  ) {
    return;
  }

  const noteRef =
    doc(
      db,
      "users",
      user.uid,
      "notes",
      record.note.id,
    );

  if (record.deleted) {
    await deleteDoc(
      noteRef,
    );

    await deleteLocalRecord(
      record.id,
    );

    return;
  }

  const note =
    normalizeNote(
      record.note,
    );

  await setDoc(
    noteRef,
    {
      id: note.id,

      title: note.title,

      type: note.type,

      content:
        note.content ?? "",

      blocks: note.blocks,

      checklist:
        note.checklist ?? [],

      pinned: note.pinned,

      createdAt:
        note.createdAt,

      updatedAt:
        note.updatedAt,
    },
    {
      merge: true,
    },
  );

  await putLocalRecord({
    ...record,

    note,

    syncStatus: "synced",

    updatedAt: Date.now(),
  });
}

/* =========================================================
   SYNC PENDING
========================================================= */

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
    await getLocalRecords();

  const pending =
    records
      .filter(
        (record) =>
          record.userId ===
            user.uid &&
          record.syncStatus ===
            "pending",
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
      await syncOneNote(
        record,
      );
    } catch (error) {
      console.warn(
        "Notebook sync failed:",
        error,
      );
    }
  }
}

/* =========================================================
   ONLINE EVENT
========================================================= */

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