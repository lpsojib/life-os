"use client";

import {
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  CheckSquare,
  FileText,
  Layers3,
  Pin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  addNote,
  deleteNote,
  saveNote,
  toggleNotePin,
} from "../services/notebook.service";

import { useNotes } from "../hooks/useNotes";

import type { Note } from "../types/notebook.types";

import NoteEditor from "./NoteEditor";

/* =========================================================
   FILTER TYPE
========================================================= */

type NoteFilter =
  | "all"
  | "paragraph"
  | "checkbox"
  | "both"
  | "pinned";

/* =========================================================
   NOTEBOOK PAGE
========================================================= */

export default function NotebookPage() {
  const {
    notes,
    loading,
    error,
    reload: refresh,
  } = useNotes();

  const [search, setSearch] =
    useState("");

  const [activeFilter, setActiveFilter] =
    useState<NoteFilter>("all");

  const [editingNote, setEditingNote] =
    useState<Note | null>(null);

  const [creating, setCreating] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  /* =======================================================
     FILTER NOTES
  ======================================================= */

  const filteredNotes = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return notes.filter((note) => {
      const blocks =
        Array.isArray(note.blocks)
          ? note.blocks
          : [];

      const hasParagraph =
        blocks.some(
          (block) =>
            block.type === "text" &&
            typeof block.text === "string" &&
            block.text.trim().length > 0,
        );

      const hasCheckbox =
        blocks.some(
          (block) =>
            block.type === "checklist" &&
            typeof block.text === "string" &&
            block.text.trim().length > 0,
        );

      /* =====================================================
         FILTER
      ===================================================== */

      if (
        activeFilter === "paragraph" &&
        !(hasParagraph && !hasCheckbox)
      ) {
        return false;
      }

      if (
        activeFilter === "checkbox" &&
        !(hasCheckbox && !hasParagraph)
      ) {
        return false;
      }

      if (
        activeFilter === "both" &&
        !(hasParagraph && hasCheckbox)
      ) {
        return false;
      }

      if (
        activeFilter === "pinned" &&
        !note.pinned
      ) {
        return false;
      }

      /* =====================================================
         SEARCH
      ===================================================== */

      if (!query) {
        return true;
      }

      const title =
        typeof note.title === "string"
          ? note.title.toLowerCase()
          : "";

      const blockText =
        blocks
          .map((block) =>
            typeof block.text === "string"
              ? block.text
              : "",
          )
          .join(" ")
          .toLowerCase();

      return (
        title.includes(query) ||
        blockText.includes(query)
      );
    });
  }, [
    notes,
    search,
    activeFilter,
  ]);

  /* =======================================================
     COUNTS
  ======================================================= */

  const counts = useMemo(() => {
    let paragraph = 0;
    let checkbox = 0;
    let both = 0;
    let pinned = 0;

    for (const note of notes) {
      const blocks =
        Array.isArray(note.blocks)
          ? note.blocks
          : [];

      const hasParagraph =
        blocks.some(
          (block) =>
            block.type === "text" &&
            typeof block.text === "string" &&
            block.text.trim().length > 0,
        );

      const hasCheckbox =
        blocks.some(
          (block) =>
            block.type === "checklist" &&
            typeof block.text === "string" &&
            block.text.trim().length > 0,
        );

      if (
        hasParagraph &&
        hasCheckbox
      ) {
        both++;
      } else if (hasParagraph) {
        paragraph++;
      } else if (hasCheckbox) {
        checkbox++;
      }

      if (note.pinned) {
        pinned++;
      }
    }

    return {
      paragraph,
      checkbox,
      both,
      pinned,
    };
  }, [notes]);

  /* =======================================================
     CREATE NOTE
  ======================================================= */

  async function handleCreateNote() {
    if (creating) {
      return;
    }

    setCreating(true);

    try {
      /*
       * Title intentionally empty.
       */
      const note =
        await addNote("");

      setEditingNote(note);

      await refresh();
    } catch (error) {
      console.error(
        "Could not create note:",
        error,
      );
    } finally {
      setCreating(false);
    }
  }

  /* =======================================================
     EDITOR CHANGE
  ======================================================= */

  function handleEditorChange(
    note: Note,
  ) {
    setEditingNote(note);
  }

  /* =======================================================
     SAVE NOTE
  ======================================================= */

  async function handleSaveNote(
    note: Note,
  ) {
    try {
      const saved =
        await saveNote(note);

      setEditingNote(saved);

      await refresh();
    } catch (error) {
      console.error(
        "Could not save note:",
        error,
      );
    }
  }

  /* =======================================================
     DELETE NOTE
  ======================================================= */

  async function handleDeleteNote(
    noteId: string,
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this note?",
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(noteId);

    try {
      await deleteNote(noteId);

      if (
        editingNote?.id === noteId
      ) {
        setEditingNote(null);
      }

      await refresh();
    } catch (error) {
      console.error(
        "Could not delete note:",
        error,
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* =======================================================
     TOGGLE PIN
  ======================================================= */

  async function handleTogglePin(
    note: Note,
  ) {
    try {
      const updated =
        await toggleNotePin(note);

      if (
        editingNote?.id === note.id
      ) {
        setEditingNote(updated);
      }

      await refresh();
    } catch (error) {
      console.error(
        "Could not update pin:",
        error,
      );
    }
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="min-h-full bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Notebook
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Write, organize and keep your thoughts.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateNote}
            disabled={creating}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-green-600
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              shadow-sm
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

        {/* =================================================
            SEARCH
        ================================================= */}

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-3 px-1">

            <Search
              size={19}
              className="shrink-0 text-gray-400"
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
                bg-transparent
                text-sm
                text-gray-900
                outline-none
                placeholder:text-gray-400
              "
            />
          </div>
        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="mt-4 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2">

            <FilterButton
              active={
                activeFilter === "all"
              }
              onClick={() =>
                setActiveFilter("all")
              }
              icon={
                <FileText size={15} />
              }
              label="All Notes"
              count={notes.length}
            />

            <FilterButton
              active={
                activeFilter === "paragraph"
              }
              onClick={() =>
                setActiveFilter(
                  "paragraph",
                )
              }
              icon={
                <FileText size={15} />
              }
              label="Paragraph"
              count={counts.paragraph}
            />

            <FilterButton
              active={
                activeFilter === "checkbox"
              }
              onClick={() =>
                setActiveFilter(
                  "checkbox",
                )
              }
              icon={
                <CheckSquare size={15} />
              }
              label="Checkbox"
              count={counts.checkbox}
            />

            <FilterButton
              active={
                activeFilter === "both"
              }
              onClick={() =>
                setActiveFilter("both")
              }
              icon={
                <Layers3 size={15} />
              }
              label="Both"
              count={counts.both}
            />

            <FilterButton
              active={
                activeFilter === "pinned"
              }
              onClick={() =>
                setActiveFilter(
                  "pinned",
                )
              }
              icon={
                <Pin size={15} />
              }
              label="Pinned"
              count={counts.pinned}
            />

          </div>
        </div>

        {/* =================================================
            STATUS
        ================================================= */}

        <div className="mt-6 flex items-center justify-between">

          <div>
            <h2 className="font-semibold text-gray-800">
              {getFilterName(
                activeFilter,
              )}
            </h2>

            <p className="mt-0.5 text-xs text-gray-400">
              {filteredNotes.length}{" "}
              {filteredNotes.length === 1
                ? "note"
                : "notes"}
            </p>
          </div>

          {loading && (
            <span className="text-xs text-gray-400">
              Loading...
            </span>
          )}
        </div>

        {/* =================================================
            ERROR / OFFLINE
        ================================================= */}

        {error && (
          <div className="mt-4 rounded-xl border border-yellow-100 bg-yellow-50 px-4 py-3 text-xs text-yellow-700">
            Offline mode — your local notes are still available.
          </div>
        )}

        {/* =================================================
            NOTES
        ================================================= */}

        {filteredNotes.length === 0 ? (
          <EmptyState
            onCreate={
              handleCreateNote
            }
          />
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {filteredNotes.map(
              (note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  deleting={
                    deletingId === note.id
                  }
                  onOpen={() =>
                    setEditingNote(note)
                  }
                  onDelete={() =>
                    handleDeleteNote(
                      note.id,
                    )
                  }
                  onPin={() =>
                    handleTogglePin(
                      note,
                    )
                  }
                />
              ),
            )}

          </div>
        )}
      </div>

      {/* =================================================
          NOTE EDITOR
      ================================================= */}

      {editingNote && (
        <NoteEditor
          note={editingNote}
          onChange={
            handleEditorChange
          }
          onSave={
            handleSaveNote
          }
          onDelete={() =>
            handleDeleteNote(
              editingNote.id,
            )
          }
          onClose={() =>
            setEditingNote(null)
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   FILTER BUTTON
========================================================= */

function FilterButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex
        items-center
        gap-2
        rounded-xl
        border
        px-4
        py-2.5
        text-xs
        font-semibold
        transition
        ${
          active
            ? "border-green-600 bg-green-600 text-white shadow-sm"
            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        }
      `}
    >
      {icon}

      <span>
        {label}
      </span>

      <span
        className={`
          rounded-full
          px-1.5
          py-0.5
          text-[10px]
          ${
            active
              ? "bg-white/20"
              : "bg-gray-100"
          }
        `}
      >
        {count}
      </span>
    </button>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">

      <FileText
        size={40}
        className="mx-auto text-gray-300"
      />

      <h3 className="mt-4 font-semibold text-gray-800">
        No notes found
      </h3>

      <p className="mt-1 text-sm text-gray-400">
        Create a new note to get started.
      </p>

      <button
        type="button"
        onClick={onCreate}
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
  );
}

/* =========================================================
   NOTE CARD
========================================================= */

function NoteCard({
  note,
  deleting,
  onOpen,
  onDelete,
  onPin,
}: {
  note: Note;
  deleting: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onPin: () => void;
}) {
  const blocks =
    Array.isArray(note.blocks)
      ? note.blocks
      : [];

  /* =======================================================
     TEXT BLOCKS
  ======================================================= */

  const textParts =
    blocks
      .filter(
        (block) =>
          block.type === "text" &&
          typeof block.text === "string" &&
          block.text.trim().length > 0,
      )
      .map(
        (block) => block.text,
      );

  /* =======================================================
     CHECKLIST BLOCKS
  ======================================================= */

  const checklistParts =
    blocks
      .filter(
        (block) =>
          block.type === "checklist" &&
          typeof block.text === "string" &&
          block.text.trim().length > 0,
      )
      .map(
        (block) => block.text,
      );

  const hasParagraph =
    textParts.length > 0;

  const hasCheckbox =
    checklistParts.length > 0;

  /* =======================================================
     PREVIEW
  ======================================================= */

  const preview =
    textParts.join(" ") ||
    checklistParts.join(" • ") ||
    "Empty note";

  return (
    <div className="
      group
      relative
      overflow-hidden
      rounded-2xl
      border
      border-gray-200
      bg-white
      p-5
      shadow-sm
      transition
      hover:-translate-y-0.5
      hover:shadow-md
    ">

      {/* =================================================
          PIN
      ================================================= */}

      <button
        type="button"
        onClick={onPin}
        className={`
          absolute
          right-3
          top-3
          rounded-lg
          p-2
          transition
          ${
            note.pinned
              ? "bg-green-50 text-green-600"
              : "text-gray-400 hover:bg-gray-100"
          }
        `}
        title={
          note.pinned
            ? "Unpin note"
            : "Pin note"
        }
      >
        <Pin size={17} />
      </button>

      {/* =================================================
          OPEN
      ================================================= */}

      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left"
      >
        <h4 className="pr-10 font-semibold text-gray-900">
          {note.title || "Untitled Note"}
        </h4>

        <p className="
          mt-3
          line-clamp-4
          text-sm
          leading-6
          text-gray-500
        ">
          {preview}
        </p>

        {/* =================================================
            TYPE BADGES
        ================================================= */}

        <div className="mt-4 flex flex-wrap gap-2">

          {hasParagraph && (
            <span className="
              rounded-lg
              bg-blue-50
              px-2.5
              py-1
              text-[10px]
              font-medium
              text-blue-600
            ">
              Paragraph
            </span>
          )}

          {hasCheckbox && (
            <span className="
              rounded-lg
              bg-orange-50
              px-2.5
              py-1
              text-[10px]
              font-medium
              text-orange-600
            ">
              Checkbox
            </span>
          )}

          {hasParagraph &&
            hasCheckbox && (
              <span className="
                rounded-lg
                bg-purple-50
                px-2.5
                py-1
                text-[10px]
                font-medium
                text-purple-600
              ">
                Both
              </span>
            )}

        </div>
      </button>

      {/* =================================================
          FOOTER
      ================================================= */}

      <div className="
        mt-5
        flex
        items-center
        justify-between
        border-t
        border-gray-100
        pt-3
      ">

        <span className="text-[11px] text-gray-400">
          {formatDate(
            note.updatedAt,
          )}
        </span>

        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-lg
            px-2
            py-1.5
            text-xs
            font-medium
            text-red-400
            transition
            hover:bg-red-50
            hover:text-red-600
            disabled:opacity-50
          "
        >
          <Trash2 size={14} />

          {deleting
            ? "Deleting..."
            : "Delete"}
        </button>

      </div>
    </div>
  );
}

/* =========================================================
   FILTER NAME
========================================================= */

function getFilterName(
  filter: NoteFilter,
) {
  switch (filter) {
    case "paragraph":
      return "Paragraph Notes";

    case "checkbox":
      return "Checkbox Notes";

    case "both":
      return "Paragraph + Checkbox";

    case "pinned":
      return "Pinned Notes";

    default:
      return "All Notes";
  }
}

/* =========================================================
   DATE
========================================================= */

function formatDate(
  value: string,
) {
  const date =
    new Date(value);

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
      year: "numeric",
    },
  );
}