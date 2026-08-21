"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  CheckSquare,
  FileText,
  Layers3,
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

import {
  addNoteToStore,
  deleteNoteFromStore,
  updateNoteInStore,
  updateNotePinInStore,
  useNotes,
} from "../hooks/useNotes";

import NoteEditor from "./NoteEditor";

import {
  Note,
} from "../types/notebook.types";

type NoteFilter =
  | "all"
  | "paragraph"
  | "checkbox"
  | "both"
  | "pinned";

function createEmptyNote(
  id: string,
): Note {
  const now =
    new Date().toISOString();

  return {
    id,
    title: "",
    type: "text",
    content: "",
    blocks: [],
    checklist: [],
    pinned: false,
    createdAt: now,
    updatedAt: now,
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

  const [activeFilter, setActiveFilter] =
    useState<NoteFilter>("all");

  const [editingNote, setEditingNote] =
    useState<Note | null>(null);

  const [creating, setCreating] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const filteredNotes =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return notes.filter((note) => {
        const blocks =
          note.blocks ?? [];

        const hasParagraph =
          blocks.some(
            (block) =>
              block.type === "text" &&
              block.text.trim() !== "",
          ) ||
          Boolean(
            note.content?.trim(),
          );

        const hasCheckbox =
          blocks.some(
            (block) =>
              block.type ===
                "checklist" &&
              block.text.trim() !== "",
          ) ||
          note.checklist.length > 0;

        let matchesFilter = true;

        if (
          activeFilter ===
          "paragraph"
        ) {
          matchesFilter =
            hasParagraph &&
            !hasCheckbox;
        }

        if (
          activeFilter ===
          "checkbox"
        ) {
          matchesFilter =
            hasCheckbox &&
            !hasParagraph;
        }

        if (
          activeFilter ===
          "both"
        ) {
          matchesFilter =
            hasParagraph &&
            hasCheckbox;
        }

        if (
          activeFilter ===
          "pinned"
        ) {
          matchesFilter =
            note.pinned;
        }

        if (!matchesFilter) {
          return false;
        }

        if (!query) {
          return true;
        }

        const title =
          note.title
            ?.toLowerCase() ?? "";

        const content =
          note.content
            ?.toLowerCase() ?? "";

        const blockMatch =
          blocks.some((block) =>
            block.text
              ?.toLowerCase()
              .includes(query),
          );

        return (
          title.includes(query) ||
          content.includes(query) ||
          blockMatch
        );
      });
    }, [
      notes,
      search,
      activeFilter,
    ]);

  /* -------------------------------- */
  /* Create */
  /* -------------------------------- */

  async function handleCreateNote() {
    if (creating) {
      return;
    }

    setCreating(true);

    const tempId =
      crypto.randomUUID();

    const localNote =
      createEmptyNote(tempId);

    /*
     * IMPORTANT:
     * Show note immediately.
     */
    addNoteToStore(
      localNote,
    );

    setEditingNote(
      localNote,
    );

    try {
      /*
       * Firebase creation runs
       * in background.
       */
      const firebaseId =
        await addNote(
          "Untitled Note",
          "text",
          "",
        );

      /*
       * Replace temporary ID.
       */
      const firebaseNote =
        createEmptyNote(
          firebaseId,
        );

      updateNoteInStore(
        firebaseNote,
      );
    } catch (error) {
      console.warn(
        "Offline note created locally:",
        error,
      );
    } finally {
      setCreating(false);
    }
  }

  /* -------------------------------- */
  /* Editor Change */
  /* -------------------------------- */

  function handleEditorChange(
    updatedNote: Note,
  ) {
    /*
     * Update UI immediately.
     */
    updateNoteInStore(
      updatedNote,
    );

    setEditingNote(
      updatedNote,
    );
  }

  /* -------------------------------- */
  /* Delete */
  /* -------------------------------- */

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

    /*
     * Remove immediately.
     */
    deleteNoteFromStore(
      noteId,
    );

    if (
      editingNote?.id ===
      noteId
    ) {
      setEditingNote(null);
    }

    setDeletingId(noteId);

    try {
      await deleteNote(noteId);
    } catch (error) {
      console.warn(
        "Offline delete. Firebase sync will happen later.",
        error,
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* -------------------------------- */
  /* Pin */
/* -------------------------------- */

  async function handleTogglePin(
    note: Note,
  ) {
    const newPinned =
      !note.pinned;

    /*
     * Update immediately.
     */
    updateNotePinInStore(
      note.id,
      newPinned,
    );

    try {
      await toggleNotePin(
        note.id,
        newPinned,
      );
    } catch (error) {
      console.warn(
        "Offline pin update:",
        error,
      );
    }
  }

  /* -------------------------------- */
  /* Save */
  /* -------------------------------- */

  async function handleSaveNote(
    updatedNote: Note,
  ) {
    /*
     * UI/local save first.
     */
    updateNoteInStore(
      updatedNote,
    );

    try {
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
    } catch (error) {
      console.warn(
        "Offline note save. Saved locally.",
        error,
      );
    }
  }

  /*
   * IMPORTANT:
   * Do NOT show loading screen here.
   *
   * Local notes must appear immediately.
   */

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
                "
              />
            </div>
          </div>

          {/* Filter */}

          <div
            className="
              mt-4
              overflow-x-auto
              rounded-2xl
              border
              border-gray-200
              bg-white
              p-1.5
            "
          >
            <div
              className="
                flex
                min-w-max
                gap-1
              "
            >
              <FilterButton
                active={
                  activeFilter ===
                  "all"
                }
                onClick={() =>
                  setActiveFilter(
                    "all",
                  )
                }
                icon={
                  <FileText
                    size={15}
                  />
                }
                label="All Notes"
                count={
                  notes.length
                }
              />

              <FilterButton
                active={
                  activeFilter ===
                  "paragraph"
                }
                onClick={() =>
                  setActiveFilter(
                    "paragraph",
                  )
                }
                icon={
                  <FileText
                    size={15}
                  />
                }
                label="Paragraph"
                count={getParagraphCount(
                  notes,
                )}
              />

              <FilterButton
                active={
                  activeFilter ===
                  "checkbox"
                }
                onClick={() =>
                  setActiveFilter(
                    "checkbox",
                  )
                }
                icon={
                  <CheckSquare
                    size={15}
                  />
                }
                label="Checkbox"
                count={getCheckboxCount(
                  notes,
                )}
              />

              <FilterButton
                active={
                  activeFilter ===
                  "both"
                }
                onClick={() =>
                  setActiveFilter(
                    "both",
                  )
                }
                icon={
                  <Layers3
                    size={15}
                  />
                }
                label="Both"
                count={getBothCount(
                  notes,
                )}
              />

              <FilterButton
                active={
                  activeFilter ===
                  "pinned"
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
                count={
                  notes.filter(
                    (note) =>
                      note.pinned,
                  ).length
                }
              />
            </div>
          </div>

          {/* Status */}

          <div
            className="
              mt-6
              flex
              items-center
              justify-between
            "
          >
            <h2 className="text-sm font-semibold text-gray-800">
              {getFilterLabel(
                activeFilter,
              )}
            </h2>

            <span className="text-xs text-gray-400">
              {filteredNotes.length}{" "}
              {filteredNotes.length ===
              1
                ? "note"
                : "notes"}
            </span>
          </div>

          {/* Firebase error should NOT replace notes */}

          {error && (
            <div className="mt-3 rounded-xl bg-yellow-50 px-4 py-2 text-xs text-yellow-700">
              Offline mode — local
              notes are being used.
            </div>
          )}

          {/* Notes */}

          {filteredNotes.length ===
          0 ? (
            <div
              className="
                mt-5
                rounded-2xl
                border
                border-dashed
                border-gray-200
                bg-white
                p-10
                text-center
              "
            >
              <FileText
                className="mx-auto text-gray-300"
                size={32}
              />

              <h2 className="mt-3 font-semibold text-gray-800">
                No notes found
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Create your first
                note.
              </p>

              {activeFilter ===
                "all" && (
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
                  "
                >
                  <Plus size={17} />
                  Create Note
                </button>
              )}
            </div>
          ) : (
            <div
              className="
                mt-5
                grid
                gap-4
                sm:grid-cols-2
                lg:grid-cols-3
              "
            >
              {filteredNotes.map(
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
        </div>
      </div>

      {/* Editor */}

      {editingNote && (
        <NoteEditor
          note={editingNote}
          onChange={
            handleEditorChange
          }
          onClose={() =>
            setEditingNote(null)
          }
        />
      )}
    </>
  );
}

/* -------------------------------- */
/* Filter Button */
/* -------------------------------- */

function FilterButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
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
        px-3
        py-2
        text-xs
        font-medium
        transition
        ${
          active
            ? "bg-green-600 text-white"
            : "text-gray-500 hover:bg-gray-100"
        }
      `}
    >
      {icon}

      {label}

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

/* -------------------------------- */
/* Card */
/* -------------------------------- */

function NoteCard({
  note,
  deletingId,
  onOpen,
  onDelete,
  onTogglePin,
}: {
  note: Note;
  deletingId: string | null;
  onOpen: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  const blocks =
    note.blocks ?? [];

  const textBlocks =
    blocks.filter(
      (block) =>
        block.type === "text" &&
        block.text.trim(),
    );

  const checklistBlocks =
    blocks.filter(
      (block) =>
        block.type ===
          "checklist" &&
        block.text.trim(),
    );

  const hasParagraph =
    textBlocks.length > 0 ||
    Boolean(note.content?.trim());

  const hasCheckbox =
    checklistBlocks.length > 0 ||
    note.checklist.length > 0;

  const preview =
    textBlocks
      .map(
        (block) =>
          block.text,
      )
      .join(" ") ||
    note.content ||
    "No content";

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
        hover:shadow-md
      "
    >
      {/* Pin */}

      <button
        type="button"
        onClick={onTogglePin}
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
      >
        {note.pinned ? (
          <Pin size={16} />
        ) : (
          <PinOff size={16} />
        )}
      </button>

      {/* Open */}

      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left"
      >
        <div className="pr-8">
          <h3 className="font-semibold text-gray-900">
            {note.title ||
              "Untitled Note"}
          </h3>

          <p className="mt-2 line-clamp-3 text-sm leading-5 text-gray-500">
            {preview}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {hasParagraph &&
            hasCheckbox && (
              <span className="rounded-lg bg-purple-50 px-2 py-1 text-[10px] text-purple-600">
                Both
              </span>
            )}

          {hasParagraph &&
            !hasCheckbox && (
              <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] text-blue-600">
                Paragraph
              </span>
            )}

          {hasCheckbox &&
            !hasParagraph && (
              <span className="rounded-lg bg-orange-50 px-2 py-1 text-[10px] text-orange-600">
                Checkbox
              </span>
            )}
        </div>
      </button>

      {/* Bottom */}

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-[11px] text-gray-400">
          {formatDate(
            note.updatedAt,
          )}
        </span>

        <button
          type="button"
          onClick={onDelete}
          disabled={
            deletingId === note.id
          }
          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------- */
/* Helpers */
/* -------------------------------- */

function getType(
  note: Note,
) {
  const blocks =
    note.blocks ?? [];

  const paragraph =
    blocks.some(
      (block) =>
        block.type === "text" &&
        block.text.trim(),
    ) ||
    Boolean(note.content?.trim());

  const checkbox =
    blocks.some(
      (block) =>
        block.type ===
          "checklist" &&
        block.text.trim(),
    ) ||
    note.checklist.length > 0;

  return {
    paragraph,
    checkbox,
  };
}

function getParagraphCount(
  notes: Note[],
) {
  return notes.filter(
    (note) => {
      const {
        paragraph,
        checkbox,
      } = getType(note);

      return (
        paragraph && !checkbox
      );
    },
  ).length;
}

function getCheckboxCount(
  notes: Note[],
) {
  return notes.filter(
    (note) => {
      const {
        paragraph,
        checkbox,
      } = getType(note);

      return (
        checkbox && !paragraph
      );
    },
  ).length;
}

function getBothCount(
  notes: Note[],
) {
  return notes.filter(
    (note) => {
      const {
        paragraph,
        checkbox,
      } = getType(note);

      return (
        paragraph && checkbox
      );
    },
  ).length;
}

function getFilterLabel(
  filter: NoteFilter,
) {
  switch (filter) {
    case "paragraph":
      return "Paragraph";

    case "checkbox":
      return "Checkbox";

    case "both":
      return "Both";

    case "pinned":
      return "Pinned";

    default:
      return "All Notes";
  }
}

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
    },
  );
}