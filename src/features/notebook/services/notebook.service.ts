"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import {
  Note,
  NoteBlock,
} from "../types/notebook.types";

/* =========================================================
   CONSTANTS
========================================================= */

const DB_NAME = "life-os-notebook";
const DB_VERSION = 1;
const STORE_NAME = "notes";

/* =========================================================
   TYPES
========================================================= */

interface LocalNoteRecord {
  id: string;
  note: Note;
  syncStatus: "pending" | "synced";
  updatedAt: string;
}

/* =========================================================
   FIREBASE COLLECTION
========================================================= */

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

/* =========================================================
   INDEXED DB
========================================================= */

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (
      typeof window === "undefined" ||
      !("indexedDB" in window)
    ) {
      reject(
        new Error(
          "IndexedDB is not available in this browser.",
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
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ??
          new Error(
            "Could not open notebook database.",
          ),
      );
    };
  });
}

/* =========================================================
   LOCAL PUT
========================================================= */

async function putLocalNote(
  note: Note,
  syncStatus:
    | "pending"
    | "synced" = "pending",
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

      const record: LocalNoteRecord =
        {
          id: note.id,
          note,
          syncStatus,
          updatedAt:
            note.updatedAt,
        };

      store.put(record);

      transaction.oncomplete =
        () => {
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
   GET LOCAL NOTES
========================================================= */

async function getLocalNotes(): Promise<
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

        const records =
          Array.isArray(
            request.result,
          )
            ? (request.result as LocalNoteRecord[])
            : [];

        resolve(records);
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
   GET SINGLE LOCAL NOTE
========================================================= */

async function getLocalNote(
  id: string,
): Promise<Note | null> {
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
        store.get(id);

      request.onsuccess = () => {
        database.close();

        const record =
          request.result as
            | LocalNoteRecord
            | undefined;

        resolve(
          record?.note ?? null,
        );
      };

      request.onerror = () => {
        database.close();

        reject(
          request.error ??
            new Error(
              "Could not read local note.",
            ),
        );
      };
    },
  );
}

/* =========================================================
   DELETE LOCAL NOTE
========================================================= */

