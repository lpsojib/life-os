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

/* ================================================= */
/* TYPES */
/* ================================================= */

type NoteFilter =
  | "all"
  | "paragraph"
  | "checkbox"
  | "both"
  | "pinned";

/* ================================================= */
/* CREATE EMPTY NOTE */
/* ================================================= */

function createEmptyNote(
  id: string,
): Note {
  const now =
    new Date().toISOString();

  return {
    id,

    title: "Untitled Note",

    type: "text",

    content: "",

    blocks: [],

    checklist: [],

    pinned: false,

    createdAt: now,

    updatedAt: now,
  };
}

/* ================================================= */
/* PAGE */
/* ================================================= */

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

  /* ================================================= */
  /* FILTER */
  /* ================================================= */

  const filteredNotes =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return notes
        .filter((note) => {
          const {
            hasParagraph,
            hasCheckbox,
          } =
            getNoteContentType(note);

          switch (activeFilter) {
            case "paragraph":
              if (
                !hasParagraph ||
                hasCheckbox
              ) {
                return false;
              }
              break;

            case "checkbox":
              if (
                !hasCheckbox ||
                hasParagraph
              ) {
                return false;
              }
              break;

            case "both":
              if (
                !hasParagraph ||
                !hasCheckbox
              ) {
                return false;
              }
              break;

            case "pinned":
              if (!note.pinned) {
                return false;
              }
              break;

            case "all":
            default:
              break;
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
            (note.blocks ?? []).some(
              (block) =>
                block.text
                  ?.toLowerCase()
                  .includes(query),
            );

          return (
            title.includes(query) ||
            content.includes(query) ||
            blockMatch
          );
        })
        .sort((a, b) => {
          /*
           * Pinned notes always stay
           * above normal notes.
           */
          if (
            a.pinned &&
            !b.pinned
          ) {
            return -1;
          }

          if (
            !a.pinned &&
            b.pinned
          ) {
            return 1;
          }

          return (
            new Date(
              b.updatedAt,
            ).getTime() -
            new Date(
              a.updatedAt,
            ).getTime()
          );
        });
    }, [
      notes,
      search,
      activeFilter,
    ]);

  /* ================================================= */
  /* CREATE */
  /* ================================================= */

  async function handleCreateNote() {
    if (creating) {
      return;
    }

    try {
      setCreating(true);

      /*
       * Create local/Firebase note.
       * Service saves local first.
       */
      const noteId =
        await addNote(
          "Untitled Note",
          "text",
          "",
        );

      const newNote =
        createEmptyNote(noteId);

      /*
       * Immediately show in UI.
       */
      addNoteToStore(
        newNote,
      );

      /*
       * Open editor.
       */
      setEditingNote(
        newNote,
      );
    } catch (error) {
      console.error(
        "Failed to create note:",
        error,
      );
    } finally {
      setCreating(false);
    }
  }

  /* ================================================= */
  /* EDIT / AUTO SAVE */
/* ================================================= */

  function handleEditorChange(
    updatedNote: Note,
  ) {
    /*
     * Update UI immediately.
     */
    updateNoteInStore(
      updatedNote,
    );
  }

  /* ================================================= */
  /* DELETE */
/* ================================================= */

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

      /*
       * Remove immediately from UI.
       */
      deleteNoteFromStore(
        noteId,
      );

      /*
       * Remove locally and mark
       * Firebase delete as pending.
       */
      await deleteNote(
        noteId,
      );

      /*
       * Close editor if open.
       */
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

  /* ================================================= */
  /* PIN */
/* ================================================= */

  async function handleTogglePin(
    note: Note,
  ) {
    const nextPinned =
      !note.pinned;

    /*
     * Update UI immediately.
     */
    updateNotePinInStore(
      note.id,
      nextPinned,
    );

    /*
     * Update currently opened
     * editor as well.
     */
    if (
      editingNote?.id ===
      note.id
    ) {
      setEditingNote({
        ...editingNote,
        pinned: nextPinned,
        updatedAt:
          new Date().toISOString(),
      });
    }

    try {
      await toggleNotePin(
        note.id,
        nextPinned,
      );
    } catch (error) {
      console.error(
        "Failed to update pin:",
        error,
      );

      /*
       * Roll UI back if local
       * save unexpectedly fails.
       */
      updateNotePinInStore(
        note.id,
        note.pinned,
      );
    }
  }

  /* ================================================= */
  /* LOADING */
