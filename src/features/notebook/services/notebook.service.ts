import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "@/lib/firebase";

import {
  Note,
  NoteType,
} from "../types/notebook.types";

/* -------------------------------- */
/* Notes Collection */
/* -------------------------------- */

function getNotesCollection() {
  const user =
    auth.currentUser;

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

/* -------------------------------- */
/* Timestamp */
/* -------------------------------- */

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
    ).toDate ===
      "function"
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

/* -------------------------------- */
/* GET NOTES */
/* -------------------------------- */

export async function getNotes(): Promise<
  Note[]
> {
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

  return snapshot.docs.map(
    (noteDoc) => {
      const data =
        noteDoc.data();

      return {
        id: noteDoc.id,

        title:
          data.title ?? "",

        type:
          (data.type ??
            "text") as NoteType,

        content:
          data.content ?? "",

        blocks:
          Array.isArray(
            data.blocks,
          )
            ? data.blocks
            : [],

        checklist:
          Array.isArray(
            data.checklist,
          )
            ? data.checklist
            : [],

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
      };
    },
  );
}

/* -------------------------------- */
/* ADD NOTE */
/* -------------------------------- */

export async function addNote(
  title: string,
  type: NoteType = "text",
  content = "",
): Promise<string> {
  const notesRef =
    getNotesCollection();

  const noteRef =
    await addDoc(
      notesRef,
      {
        title:
          title.trim() ||
          "Untitled Note",

        type,

        content,

        blocks: [],

        checklist: [],

        pinned: false,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      },
    );

  return noteRef.id;
}

/* -------------------------------- */
/* UPDATE NOTE */
/* -------------------------------- */

export async function updateNote(
  noteId: string,
  data: Partial<
    Omit<
      Note,
      | "id"
      | "createdAt"
      | "updatedAt"
    >
  >,
): Promise<void> {
  const user =
    auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not authenticated.",
    );
  }

  const noteRef = doc(
    db,
    "users",
    user.uid,
    "notes",
    noteId,
  );

  await updateDoc(
    noteRef,
    {
      ...data,
      updatedAt:
        serverTimestamp(),
    },
  );
}

/* -------------------------------- */
/* DELETE NOTE */
/* -------------------------------- */

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
}

/* -------------------------------- */
/* PIN / UNPIN */
/* -------------------------------- */

export async function toggleNotePin(
  noteId: string,
  pinned: boolean,
): Promise<void> {
  await updateNote(
    noteId,
    {
      pinned,
    },
  );
}