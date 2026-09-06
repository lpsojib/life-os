import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

import {
  LocalNote,
  Note,
  NoteBlock,
} from "../types/notebook.types";

/* =========================================================
   DATABASE CONFIG
========================================================= */

const DB_NAME = "life-os-notebook";
const DB_VERSION = 1;
const STORE_NAME = "notes";

/* =========================================================
   ID
========================================================= */

export function createLocalId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `note-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/* =========================================================
   INDEXED DB
========================================================= */

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (
      typeof window === "undefined" ||
      !window.indexedDB
    ) {
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
        const store =
          database.createObjectStore(
            STORE_NAME,
            {
              keyPath: "id",
            },
          );

        store.createIndex(
          "updatedAt",
          "updatedAt",
          {
            unique: false,
          },
        );

        store.createIndex(
          "syncStatus",
          "syncStatus",
          {
            unique: false,
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
            "Failed to open notebook database.",
          ),
      );
    };
  });
}

/* =========================================================
   LOCAL SAVE
========================================================= */

async function putLocalNote(
  note: LocalNote,
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

      store.put(note);

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
              "Failed to save local note.",
            ),
        );
      };

      transaction.onabort = () => {
        database.close();

        reject(
          transaction.error ??
            new Error(
              "Notebook transaction aborted.",
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
  LocalNote[]
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
        const notes =
          Array.isArray(
            request.result,
          )
            ? (request.result as LocalNote[])
            : [];

        notes.sort(
          (a, b) =>
            b.updatedAt -
            a.updatedAt,
        );

        resolve(notes);
      };

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              "Failed to read local notes.",
            ),
        );
      };

      transaction.oncomplete =
        () => {
          database.close();
        };
    },
  );
}

/* =========================================================
   GET SINGLE LOCAL NOTE
========================================================= */

async function getLocalNote(
  id: string,
): Promise<LocalNote | null> {
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
        resolve(
          request.result
            ? (request.result as LocalNote)
            : null,
        );
      };

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              "Failed to read local note.",
            ),
        );
      };

      transaction.oncomplete =
        () => {
          database.close();
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
              "Failed to delete local note.",
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
  value: unknown,
): NoteBlock {
  const block =
    (value ?? {}) as Record<
      string,
      unknown
    >;

  const id =
    typeof block.id === "string" &&
    block.id.length > 0
      ? block.id
      : createLocalId();

  const type =
    block.type === "checklist"
      ? "checklist"
      : "text";

  /*
   * New format:
   * text
   *
   * Old format:
   * content
   *
   * Both are supported while
   * reading old notes.
   */
  const text =
    typeof block.text === "string"
      ? block.text
      : typeof block.content ===
          "string"
        ? block.content
        : "";

  if (type === "checklist") {
    return {
      id,
      type: "checklist",
      text,
      checked: Boolean(
        block.checked,
      ),
    };
  }

  return {
    id,
    type: "text",
    text,
  };
}

/* =========================================================
   NORMALIZE NOTE
========================================================= */

export function normalizeNote(
  input: Partial<Note> & {
    id: string;
  },
): Note {
  const now = Date.now();

  const rawBlocks =
    Array.isArray(input.blocks)
      ? input.blocks
      : [];

  const blocks =
    rawBlocks.length > 0
      ? rawBlocks.map(
          normalizeBlock,
        )
      : [
          {
            id: createLocalId(),
            type: "text" as const,
            text: "",
          },
        ];

  return {
    id: input.id,

    title:
      typeof input.title ===
      "string"
        ? input.title
        : "",

    blocks,

    pinned: Boolean(
      input.pinned,
    ),

    createdAt:
      typeof input.createdAt ===
      "number"
        ? input.createdAt
        : now,

    updatedAt:
      typeof input.updatedAt ===
      "number"
        ? input.updatedAt
        : now,
  };
}

/* =========================================================
   FIRESTORE SAFE NOTE
========================================================= */

function toFirestoreNote(
  note: Note,
): Record<string, unknown> {
  return {
    id: note.id,

    title:
      typeof note.title ===
      "string"
        ? note.title
        : "",

    blocks: note.blocks.map(
      (block) => {
        const safeBlock: Record<
          string,
          unknown
        > = {
          id: block.id,
          type: block.type,
          text:
            typeof block.text ===
            "string"
              ? block.text
              : "",
        };

        /*
         * Only checklist blocks
         * receive checked.
         *
         * Therefore undefined is
         * never sent to Firestore.
         */
        if (
          block.type ===
          "checklist"
        ) {
          safeBlock.checked =
            Boolean(
              block.checked,
            );
        }

        return safeBlock;
      },
    ),

    pinned: Boolean(
      note.pinned,
    ),

    createdAt:
      note.createdAt,

    updatedAt:
      note.updatedAt,
  };
}

/* =========================================================
   CLEAN LOCAL NOTE
========================================================= */

function cleanLocalNote(
  note: LocalNote,
): Note {
  const {
    syncStatus: _syncStatus,
    ...cleanNote
  } = note;

  return cleanNote;
}

/* =========================================================
   ADD NOTE
========================================================= */

export async function addNote(
  data: Partial<Note> = {},
): Promise<Note> {
  const now = Date.now();

  const note =
    normalizeNote({
      id:
        typeof data.id ===
          "string" &&
        data.id.length > 0
          ? data.id
          : createLocalId(),

      title:
        typeof data.title ===
        "string"
          ? data.title
          : "",

      blocks:
        Array.isArray(
          data.blocks,
        )
          ? data.blocks
          : [],

      pinned:
        Boolean(data.pinned),

      createdAt:
        typeof data.createdAt ===
        "number"
          ? data.createdAt
          : now,

      updatedAt: now,
    });

  /*
   * ALWAYS save locally first.
   */
  await putLocalNote({
    ...note,
    syncStatus: "pending",
  });

  /*
   * Then try Firebase.
   */
  const user =
    auth.currentUser;

  if (user) {
    try {
      await setDoc(
        doc(
          db,
          "users",
          user.uid,
          "notes",
          note.id,
        ),
        toFirestoreNote(note),
      );

      await putLocalNote({
        ...note,
        syncStatus: "synced",
      });
    } catch (error) {
      console.error(
        "Firebase note creation failed. Local copy preserved.",
        error,
      );
    }
  }

  return note;
}

/* =========================================================
   SAVE / UPDATE NOTE
========================================================= */

export async function saveNote(
  data: Partial<Note> & {
    id?: string;
  },
): Promise<Note> {
  const now = Date.now();

  const existing =
    data.id
      ? await getLocalNote(
          data.id,
        )
      : null;

  const note =
    normalizeNote({
      id:
        typeof data.id ===
          "string" &&
        data.id.length > 0
          ? data.id
          : existing?.id ??
            createLocalId(),

      title:
        data.title ??
        existing?.title ??
        "",

      blocks:
        data.blocks ??
        existing?.blocks ??
        [],

      pinned:
        data.pinned ??
        existing?.pinned ??
        false,

      createdAt:
        data.createdAt ??
        existing?.createdAt ??
        now,

      updatedAt: now,
    });

  /*
   * Local-first.
   */
  await putLocalNote({
    ...note,
    syncStatus: "pending",
  });

  /*
   * Firebase.
   */
  const user =
    auth.currentUser;

  if (user) {
    try {
      await setDoc(
        doc(
          db,
          "users",
          user.uid,
          "notes",
          note.id,
        ),
        toFirestoreNote(note),
      );

      await putLocalNote({
        ...note,
        syncStatus: "synced",
      });
    } catch (error) {
      console.error(
        "Firebase note update failed. Local copy preserved.",
        error,
      );
    }
  }

  return note;
}

/* =========================================================
   GET NOTES
========================================================= */

export async function getNotes(): Promise<
  Note[]
> {
  const localNotes =
    await getLocalNotes();

  const user =
    auth.currentUser;

  /*
   * Offline / not logged in.
   */
  if (!user) {
    return localNotes.map(
      cleanLocalNote,
    );
  }

  try {
    const snapshot =
      await getDocs(
        collection(
          db,
          "users",
          user.uid,
          "notes",
        ),
      );

    const merged =
      new Map<
        string,
        LocalNote
      >();

    /*
     * Start with local data.
     */
    for (const note of localNotes) {
      merged.set(
        note.id,
        note,
      );
    }

    /*
     * Merge Firebase data.
     */
    for (const item of snapshot.docs) {
      const data =
        item.data();

      const remoteNote =
        normalizeNote({
          id: item.id,

          title:
            typeof data.title ===
            "string"
              ? data.title
              : "",

          blocks:
            Array.isArray(
              data.blocks,
            )
              ? data.blocks
              : [],

          pinned:
            Boolean(
              data.pinned,
            ),

          createdAt:
            typeof data.createdAt ===
            "number"
              ? data.createdAt
              : Date.now(),

          updatedAt:
            typeof data.updatedAt ===
            "number"
              ? data.updatedAt
              : Date.now(),
        });

      const local =
        merged.get(
          remoteNote.id,
        );

      /*
       * Firebase is newer
       * or local does not exist.
       */
      if (
        !local ||
        remoteNote.updatedAt >=
          local.updatedAt
      ) {
        const syncedNote =
          {
            ...remoteNote,
            syncStatus:
              "synced" as const,
          };

        merged.set(
          remoteNote.id,
          syncedNote,
        );

        await putLocalNote(
          syncedNote,
        );
      }
    }

    return Array.from(
      merged.values(),
    )
      .map(cleanLocalNote)
      .sort(
        (a, b) =>
          b.updatedAt -
          a.updatedAt,
      );
  } catch (error) {
    console.error(
      "Failed to load notes from Firebase. Using local notes.",
      error,
    );

    return localNotes.map(
      cleanLocalNote,
    );
  }
}

/* =========================================================
   GET SINGLE NOTE
========================================================= */

export async function getNote(
  id: string,
): Promise<Note | null> {
  const note =
    await getLocalNote(id);

  if (!note) {
    return null;
  }

  return cleanLocalNote(
    note,
  );
}

/* =========================================================
   DELETE NOTE
========================================================= */

export async function deleteNote(
  id: string,
): Promise<void> {
  /*
   * Delete local first.
   */
  await removeLocalNote(id);

  const user =
    auth.currentUser;

  /*
   * Offline:
   * local delete is enough.
   */
  if (!user) {
    return;
  }

  try {
    await deleteDoc(
      doc(
        db,
        "users",
        user.uid,
        "notes",
        id,
      ),
    );
  } catch (error) {
    console.error(
      "Failed to delete note from Firebase.",
      error,
    );

    throw error;
  }
}

/* =========================================================
   PIN / UNPIN
========================================================= */

export async function toggleNotePin(
  id: string,
): Promise<Note | null> {
  const note =
    await getLocalNote(id);

  if (!note) {
    return null;
  }

  return saveNote({
    id: note.id,
    title: note.title,
    blocks: note.blocks,
    pinned: !note.pinned,
    createdAt:
      note.createdAt,
  });
}

/* =========================================================
   SYNC PENDING NOTES
========================================================= */

export async function syncPendingNotes(): Promise<void> {
  const user =
    auth.currentUser;

  if (!user) {
    return;
  }

  const localNotes =
    await getLocalNotes();

  const pendingNotes =
    localNotes.filter(
      (note) =>
        note.syncStatus ===
        "pending",
    );

  for (const note of pendingNotes) {
    try {
      await setDoc(
        doc(
          db,
          "users",
          user.uid,
          "notes",
          note.id,
        ),
        toFirestoreNote(note),
      );

      await putLocalNote({
        ...note,
        syncStatus: "synced",
      });
    } catch (error) {
      console.error(
        "Failed to sync note:",
        note.id,
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