/* ================================================= */

  if (
    loading &&
    notes.length === 0
  ) {
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

  /* ================================================= */
  /* ERROR */
/* ================================================= */

  if (
    error &&
    notes.length === 0
  ) {
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

  /* ================================================= */
  /* UI */
/* ================================================= */

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

          {/* ========================================= */}
          {/* HEADER */}
          {/* ========================================= */}

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

          {/* ========================================= */}
          {/* SEARCH */}
          {/* ========================================= */}

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

          {/* ========================================= */}
          {/* FILTER BAR */}
          {/* ========================================= */}

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
                items-center
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
                count={notes.length}
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
                  <Pin
                    size={15}
                  />
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

          {/* ========================================= */}
          {/* SECTION TITLE */}
          {/* ========================================= */}

          <div
            className="
              mb-3
              mt-8
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
              {getFilterLabel(
                activeFilter,
              )}
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

          {/* ========================================= */}
          {/* NOTES */}
          {/* ========================================= */}

          {filteredNotes.length ===
          0 ? (
            <EmptyState
              filter={activeFilter}
              onCreate={
                handleCreateNote
              }
            />
          ) : (
            <div
              className="
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

      {/* =========================================== */}
      {/* EDITOR */}
      {/* =========================================== */}

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

/* ================================================= */
/* FILTER BUTTON */
/* ================================================= */

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}

function FilterButton({
  active,
  onClick,
  icon,
  label,
  count,
}: FilterButtonProps) {
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
            ? "bg-green-600 text-white shadow-sm"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
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
              ? "bg-white/20 text-white"
              : "bg-gray-100 text-gray-400"
          }
        `}
      >
        {count}
      </span>
    </button>
  );
}

/* ================================================= */
/* NOTE CARD */
/* ================================================= */

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
  const blocks =
    note.blocks ?? [];

  const {
    hasParagraph,
    hasCheckbox,
  } =
    getNoteContentType(note);

  const textBlocks =
    blocks.filter(
      (block) =>
        block.type === "text" &&
        block.text.trim() !== "",
    );

  const checklistBlocks =
    blocks.filter(
      (block) =>
        block.type ===
          "checklist" &&
        block.text.trim() !== "",
    );

  const preview =
    textBlocks
      .map(
        (block) =>
          block.text,
      )
      .join(" ")
      .trim() ||
    note.content?.trim() ||
    "No content";

  const totalChecklist =
    checklistBlocks.length ||
    note.checklist.length;

  const completedChecklist =
    checklistBlocks.filter(
      (block) =>
        Boolean(block.completed),
    ).length;

  return (
    <div
      className={`
        group
        relative
        rounded-2xl
        border
        bg-white
        p-5
        shadow-sm
        transition
        hover:-translate-y-0.5
        hover:shadow-md
        ${
          note.pinned
            ? "border-green-200 ring-1 ring-green-100"
            : "border-gray-100"
        }
      `}
    >
      {/* ========================================= */}
      {/* PIN BAR */}
      {/* ========================================= */}

      {note.pinned && (
        <div
          className="
            absolute
            left-0
            right-0
            top-0
            h-1
            rounded-t-2xl
            bg-green-500
          "
        />
      )}

      {/* ========================================= */}
      {/* PIN */}
      {/* ========================================= */}

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
          <Pin
            size={16}
          />
        ) : (
          <PinOff
            size={16}
          />
        )}
      </button>

      {/* ========================================= */}
      {/* NOTE BODY */}
      {/* ========================================= */}

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
            <FileText
              size={18}
            />
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
                leading-5
                text-gray-500
              "
            >
              {preview}
            </p>
          </div>
        </div>

        {/* ======================================= */}
        {/* BADGES */}
        {/* ======================================= */}

        <div
          className="
            mt-4
            flex
            flex-wrap
            items-center
            gap-2
          "
        >
          {hasParagraph &&
            hasCheckbox && (
              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-lg
                  bg-purple-50
                  px-2
                  py-1
                  text-[10px]
                  font-medium
                  text-purple-600
                "
              >
                <Layers3
                  size={12}
                />
                Both
              </span>
            )}

          {hasParagraph &&
            !hasCheckbox && (
              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-lg
                  bg-blue-50
                  px-2
                  py-1
                  text-[10px]
                  font-medium
                  text-blue-600
                "
              >
                <FileText
                  size={12}
                />
                Paragraph
              </span>
            )}

          {hasCheckbox &&
            !hasParagraph && (
              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-lg
                  bg-orange-50
                  px-2
                  py-1
                  text-[10px]
                  font-medium
                  text-orange-600
                "
              >
                <CheckSquare
                  size={12}
                />
                Checkbox
              </span>
            )}

          {note.pinned && (
            <span
              className="
                inline-flex
                items-center
                gap-1
                rounded-lg
                bg-green-50
                px-2
                py-1
                text-[10px]
                font-medium
                text-green-600
              "
            >
              <Pin size={11} />
              Pinned
            </span>
          )}

          {hasCheckbox && (
            <span
              className="
                text-[10px]
                text-gray-400
              "
            >
              {completedChecklist}/
              {totalChecklist}{" "}
              done
            </span>
          )}
        </div>
      </button>

      {/* ========================================= */}
      {/* FOOTER */}
      {/* ========================================= */}

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
            deletingId ===
            note.id
          }
          className="
            rounded-lg
            p-2
            text-gray-400
            transition
            hover:bg-red-50
            hover:text-red-500
            disabled:opacity-50
          "
          title="Delete note"
        >
          <Trash2
            size={16}
          />
        </button>
      </div>
    </div>
  );
}

/* ================================================= */
/* EMPTY STATE */
/* ================================================= */

interface EmptyStateProps {
  filter: NoteFilter;
  onCreate: () => void;
}

function EmptyState({
  filter,
  onCreate,
}: EmptyStateProps) {
  return (
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
        {filter ===
        "checkbox" ? (
          <CheckSquare
            size={22}
          />
        ) : filter ===
          "pinned" ? (
          <Pin size={22} />
        ) : filter ===
          "both" ? (
          <Layers3
            size={22}
          />
        ) : (
          <FileText
            size={22}
          />
        )}
      </div>

      <h2
        className="
          mt-4
          font-semibold
          text-gray-800
        "
      >
        {getEmptyTitle(
          filter,
        )}
      </h2>

      <p
        className="
          mt-1
          text-sm
          text-gray-400
        "
      >
        {getEmptyDescription(
          filter,
        )}
      </p>

      {filter === "all" && (
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
          <Plus
            size={17}
          />
          Create Note
        </button>
      )}
    </div>
  );
}

/* ================================================= */
/* HELPERS */
/* ================================================= */

function getNoteContentType(
  note: Note,
) {
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
    (note.checklist?.length ??
      0) > 0;

  return {
    hasParagraph,
    hasCheckbox,
  };
}

function getParagraphCount(
  notes: Note[],
) {
  return notes.filter(
    (note) => {
      const {
        hasParagraph,
        hasCheckbox,
      } =
        getNoteContentType(
          note,
        );

      return (
        hasParagraph &&
        !hasCheckbox
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
        hasParagraph,
        hasCheckbox,
      } =
        getNoteContentType(
          note,
        );

      return (
        hasCheckbox &&
        !hasParagraph
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
        hasParagraph,
        hasCheckbox,
      } =
        getNoteContentType(
          note,
        );

      return (
        hasParagraph &&
        hasCheckbox
      );
    },
  ).length;
}

function getFilterLabel(
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

    case "all":
    default:
      return "All Notes";
  }
}

function getEmptyTitle(
  filter: NoteFilter,
) {
  switch (filter) {
    case "paragraph":
      return "No paragraph notes";

    case "checkbox":
      return "No checkbox notes";

    case "both":
      return "No mixed notes";

    case "pinned":
      return "No pinned notes";

    case "all":
    default:
      return "No notes found";
  }
}

function getEmptyDescription(
  filter: NoteFilter,
) {
  switch (filter) {
    case "paragraph":
      return "Notes containing only paragraphs will appear here.";

    case "checkbox":
      return "Notes containing only checklists will appear here.";

    case "both":
      return "Notes containing both paragraphs and checklists will appear here.";

    case "pinned":
      return "Pin a note and it will appear here.";

    case "all":
    default:
      return "Create your first note to get started.";
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