async function removeLocalNote(
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

      transaction.oncomplete =
        () => {
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
  if (
    block.type === "checklist"
  ) {
    return {
      ...block,
      type: "checklist",
      text:
        typeof block.text === "string"
          ? block.text
          : "",
      checked:
        block.checked === true,
    };
  }

  return {
    ...block,
    type: "text",
    text:
      typeof block.text === "string"
        ? block.text
        : "",
  };
}

/* =========================================================
   NORMALIZE NOTE
========================================================= */

function normalizeNote(
  data: Partial<Note> & {
    id: string;
  },
): Note {
  const rawBlocks =
    Array.isArray(data.blocks)
      ? data.blocks
      : [];

  const blocks =
    rawBlocks.map(
      normalizeBlock,
    );

  return {
    id: data.id,

    title:
      typeof data.title === "string"
        ? data.title
        : "",

    type:
      data.type === "checklist"
        ? "checklist"
        : "text",

    blocks,

    pinned:
      data.pinned === true,

    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : new Date().toISOString(),

    updatedAt:
      typeof data.updatedAt === "string"
        ? data.updatedAt
        : new Date().toISOString(),
  };
}

/* =========================================================
   CREATE LOCAL ID
========================================================= */

function createLocalId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `note-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

/* =========================================================
   CREATE NOTE
========================================================= */

export async function addNote(
  title = "",
): Promise<Note> {
  const now =
    new Date().toISOString();

  const note: Note =
    normalizeNote({
      id: createLocalId(),
      title,
      type: "text",
      blocks: [
        {
          id: createLocalId(),
          type: "text",
          text: "",
        },
      ],
      pinned: false,
      createdAt: now,
      updatedAt: now,
    });

  /*
   * Save locally first.
   * This makes creating notes fast
   * even when the user is offline.
   */
  await putLocalNote(
    note,
    "pending",
  );

  /*
   * Try Firebase sync.
   * If offline, local note remains available.
   */
  try {
    await saveNoteToFirebase(
      note,
    );

    await putLocalNote(
      note,
      "synced",
    );
  } catch (error) {
    console.warn(
      "Note Firebase sync skipped:",
      error,
    );
  }

  return note;
}

/* =========================================================
   SAVE NOTE TO FIREBASE
========================================================= */

async function saveNoteToFirebase(
  note: Note,
): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not authenticated.",
    );
  }

  const noteReference = doc(
    getNotesCollection(),
    note.id,
  );

  await setDoc(
    noteReference,
    {
      id: note.id,
      title: note.title,
      type: note.type,
      blocks: note.blocks,
      pinned: note.pinned,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    },
    {
      merge: true,
    },
  );
}

/* =========================================================
   GET NOTES
========================================================= */

export async function getNotes(): Promise<
  Note[]
> {
  const localRecords =
    await getLocalNotes();

  const localNotes =
    localRecords
      .map(
        (record) =>
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

  /*
   * If user is not logged in,
   * return local notes.
   */
  if (!auth.currentUser) {
    return localNotes;
  }

  try {
    const snapshot =
      await getDocs(
        getNotesCollection(),
      );

    const firebaseNotes =
      snapshot.docs.map(
        (snapshotDocument) => {
          const data =
            snapshotDocument.data();

          return normalizeNote({
            id: snapshotDocument.id,
            ...data,
          });
        },
      );

    /*
     * Merge Firebase and local notes.
     * Local pending notes are preserved.
     */
    const noteMap =
      new Map<string, Note>();

    for (const note of firebaseNotes) {
      noteMap.set(
        note.id,
        note,
      );
    }

    for (const record of localRecords) {
      const localNote =
        normalizeNote(
          record.note,
        );

      const firebaseNote =
        noteMap.get(
          localNote.id,
        );

      if (
        !firebaseNote ||
        record.syncStatus ===
          "pending" ||
        new Date(
          localNote.updatedAt,
        ).getTime() >
          new Date(
            firebaseNote.updatedAt,
          ).getTime()
      ) {
        noteMap.set(
          localNote.id,
          localNote,
        );
      }
    }

    const mergedNotes =
      Array.from(
        noteMap.values(),
      ).sort(
        (a, b) =>
          new Date(
            b.updatedAt,
          ).getTime() -
          new Date(
            a.updatedAt,
          ).getTime(),
      );

    /*
     * Update local cache.
     */
    for (const note of mergedNotes) {
      const existing =
        localRecords.find(
          (record) =>
            record.id === note.id,
        );

      await putLocalNote(
        note,
        existing?.syncStatus ===
          "pending"
          ? "pending"
          : "synced",
      );
    }

    return mergedNotes;
  } catch (error) {
    console.warn(
      "Could not load Firebase notes. Using local notes.",
      error,
    );

    return localNotes;
  }
}

/* =========================================================
   SAVE / UPDATE NOTE
========================================================= */

export async function saveNote(
  note: Note,
): Promise<Note> {
  const updatedNote =
    normalizeNote({
      ...note,
      updatedAt:
        new Date().toISOString(),
    });

  /*
   * Local-first save.
   */
  await putLocalNote(
    updatedNote,
    "pending",
  );

  /*
   * Firebase sync.
   */
  try {
    await saveNoteToFirebase(
      updatedNote,
    );

    await putLocalNote(
      updatedNote,
      "synced",
    );
  } catch (error) {
    console.warn(
      "Note saved locally. Firebase sync will retry later.",
      error,
    );
  }

  return updatedNote;
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
  /*
   * Delete locally first.
   */
  await removeLocalNote(
    noteId,
  );

  /*
   * Delete from Firebase.
   */
  try {
    const user =
      auth.currentUser;

    if (!user) {
      return;
    }

    await deleteDoc(
      doc(
        getNotesCollection(),
        noteId,
      ),
    );
  } catch (error) {
    console.warn(
      "Firebase note deletion failed:",
      error,
    );
  }
}

/* =========================================================
   TOGGLE PIN
========================================================= */

export async function toggleNotePin(
  note: Note,
): Promise<Note> {
  const updatedNote =
    normalizeNote({
      ...note,
      pinned: !note.pinned,
      updatedAt:
        new Date().toISOString(),
    });

  return saveNote(
    updatedNote,
  );
}

/* =========================================================
   SYNC ONE NOTE
========================================================= */

export async function syncOneNote(
  note: Note,
): Promise<Note> {
  const normalized =
    normalizeNote({
      ...note,
    });

  await saveNoteToFirebase(
    normalized,
  );

  await putLocalNote(
    normalized,
    "synced",
  );

  return normalized;
}

/* =========================================================
   SYNC PENDING NOTES
========================================================= */

export async function syncPendingNotes(): Promise<void> {
  if (!auth.currentUser) {
    return;
  }

  try {
    const records =
      await getLocalNotes();

    const pending =
      records.filter(
        (record) =>
          record.syncStatus ===
          "pending",
      );

    for (const record of pending) {
      try {
        const note =
          normalizeNote(
            record.note,
          );

        await saveNoteToFirebase(
          note,
        );

        await putLocalNote(
          note,
          "synced",
        );
      } catch (error) {
        console.warn(
          `Could not sync note ${record.id}:`,
          error,
        );
      }
    }
  } catch (error) {
    console.warn(
      "Could not sync pending notes:",
      error,
    );
  }
}

/* =========================================================
   GET LOCAL RECORDS
========================================================= */

export async function getLocalRecords(): Promise<
  Note[]
> {
  const records =
    await getLocalNotes();

  return records
    .map(
      (record) =>
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
   CLEAR LOCAL NOTE
========================================================= */

export async function removeLocalRecord(
  noteId: string,
): Promise<void> {
  await removeLocalNote(
    noteId,
  );
}

/* =========================================================
   AUTO SYNC WHEN ONLINE
========================================================= */

if (
  typeof window !== "undefined"
) {
  window.addEventListener(
    "online",
    () => {
      void syncPendingNotes();
    },
  );
}