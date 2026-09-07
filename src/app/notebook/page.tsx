"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Plus,
} from "lucide-react";

import NoteEditor from "@/features/notebook/components/NoteEditor";
import NoteList from "@/features/notebook/components/NoteList";

import {
  addNote,
  deleteNote,
  getNotes,
  saveNote,
  syncPendingNotes,
  toggleNotePin,
} from "@/features/notebook/services/notebook.service";

import {
  Note,
} from "@/features/notebook/types/notebook.types";

export default function NotebookPage() {
  const [notes, setNotes] =
    useState<Note[]>([]);

  const [selectedNoteId, setSelectedNoteId] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  /* =====================================================
     LOAD NOTES
  ===================================================== */

  const loadNotes =
    useCallback(async () => {
      try {
        const loadedNotes =
          await getNotes();

        setNotes(loadedNotes);
      } catch (error) {
        console.error(
          "Failed to load notes:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const loadedNotes =
          await getNotes();

        if (cancelled) {
          return;
        }

        setNotes(loadedNotes);
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Failed to load notes:",
            error,
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const frame =
      window.requestAnimationFrame(() => {
        void load();
      });

    return () => {
      cancelled = true;

      window.cancelAnimationFrame(
        frame,
      );
    };
  }, []);

  /* =====================================================
     ONLINE SYNC

     Pending offline notes Firebase-এ sync হবে
     কিন্তু typing-এর সময় কোনো save হবে না।
  ===================================================== */

  useEffect(() => {
    const handleOnline =
      async () => {
        try {
          await syncPendingNotes();

          const loadedNotes =
            await getNotes();

          setNotes(loadedNotes);
        } catch (error) {
          console.error(
            "Notebook sync failed:",
            error,
          );
        }
      };

    window.addEventListener(
      "online",
      handleOnline,
    );

    return () => {
      window.removeEventListener(
        "online",
        handleOnline,
      );
    };
  }, []);

  /* =====================================================
     CREATE NOTE

     New note প্রথমে local database-এ তৈরি হবে।
     Editor-এ typing করলে আর parent update হবে না।
  ===================================================== */

  const handleCreateNote =
    useCallback(async () => {
      try {
        const newNote =
          await addNote({
            title: "",

            blocks: [
              {
                id: `block-${Date.now()}`,
                type: "text",
                text: "",
              },
            ],

            pinned: false,
          });

        setNotes(
          (previous) => [
            newNote,

            ...previous.filter(
              (note) =>
                note.id !==
                newNote.id,
            ),
          ],
        );

        setSelectedNoteId(
          newNote.id,
        );
      } catch (error) {
        console.error(
          "Failed to create note:",
          error,
        );
      }
    }, []);

  /* =====================================================
     SELECT NOTE
  ===================================================== */

  const handleSelectNote =
    useCallback((note: Note) => {
      setSelectedNoteId(
        note.id,
      );
    }, []);

  /* =====================================================
     SAVE NOTE

     IMPORTANT:
     এই function শুধুমাত্র Save button click করলে
     call হবে।

     Typing-এর সময় এই function call হবে না।
  ===================================================== */

  const handleSaveNote =
    useCallback(
      async (
        updatedNote: Note,
      ) => {
        try {
          const savedNote =
            await saveNote(
              updatedNote,
            );

          setNotes(
            (previous) => {
              const exists =
                previous.some(
                  (note) =>
                    note.id ===
                    savedNote.id,
                );

              if (!exists) {
                return [
                  savedNote,
                  ...previous,
                ];
              }

              return previous
                .map((note) =>
                  note.id ===
                  savedNote.id
                    ? savedNote
                    : note,
                )
                .sort(
                  (a, b) =>
                    b.updatedAt -
                    a.updatedAt,
                );
            },
          );
        } catch (error) {
          console.error(
            "Failed to save note:",
            error,
          );

          throw error;
        }
      },
      [],
    );

  /* =====================================================
     DELETE NOTE
  ===================================================== */

  const handleDeleteNote =
    useCallback(
      async (note: Note) => {
        try {
          await deleteNote(
            note.id,
          );

          setNotes(
            (previous) =>
              previous.filter(
                (item) =>
                  item.id !==
                  note.id,
              ),
          );

          setSelectedNoteId(
            (current) =>
              current === note.id
                ? null
                : current,
          );
        } catch (error) {
          console.error(
            "Failed to delete note:",
            error,
          );
        }
      },
      [],
    );

  /* =====================================================
     PIN / UNPIN

     Pin action আলাদাভাবে immediately save হবে।
     এটা typing-এর সাথে connected না।
  ===================================================== */

  const handleTogglePin =
    useCallback(
      async (note: Note) => {
        try {
          const updatedNote =
            await toggleNotePin(
              note.id,
            );

          if (!updatedNote) {
            return;
          }

          setNotes(
            (previous) =>
              previous
                .map((item) =>
                  item.id ===
                  updatedNote.id
                    ? updatedNote
                    : item,
                )
                .sort(
                  (a, b) =>
                    b.updatedAt -
                    a.updatedAt,
                ),
          );
        } catch (error) {
          console.error(
            "Failed to toggle note pin:",
            error,
          );
        }
      },
      [],
    );

  /* =====================================================
     SELECTED NOTE
  ===================================================== */

  const selectedNote =
    notes.find(
      (note) =>
        note.id ===
        selectedNoteId,
    ) ?? null;

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-green-600" />

          <span className="text-xs text-gray-400">
            Loading notes...
          </span>
        </div>
      </div>
    );
  }

  /* =====================================================
     EDITOR
     
     key ব্যবহার করা হয়েছে যাতে নতুন note select করলে
     NoteEditor-এর local draft নতুন note দিয়ে শুরু হয়।

     সবচেয়ে গুরুত্বপূর্ণ:
     এখানে আর onChange নেই।

     তাই typing -> parent state -> Firebase
     এই chain আর হবে না।
  ===================================================== */

  if (selectedNote) {
    return (
      <div className="h-full min-h-0">
        <NoteEditor
          key={selectedNote.id}
          note={selectedNote}
          onSave={
            handleSaveNote
          }
          onDelete={async () => {
            await handleDeleteNote(
              selectedNote,
            );
          }}
          onClose={() =>
            setSelectedNoteId(
              null,
            )
          }
        />
      </div>
    );
  }

  /* =====================================================
     LIST
  ===================================================== */

  return (
    <div className="relative h-full min-h-0">
      <NoteList
        notes={notes}
        selectedNoteId={
          selectedNoteId
        }
        onSelectNote={
          handleSelectNote
        }
        onTogglePin={
          handleTogglePin
        }
        onDelete={
          handleDeleteNote
        }
        onCreateNote={
          handleCreateNote
        }
      />

      {/* Mobile create button */}

      <button
        type="button"
        onClick={
          handleCreateNote
        }
        className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition hover:bg-green-700 sm:hidden"
        aria-label="Create note"
      >
        <Plus size={22} />
      </button>
    </div>
  );
}