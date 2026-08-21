"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  FileText,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  addNote,
  deleteNote,
  toggleNotePin,
  updateNote,
} from "../services/notebook.service";

import { useNotes } from "../hooks/useNotes";

import NoteEditor from "./NoteEditor";

import {
  Note,
} from "../types/notebook.types";

function createEmptyNote(): Note {
  return {
    id: crypto.randomUUID(),

    title: "",

    type: "text",

    content: "",

    blocks: [],

    checklist: [],

    pinned: false,

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),
  };
}

export default function NotebookPage() {
  const {
    notes,
    loading,
    error,
  } = useNotes();

  const [search, setSearch] =
    useState("");

  const [editingNote, setEditingNote] =
    useState<Note | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [creating, setCreating] =
    useState(false);

  const filteredNotes =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return notes;
      }

      return notes.filter((note) => {
        const title =
          note.title
            ?.toLowerCase() ?? "";

        const content =
          note.content
            ?.toLowerCase() ?? "";

        const blockMatch =
          note.blocks?.some(
            (block) =>
              block.text
                ?.toLowerCase()
                .includes(query),
          ) ?? false;

        return (
          title.includes(query) ||
          content.includes(query) ||
          blockMatch
        );
      });
    }, [notes, search]);

  const pinnedNotes =
    filteredNotes.filter(
      (note) => note.pinned,
    );

  const normalNotes =
    filteredNotes.filter(
      (note) => !note.pinned,
    );

  async function handleCreateNote() {
    if (creating) {
      return;
    }

    try {
      setCreating(true);

      const noteId =
        await addNote(
          "Untitled Note",
          "text",
          "",
        );

      const newNote: Note = {
        ...createEmptyNote(),
        id: noteId,
      };

      setEditingNote(newNote);
    } catch (error) {
      console.error(
        "Failed to create note:",
        error,
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteNote(
    noteId: string,
  ) {
    if (deletingId) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this note?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(noteId);

      await deleteNote(noteId);

      if (
        editingNote?.id ===
        noteId
      ) {
        setEditingNote(null);
      }
    } catch (error) {
      console.error(
        "Failed to delete note:",
        error,
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleTogglePin(
    note: Note,
  ) {
    try {
      await toggleNotePin(
        note.id,
        !note.pinned,
      );
    } catch (error) {
      console.error(
        "Failed to update pin:",
        error,
      );
    }
  }

  async function handleSaveNote(
    updatedNote: Note,
  ) {
    await updateNote(
      updatedNote.id,
      {
        title:
          updatedNote.title,
        type:
          updatedNote.type,
        content:
          updatedNote.content,
        blocks:
          updatedNote.blocks,
        checklist:
          updatedNote.checklist,
        pinned:
          updatedNote.pinned,
      },
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div
          className="
            mx-auto
            max-w-6xl
            rounded-2xl
            border
            border-gray-100
            bg-white
            p-8
            text-center
            text-sm
            text-gray-500
          "
        >
          Loading notes...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          className="
            mx-auto
            max-w-6xl
            rounded-2xl
            border
            border-red-100
            bg-red-50
            p-6
            text-sm
            text-red-600
          "
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="
          min-h-full
          bg-gray-50
          p-4
          sm:p-6
        "
      >
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div
            className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <h1
                className="
                  text-2xl
                  font-bold
                  text-gray-900
                  sm:text-3xl
                "
              >
                Notebook
              </h1>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                Write, organize and
                save your thoughts.
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleCreateNote
              }
              disabled={creating}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-green-600
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-green-700
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <Plus size={18} />

              {creating
                ? "Creating..."
                : "New Note"}
            </button>
          </div>

          {/* Search */}
          <div className="mt-6">
            <div
              className="
                flex
                items-center
                gap-3
                rounded-xl
                border
                border-gray-200
                bg-white
                px-4
                py-3
              "
            >
              <Search
                size={18}
                className="text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search notes..."
                className="
                  w-full
                  border-0
                  bg-transparent
                  text-sm
                  text-gray-900
                  outline-none
                  placeholder:text-gray-400
                "
              />
            </div>
          </div>

          {/* Pinned Notes */}
          {pinnedNotes.length >
            0 && (
            <section className="mt-8">
              <div
                className="
                  mb-3
                  flex
                  items-center
                  gap-2
                "
              >
                <Pin
                  size={16}
                  className="text-green-600"
                />

                <h2
                  className="
                    text-sm
                    font-semibold
                    text-gray-800
                  "
                >
                  Pinned
                </h2>
              </div>

              <div
                className="
                  grid
                  gap-4
                  sm:grid-cols-2
                  lg:grid-cols-3
                "
              >
                {pinnedNotes.map(
                  (note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      deletingId={
                        deletingId
                      }
                      onOpen={() =>
                        setEditingNote(
                          note,
                        )
                      }
                      onDelete={() =>
                        handleDeleteNote(
                          note.id,
                        )
                      }
                      onTogglePin={() =>
                        handleTogglePin(
                          note,
                        )
                      }
                    />
                  ),
                )}
              </div>
            </section>
          )}

          {/* All Notes */}
          <section className="mt-8">
            <div
              className="
                mb-3
                flex
                items-center
                justify-between
              "
            >
              <h2
                className="
                  text-sm
                  font-semibold
                  text-gray-800
                "
              >
                All Notes
              </h2>

              <span
                className="
                  text-xs
                  text-gray-400
                "
              >
                {filteredNotes.length}{" "}
                {filteredNotes.length ===
                1
                  ? "note"
                  : "notes"}
              </span>
            </div>

            {normalNotes.length ===
              0 &&
            pinnedNotes.length ===
              0 ? (
              <div
                className="
                  rounded-2xl
                  border
                  border-dashed
                  border-gray-200
                  bg-white
                  p-10
                  text-center
                "
              >
                <div
                  className="
                    mx-auto
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-xl
                    bg-green-50
                    text-green-600
                  "
                >
                  <FileText
                    size={22}
                  />
                </div>

                <h2
                  className="
                    mt-4
                    font-semibold
                    text-gray-800
                  "
                >
                  No notes found
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-gray-400
                  "
                >
                  Create your first
                  note to get started.
                </p>

                <button
                  type="button"
                  onClick={
                    handleCreateNote
                  }
                  className="
                    mt-5
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-green-600
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-green-700
                  "
                >
                  <Plus size={17} />
                  Create Note
                </button>
              </div>
            ) : normalNotes.length ===
              0 ? (
              <div
                className="
                  rounded-2xl
                  border
                  border-dashed
                  border-gray-200
                  bg-white
                  p-8
                  text-center
                  text-sm
                  text-gray-400
                "
              >
                All notes are pinned.
              </div>
            ) : (
              <div
                className="
                  grid
                  gap-4
                  sm:grid-cols-2
                  lg:grid-cols-3
                "
              >
                {normalNotes.map(
                  (note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      deletingId={
                        deletingId
                      }
                      onOpen={() =>
                        setEditingNote(
                          note,
                        )
                      }
                      onDelete={() =>
                        handleDeleteNote(
                          note.id,
                        )
                      }
                      onTogglePin={() =>
                        handleTogglePin(
                          note,
                        )
                      }
                    />
                  ),
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Note Editor */}
      {editingNote && (
        <NoteEditor
          note={editingNote}
          onSave={handleSaveNote}
          onClose={() =>
            setEditingNote(null)
          }
        />
      )}
    </>
  );
}

interface NoteCardProps {
  note: Note;
  deletingId: string | null;
  onOpen: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

function NoteCard({
  note,
  deletingId,
  onOpen,
  onDelete,
  onTogglePin,
}: NoteCardProps) {
  const textBlocks =
    note.blocks?.filter(
      (block) =>
        block.type === "text" &&
        block.text.trim(),
    ) ?? [];

  const checklistBlocks =
    note.blocks?.filter(
      (block) =>
        block.type ===
        "checklist",
    ) ?? [];

  const preview =
    textBlocks
      .map(
        (block) => block.text,
      )
      .join(" ")
      .trim() ||
    note.content ||
    "No content";

  const completedCount =
    checklistBlocks.filter(
      (block) =>
        Boolean(block.completed),
    ).length;

  return (
    <div
      className="
        group
        relative
        rounded-2xl
        border
        border-gray-100
        bg-white
        p-5
        shadow-sm
        transition
        hover:-translate-y-0.5
        hover:shadow-md
      "
    >
      {/* Pin Button */}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onTogglePin();
        }}
        className="
          absolute
          right-3
          top-3
          rounded-lg
          p-2
          text-gray-400
          transition
          hover:bg-green-50
          hover:text-green-600
        "
        title={
          note.pinned
            ? "Unpin note"
            : "Pin note"
        }
      >
        {note.pinned ? (
          <Pin size={16} />
        ) : (
          <PinOff size={16} />
        )}
      </button>

      {/* Open Note */}
      <button
        type="button"
        onClick={onOpen}
        className="
          block
          w-full
          text-left
        "
      >
        <div
          className="
            flex
            items-start
            gap-3
            pr-8
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-green-50
              text-green-600
            "
          >
            <FileText size={18} />
          </div>

          <div className="min-w-0">
            <h3
              className="
                truncate
                font-semibold
                text-gray-900
              "
            >
              {note.title ||
                "Untitled Note"}
            </h3>

            <p
              className="
                mt-1
                line-clamp-3
                text-sm
                leading-6
                text-gray-500
              "
            >
              {preview}
            </p>
          </div>
        </div>

        {/* Checklist */}
        {checklistBlocks.length >
          0 && (
          <div
            className="
              mt-4
              rounded-lg
              bg-gray-50
              px-3
              py-2
              text-xs
              text-gray-500
            "
          >
            Checklist:{" "}
            <span className="font-medium">
              {completedCount}/
              {
                checklistBlocks.length
              }
            </span>{" "}
            completed
          </div>
        )}
      </button>

      {/* Bottom Actions */}
      <div
        className="
          mt-4
          flex
          items-center
          justify-between
          border-t
          border-gray-100
          pt-3
        "
      >
        <span
          className="
            text-[11px]
            text-gray-400
          "
        >
          Updated{" "}
          {formatDate(
            note.updatedAt,
          )}
        </span>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          disabled={
            deletingId === note.id
          }
          className="
            rounded-lg
            p-2
            text-gray-400
            transition
            hover:bg-red-50
            hover:text-red-500
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
          title="Delete note"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function formatDate(
  value: string,
): string {
  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
    },
  );
}