"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bold,
  Check,
  CheckSquare,
  Pin,
  PinOff,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Note,
  NoteBlock,
} from "../types/notebook.types";

import {
  createLocalId,
  deleteNote,
  saveNote,
  toggleNotePin,
} from "../services/notebook.service";

/* =========================================================
   PROPS
========================================================= */

interface NoteEditorProps {
  note: Note;
  onChange?: (note: Note) => void;
  onSave?: (
    note: Note,
  ) => Promise<void> | void;
  onDelete?: () =>
    | Promise<void>
    | void;
  onClose: () => void;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function NoteEditor({
  note,
  onChange,
  onSave,
  onDelete,
  onClose,
}: NoteEditorProps) {
  /*
   * IMPORTANT:
   * We initialize state directly from note.
   *
   * We DO NOT use:
   *
   * useEffect(() => {
   *   setCurrentNote(note);
   * }, [note]);
   *
   * This prevents React's cascading-render warning.
   */
  const [currentNote, setCurrentNote] =
    useState<Note>(() => ({
      ...note,
      blocks: note.blocks.map(
        (block) => ({
          ...block,
        }),
      ),
    }));

  const [selectedType, setSelectedType] =
    useState<
      "text" | "checklist" | null
    >(null);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const saveTimer =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  /* =======================================================
     CLEANUP AUTO SAVE TIMER
  ======================================================= */

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(
          saveTimer.current,
        );

        saveTimer.current = null;
      }
    };
  }, []);

  /* =======================================================
     UPDATE NOTE
  ======================================================= */

  function updateNote(
    updater:
      | Partial<Note>
      | ((previous: Note) => Note),
  ) {
    setCurrentNote((previous) => {
      const updated =
        typeof updater === "function"
          ? updater(previous)
          : {
              ...previous,
              ...updater,
            };

      const finalNote: Note = {
        ...updated,
        updatedAt: Date.now(),
      };

      onChange?.(finalNote);

      scheduleSave(finalNote);

      return finalNote;
    });
  }

  /* =======================================================
     AUTO SAVE
  ======================================================= */

  function scheduleSave(
    updatedNote: Note,
  ) {
    if (saveTimer.current) {
      clearTimeout(
        saveTimer.current,
      );
    }

    saveTimer.current =
      setTimeout(() => {
        void persistNote(
          updatedNote,
        );
      }, 400);
  }

  /* =======================================================
     SAVE
  ======================================================= */

  async function persistNote(
    updatedNote: Note,
  ) {
    try {
      setSaving(true);

      const saved =
        await saveNote(
          updatedNote,
        );

      setCurrentNote(
        (previous) => ({
          ...previous,
          ...saved,
        }),
      );

      onChange?.(saved);

      if (onSave) {
        await onSave(saved);
      }
    } catch (error) {
      console.error(
        "Failed to save note:",
        error,
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     TITLE
  ======================================================= */

  function handleTitleChange(
    value: string,
  ) {
    updateNote({
      title: value,
    });
  }

  /* =======================================================
     BLOCK UPDATE
  ======================================================= */

  function updateBlock(
    blockId: string,
    changes: Partial<NoteBlock>,
  ) {
    updateNote((previous) => ({
      ...previous,

      blocks:
        previous.blocks.map(
          (block) =>
            block.id === blockId
              ? {
                  ...block,
                  ...changes,
                }
              : block,
        ),
    }));
  }

  /* =======================================================
     ADD BLOCK
  ======================================================= */

  function addBlock(
    type:
      | "text"
      | "checklist",
    afterId?: string,
  ) {
    const newBlock: NoteBlock =
      type === "checklist"
        ? {
            id: createLocalId(),
            type: "checklist",
            text: "",
            checked: false,
          }
        : {
            id: createLocalId(),
            type: "text",
            text: "",
          };

    updateNote((previous) => {
      if (!afterId) {
        return {
          ...previous,
          blocks: [
            ...previous.blocks,
            newBlock,
          ],
        };
      }

      const index =
        previous.blocks.findIndex(
          (block) =>
            block.id === afterId,
        );

      if (index === -1) {
        return {
          ...previous,
          blocks: [
            ...previous.blocks,
            newBlock,
          ],
        };
      }

      const blocks = [
        ...previous.blocks,
      ];

      blocks.splice(
        index + 1,
        0,
        newBlock,
      );

      return {
        ...previous,
        blocks,
      };
    });
  }

  /* =======================================================
     DELETE BLOCK
  ======================================================= */

  function removeBlock(
    blockId: string,
  ) {
    updateNote((previous) => {
      let blocks =
        previous.blocks.filter(
          (block) =>
            block.id !== blockId,
        );

      /*
       * Keep one empty text block.
       */
      if (blocks.length === 0) {
        blocks = [
          {
            id: createLocalId(),
            type: "text",
            text: "",
          },
        ];
      }

      return {
        ...previous,
        blocks,
      };
    });
  }

  /* =======================================================
     MOVE BLOCK
  ======================================================= */

  function moveBlock(
    blockId: string,
    direction: "up" | "down",
  ) {
    updateNote((previous) => {
      const blocks = [
        ...previous.blocks,
      ];

      const index =
        blocks.findIndex(
          (block) =>
            block.id === blockId,
        );

      if (index === -1) {
        return previous;
      }

      const newIndex =
        direction === "up"
          ? index - 1
          : index + 1;

      if (
        newIndex < 0 ||
        newIndex >= blocks.length
      ) {
        return previous;
      }

      const [
        movedBlock,
      ] = blocks.splice(
        index,
        1,
      );

      blocks.splice(
        newIndex,
        0,
        movedBlock,
      );

      return {
        ...previous,
        blocks,
      };
    });
  }

  /* =======================================================
     KEYBOARD
  ======================================================= */

  function handleBlockKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
    block: NoteBlock,
  ) {
    /*
     * ENTER
     *
     * Creates another block
     * of the same type.
     */
    if (event.key === "Enter") {
      event.preventDefault();

      addBlock(
        block.type,
        block.id,
      );

      return;
    }

    /*
     * BACKSPACE
     *
     * Empty block gets deleted.
     */
    if (
      event.key === "Backspace" &&
      block.text.length === 0
    ) {
      event.preventDefault();

      if (
        currentNote.blocks
          .length > 1
      ) {
        removeBlock(block.id);
      }

      return;
    }
  }

  /* =======================================================
     SELECT TYPE
  ======================================================= */

  function handleTypeSelect(
    type:
      | "text"
      | "checklist",
  ) {
    setSelectedType(
      (previous) =>
        previous === type
          ? null
          : type,
    );
  }

  /* =======================================================
     ADD SELECTED TYPE
  ======================================================= */

  function addSelectedBlock() {
    if (!selectedType) {
      return;
    }

    addBlock(
      selectedType,
    );
  }

  /* =======================================================
     PIN / UNPIN
  ======================================================= */

  async function handleTogglePin() {
    try {
      const updated =
        await toggleNotePin(
          currentNote.id,
        );

      if (!updated) {
        return;
      }

      setCurrentNote(updated);

      onChange?.(updated);

      if (onSave) {
        await onSave(updated);
      }
    } catch (error) {
      console.error(
        "Failed to toggle note pin:",
        error,
      );
    }
  }

  /* =======================================================
     DELETE NOTE
  ======================================================= */

  async function handleDelete() {
    if (deleting) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this note?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      /*
       * Cancel pending save.
       */
      if (saveTimer.current) {
        clearTimeout(
          saveTimer.current,
        );

        saveTimer.current = null;
      }

      await deleteNote(
        currentNote.id,
      );

      if (onDelete) {
        await onDelete();
      } else {
        onClose();
      }
    } catch (error) {
      console.error(
        "Failed to delete note:",
        error,
      );
    } finally {
      setDeleting(false);
    }
  }

  /* =======================================================
     BOLD
  ======================================================= */

  function handleBold() {
    /*
     * execCommand is used only
     * for browser text selection.
     */
    try {
      document.execCommand(
        "bold",
        false,
      );
    } catch (error) {
      console.error(
        "Bold command failed:",
        error,
      );
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex min-h-full flex-col bg-white">
      {/* =================================================
          TOP BAR
      ================================================= */}

      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-3 py-2 sm:px-5">
        {/* BACK */}

        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100"
          aria-label="Close"
        >
          <ArrowLeft
            size={19}
          />
        </button>

        {/* ACTIONS */}

        <div className="flex items-center gap-1">
          {saving && (
            <span className="mr-2 text-xs text-gray-400">
              Saving...
            </span>
          )}

          {/* PIN */}

          <button
            type="button"
            onClick={
              handleTogglePin
            }
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              currentNote.pinned
                ? "bg-green-50 text-green-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            aria-label={
              currentNote.pinned
                ? "Unpin"
                : "Pin"
            }
          >
            {currentNote.pinned ? (
              <PinOff
                size={18}
              />
            ) : (
              <Pin size={18} />
            )}
          </button>

          {/* DELETE */}

          <button
            type="button"
            onClick={
              handleDelete
            }
            disabled={deleting}
            className="flex h-9 w-9 items-center justify-center rounded-full text-red-500 transition hover:bg-red-50 disabled:opacity-50"
            aria-label="Delete"
          >
            <Trash2
              size={18}
            />
          </button>
        </div>
      </div>

      {/* =================================================
          EDITOR AREA
      ================================================= */}

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 sm:px-7 sm:py-7">
        {/* TITLE */}

        <input
          value={
            currentNote.title
          }
          onChange={(event) =>
            handleTitleChange(
              event.target.value,
            )
          }
          placeholder="Title"
          className="mb-4 w-full border-0 bg-transparent text-xl font-semibold leading-tight text-black outline-none placeholder:text-gray-400 sm:text-2xl"
        />

        {/* BLOCKS */}

        <div className="space-y-1">
          {currentNote.blocks.map(
            (
              block,
              index,
            ) => (
              <div
                key={block.id}
                className="group relative flex items-start gap-1 rounded-md py-0.5"
              >
                {/* =================================================
                    CHECKBOX
                ================================================= */}

                {block.type ===
                  "checklist" && (
                  <button
                    type="button"
                    onClick={() =>
                      updateBlock(
                        block.id,
                        {
                          checked:
                            !Boolean(
                              block.checked,
                            ),
                        },
                      )
                    }
                    className={`mt-[4px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition ${
                      block.checked
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-gray-400 bg-white"
                    }`}
                    aria-label="Toggle checklist"
                  >
                    {block.checked && (
                      <Check
                        size={13}
                        strokeWidth={
                          2.5
                        }
                      />
                    )}
                  </button>
                )}

                {/* =================================================
                    TEXTAREA
                ================================================= */}

                <textarea
                  value={
                    block.text
                  }
                  onChange={(
                    event,
                  ) =>
                    updateBlock(
                      block.id,
                      {
                        text:
                          event
                            .target
                            .value,
                      },
                    )
                  }
                  onKeyDown={(
                    event,
                  ) =>
                    handleBlockKeyDown(
                      event,
                      block,
                    )
                  }
                  rows={1}
                  placeholder={
                    block.type ===
                    "checklist"
                      ? "Checklist item"
                      : "Write something..."
                  }
                  className={`min-h-[26px] flex-1 resize-none overflow-hidden border-0 bg-transparent px-0 py-0 text-[15px] leading-[1.4] text-black outline-none placeholder:text-gray-400 ${
                    block.type ===
                      "checklist" &&
                    block.checked
                      ? "text-gray-400 line-through"
                      : ""
                  }`}
                  onInput={(
                    event,
                  ) => {
                    const target =
                      event.currentTarget;

                    target.style.height =
                      "auto";

                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />

                {/* =================================================
                    BLOCK CONTROLS
                ================================================= */}

                <div className="mt-0.5 flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                  {/* UP */}

                  <button
                    type="button"
                    onClick={() =>
                      moveBlock(
                        block.id,
                        "up",
                      )
                    }
                    disabled={
                      index === 0
                    }
                    className="flex h-7 w-7 items-center justify-center rounded text-gray-500 transition hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-20"
                    aria-label="Move block up"
                  >
                    <ArrowUp
                      size={14}
                    />
                  </button>

                  {/* DOWN */}

                  <button
                    type="button"
                    onClick={() =>
                      moveBlock(
                        block.id,
                        "down",
                      )
                    }
                    disabled={
                      index ===
                      currentNote
                        .blocks
                        .length -
                        1
                    }
                    className="flex h-7 w-7 items-center justify-center rounded text-gray-500 transition hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-20"
                    aria-label="Move block down"
                  >
                    <ArrowDown
                      size={14}
                    />
                  </button>

                  {/* DELETE */}

                  <button
                    type="button"
                    onClick={() =>
                      removeBlock(
                        block.id,
                      )
                    }
                    className="flex h-7 w-7 items-center justify-center rounded text-red-500 transition hover:bg-red-50"
                    aria-label="Delete block"
                  >
                    <X
                      size={15}
                    />
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      {/* =================================================
          BOTTOM TOOLBAR
      ================================================= */}

      <div className="sticky bottom-0 z-20 border-t border-gray-200 bg-white px-3 py-2.5 sm:px-5">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2">
          {/* LEFT */}

          <div className="flex items-center gap-1">
            {/* BOLD */}

            <button
              type="button"
              onClick={
                handleBold
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100"
              aria-label="Bold"
            >
              <Bold
                size={18}
              />
            </button>

            {/* TEXT */}

            <button
              type="button"
              onClick={() =>
                handleTypeSelect(
                  "text",
                )
              }
              className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm transition ${
                selectedType ===
                "text"
                  ? "bg-green-50 text-green-600"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Plus
                size={15}
              />

              <span>
                Text
              </span>
            </button>

            {/* CHECKLIST */}

            <button
              type="button"
              onClick={() =>
                handleTypeSelect(
                  "checklist",
                )
              }
              className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm transition ${
                selectedType ===
                "checklist"
                  ? "bg-green-50 text-green-600"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <CheckSquare
                size={16}
              />

              <span>
                Checklist
              </span>
            </button>
          </div>

          {/* ADD */}

          <button
            type="button"
            onClick={
              addSelectedBlock
            }
            disabled={
              !selectedType
            }
            className="flex h-9 items-center gap-1.5 rounded-lg bg-green-600 px-3.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus
              size={16}
            />

            <span>
              Add
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}