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

import { auth, db } from "@/lib/firebase";

import { Note, NoteType } from "../types/notebook.types";

function getNotesCollection() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  return collection(db, "users", user.uid, "notes");
}

function timestampToISOString(timestamp: unknown): string {
  if (
    timestamp &&
    typeof timestamp === "object" &&
    "toDate" in timestamp &&
    typeof timestamp.toDate === "function"
  ) {
    return timestamp.toDate().toISOString();
  }

  return new Date().toISOString();
}

export async function getNotes(): Promise<Note[]> {
  const notesRef = getNotesCollection();

  const q = query(notesRef, orderBy("updatedAt", "desc"));

  const snapshot = await getDocs(q);

  return snapshot.docs.map((noteDoc) => {
    const data = noteDoc.data();

    return {
      id: noteDoc.id,
      title: data.title ?? "",
      type: (data.type ?? "text") as NoteType,
      content: data.content ?? "",
      checklist: data.checklist ?? [],
      pinned: data.pinned ?? false,
      createdAt: timestampToISOString(data.createdAt),
      updatedAt: timestampToISOString(data.updatedAt),
    };
  });
}

export async function addNote(
  title: string,
  type: NoteType = "text",
  content = "",
): Promise<string> {
  const notesRef = getNotesCollection();

  const noteRef = await addDoc(notesRef, {
    title: title.trim() || "Untitled Note",
    type,
    content,
    checklist: [],
    pinned: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return noteRef.id;
}

export async function updateNote(
  noteId: string,
  data: Partial<Omit<Note, "id" | "createdAt" | "updatedAt">>,
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const noteRef = doc(db, "users", user.uid, "notes", noteId);

  await updateDoc(noteRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNote(noteId: string) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated.");
  }

  const noteRef = doc(db, "users", user.uid, "notes", noteId);

  await deleteDoc(noteRef);
}

export async function toggleNotePin(
  noteId: string,
  pinned: boolean,
) {
  await updateNote(noteId, {
    pinned,
  });
}