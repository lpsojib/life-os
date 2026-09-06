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
     
     React Strict Mode / React 19 lint rule-এর কারণে
     effect-এর ভিতরে সরাসরি loadNotes() call না করে
     requestAnimationFrame ব্যবহার করা হয়েছে।
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
     NOTE CHANGE
  ===================================================== */

  const handleNoteChange =
    useCallback(
      (updatedNote: Note) => {
        setNotes(
          (previous) => {
            const exists =
              previous.some(
                (note) =>
                  note.id ===
                  updatedNote.id,
              );

            if (!exists) {
              return [
                updatedNote,
                ...previous,
              ];
            }

            return previous
              .map((note) =>
                note.id ===
                updatedNote.id
                  ? updatedNote
                  : note,
              )
              .sort(
                (a, b) =>
                  b.updatedAt -
                  a.updatedAt,
              );
          },
        );
      },
      [],
    );

  /* =====================================================
     SAVE NOTE
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

          handleNoteChange(
            savedNote,
          );
        } catch (error) {
          console.error(
            "Failed to save note:",
            error,
          );
        }
      },
      [handleNoteChange],
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

          handleNoteChange(
            updatedNote,
          );
        } catch (error) {
          console.error(
            "Failed to toggle note pin:",
            error,
          );
        }
      },
      [handleNoteChange],
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
  ===================================================== */

  if (selectedNote) {
    return (
      <div className="h-full min-h-0">
        <NoteEditor
          note={selectedNote}
          onChange={
            handleNoteChange
          }
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