"use client";

import {
  Pin,
  PinOff,
  Trash2,
  X,
  GripVertical,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  Note,
  NoteBlock,
} from "../types/notebook.types";

interface NoteEditorProps {
  note: Note;
  onSave?: (
    note: Note,
  ) => void | Promise<void>;
  onDelete?: (
    note: Note,
  ) => void | Promise<void>;
  onTogglePin?: (
    note: Note,
  ) => void | Promise<void>;
  onClose?: () => void;
}

function createBlockId(): string {
  return `block-${Math.random()
    .toString(36)
    .slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function cloneNote(note: Note): Note {
  return {
    ...note,
    blocks: note.blocks.map(
      (block) => ({
        ...block,
      }),
    ),
  };
}

export default function NoteEditor({
  note,
  onSave,
  onDelete,
  onTogglePin,
  onClose,
}: NoteEditorProps) {
  /* =====================================================
     LOCAL DRAFT

     Typing-এর সময় parent বা Firebase update হবে না।

     শুধু Save button চাপলে onSave() call হবে।
  ===================================================== */

  const [draft, setDraft] =
    useState<Note>(() =>
      cloneNote(note),
    );

  const [saving, setSaving] =
    useState(false);

  const [savedMessage, setSavedMessage] =
    useState(false);

  /* =====================================================
     DRAG STATE
  ===================================================== */

  const [draggedIndex, setDraggedIndex] =
    useState<number | null>(null);

  const [dragOverIndex, setDragOverIndex] =
    useState<number | null>(null);

  /* =====================================================
     TITLE
  ===================================================== */

  const changeTitle = (
    value: string,
  ) => {
    setSavedMessage(false);

    setDraft(
      (previous) => ({
        ...previous,
        title: value,
      }),
    );
  };

  /* =====================================================
     BLOCK TEXT
  ===================================================== */

  const changeBlock = (
    blockId: string,
    value: string,
  ) => {
    setSavedMessage(false);

    setDraft(
      (previous) => ({
        ...previous,

        blocks:
          previous.blocks.map(
            (block) =>
              block.id ===
              blockId
                ? {
                    ...block,
                    text: value,
                  }
                : block,
          ),
      }),
    );
  };

  /* =====================================================
     CHECKLIST
  ===================================================== */

  const toggleCheck = (
    blockId: string,
  ) => {
    setSavedMessage(false);

    setDraft(
      (previous) => ({
        ...previous,

        blocks:
          previous.blocks.map(
            (block) =>
              block.id ===
              blockId
                ? {
                    ...block,
                    checked:
                      !block.checked,
                  }
                : block,
          ),
      }),
    );
  };

  /* =====================================================
     ADD BLOCK
  ===================================================== */

  const addBlock = (
    index: number,
  ) => {
    setSavedMessage(false);

    setDraft(
      (previous) => {
        const currentBlock =
          previous.blocks[index];

        const newBlock: NoteBlock =
          currentBlock?.type ===
          "checklist"
            ? {
                id: createBlockId(),
                type: "checklist",
                text: "",
                checked: false,
              }
            : {
                id: createBlockId(),
                type: "text",
                text: "",
              };

        const blocks = [
          ...previous.blocks.slice(
            0,
            index + 1,
          ),

          newBlock,

          ...previous.blocks.slice(
            index + 1,
          ),
        ];

        return {
          ...previous,
          blocks,
        };
      },
    );
  };

  /* =====================================================
     DELETE BLOCK
  ===================================================== */

  const deleteBlock = (
    blockId: string,
  ) => {
    setSavedMessage(false);

    setDraft(
      (previous) => {
        let blocks =
          previous.blocks.filter(
            (block) =>
              block.id !==
              blockId,
          );

        /*
         * সব block delete হয়ে গেলে
         * একটি empty text block থাকবে।
         */

        if (
          blocks.length === 0
        ) {
          blocks = [
            {
              id: createBlockId(),
              type: "text",
              text: "",
            },
          ];
        }

        return {
          ...previous,
          blocks,
        };
      },
    );
  };

  /* =====================================================
     MOVE BLOCK UP
  ===================================================== */

  const moveUp = (
    index: number,
  ) => {
    if (index <= 0) {
      return;
    }

    setSavedMessage(false);

    setDraft(
      (previous) => {
        const blocks = [
          ...previous.blocks,
        ];

        const temp =
          blocks[index];

        blocks[index] =
          blocks[index - 1];

        blocks[index - 1] =
          temp;

        return {
          ...previous,
          blocks,
        };
      },
    );
  };

  /* =====================================================
     MOVE BLOCK DOWN
  ===================================================== */

  const moveDown = (
    index: number,
  ) => {
    setSavedMessage(false);

    setDraft(
      (previous) => {
        if (
          index >=
          previous.blocks.length -
            1
        ) {
          return previous;
        }

        const blocks = [
          ...previous.blocks,
        ];

        const temp =
          blocks[index];

        blocks[index] =
          blocks[index + 1];

        blocks[index + 1] =
          temp;

        return {
          ...previous,
          blocks,
        };
      },
    );
  };

  /* =====================================================
     DRAG START
  ===================================================== */

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    setDraggedIndex(index);
    setDragOverIndex(index);

    event.dataTransfer.effectAllowed =
      "move";

    event.dataTransfer.setData(
      "text/plain",
      String(index),
    );
  };

  /* =====================================================
     DRAG OVER
  ===================================================== */

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    event.preventDefault();

    event.dataTransfer.dropEffect =
      "move";

    if (
      dragOverIndex !== index
    ) {
      setDragOverIndex(index);
    }
  };

  /* =====================================================
     DROP
  ===================================================== */

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    targetIndex: number,
  ) => {
    event.preventDefault();

    const sourceValue =
      event.dataTransfer.getData(
        "text/plain",
      );

    const sourceIndex =
      sourceValue !== ""
        ? Number(sourceValue)
        : draggedIndex;

    if (
      sourceIndex === null ||
      sourceIndex === undefined ||
      Number.isNaN(sourceIndex) ||
      sourceIndex === targetIndex
    ) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setSavedMessage(false);

    setDraft(
      (previous) => {
        const blocks = [
          ...previous.blocks,
        ];

        const [movedBlock] =
          blocks.splice(
            sourceIndex,
            1,
          );

        if (!movedBlock) {
          return previous;
        }

        blocks.splice(
          targetIndex,
          0,
          movedBlock,
        );

        return {
          ...previous,
          blocks,
        };
      },
    );

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  /* =====================================================
     DRAG END
  ===================================================== */

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  /* =====================================================
     KEYBOARD
  ===================================================== */

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number,
  ) => {
    const block =
      draft.blocks[index];

    if (!block) {
      return;
    }

    /*
     * Enter = নতুন একই ধরনের block
     */

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      addBlock(index);

      return;
    }

    /*
     * Empty block + Backspace
     * = block delete
     */

    if (
      event.key === "Backspace" &&
      block.text === "" &&
      draft.blocks.length > 1
    ) {
      event.preventDefault();

      deleteBlock(block.id);
    }
  };

  /* =====================================================
     TEXT MODE
  ===================================================== */

  const makeText = () => {
    setSavedMessage(false);

    setDraft(
      (previous) => ({
        ...previous,

        blocks:
          previous.blocks.map(
            (block) => ({
              id: block.id,
              type: "text",
              text: block.text,
            }),
          ),
      }),
    );
  };

  /* =====================================================
     CHECKLIST MODE
  ===================================================== */

  const makeChecklist = () => {
    setSavedMessage(false);

    setDraft(
      (previous) => ({
        ...previous,

        blocks:
          previous.blocks.map(
            (block) => ({
              id: block.id,
              type: "checklist",
              text: block.text,
              checked:
                block.checked ??
                false,
            }),
          ),
      }),
    );
  };

  /* =====================================================
     PIN / UNPIN
  ===================================================== */

  const togglePin = async () => {
    const updatedNote: Note = {
      ...draft,
      pinned: !draft.pinned,
    };

    setDraft(updatedNote);

    setSavedMessage(false);

    /*
     * যদি page থেকে onTogglePin দেওয়া থাকে,
     * তাহলে সেটা ব্যবহার করবে।
     */

    if (onTogglePin) {
      await onTogglePin(
        updatedNote,
      );

      return;
    }

    /*
     * Otherwise normal Save.
     */

    if (onSave) {
      try {
        setSaving(true);

        await onSave(
          updatedNote,
        );

        setSavedMessage(true);

        window.setTimeout(() => {
          setSavedMessage(false);
        }, 2000);
      } finally {
        setSaving(false);
      }
    }
  };

  /* =====================================================
     SAVE
  ===================================================== */

  const handleSave = async () => {
    if (
      !onSave ||
      saving
    ) {
      return;
    }

    try {
      setSaving(true);

      setSavedMessage(false);

      await onSave(draft);

      setSavedMessage(true);

      window.setTimeout(() => {
        setSavedMessage(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Failed to save note:",
        error,
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     DELETE NOTE
  ===================================================== */

  const handleDelete = async () => {
    if (!onDelete) {
      return;
    }

    await onDelete(draft);
  };

  /* =====================================================
     TEXTAREA AUTO HEIGHT
  ===================================================== */

  const handleInput = (
    event: React.FormEvent<HTMLTextAreaElement>,
  ) => {
    const textarea =
      event.currentTarget;

    textarea.style.height =
      "auto";

    textarea.style.height = `${Math.max(
      28,
      textarea.scrollHeight,
    )}px`;
  };

  /* =====================================================
     TYPE STATUS
  ===================================================== */

  const allText =
    draft.blocks.length > 0 &&
    draft.blocks.every(
      (block) =>
        block.type === "text",
    );

  const allChecklist =
    draft.blocks.length > 0 &&
    draft.blocks.every(
      (block) =>
        block.type ===
        "checklist",
    );

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">

        <div className="flex items-center gap-1">

          {/* CLOSE */}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          )}

          {/* PIN */}

          <button
            type="button"
            onClick={() =>
              void togglePin()
            }
            disabled={saving}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
              draft.pinned
                ? "bg-green-50 text-green-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
            aria-label={
              draft.pinned
                ? "Unpin note"
                : "Pin note"
            }
          >
            {draft.pinned ? (
              <PinOff size={16} />
            ) : (
              <Pin size={16} />
            )}
          </button>

        </div>

        {/* RIGHT ACTIONS */}

        <div className="flex items-center gap-2">

          {/* SAVED */}

          {savedMessage && (
            <span className="text-[11px] font-medium text-green-600">
              Saved
            </span>
          )}

          {/* SAVE */}

          {onSave && (
            <button
              type="button"
              onClick={() =>
                void handleSave()
              }
              disabled={saving}
              className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : "Save"}
            </button>
          )}

          {/* DELETE NOTE */}

          {onDelete && (
            <button
              type="button"
              onClick={() =>
                void handleDelete()
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-500"
              aria-label="Delete note"
            >
              <Trash2 size={16} />
            </button>
          )}

        </div>
      </div>

      {/* =================================================
          EDITOR AREA
      ================================================= */}

      <div className="min-h-0 flex-1 overflow-y-auto">

        <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">

          {/* TITLE */}

          <input
            type="text"
            value={draft.title}
            onChange={(event) =>
              changeTitle(
                event.target.value,
              )
            }
            placeholder="Title"
            className="mb-4 w-full border-0 bg-transparent text-xl font-semibold leading-7 text-black outline-none placeholder:text-gray-300"
          />

          {/* BLOCKS */}

          <div className="space-y-1">

            {draft.blocks.map(
              (
                block,
                index,
              ) => {
                const isDragging =
                  draggedIndex ===
                  index;

                const isDragOver =
                  dragOverIndex ===
                    index &&
                  draggedIndex !==
                    index;

                return (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={(
                      event,
                    ) =>
                      handleDragStart(
                        event,
                        index,
                      )
                    }
                    onDragOver={(
                      event,
                    ) =>
                      handleDragOver(
                        event,
                        index,
                      )
                    }
                    onDrop={(event) =>
                      handleDrop(
                        event,
                        index,
                      )
                    }
                    onDragEnd={
                      handleDragEnd
                    }
                    className={`group relative flex items-start rounded-md py-1 transition ${
                      isDragging
                        ? "scale-[0.99] opacity-40"
                        : ""
                    } ${
                      isDragOver
                        ? "border-t-2 border-green-500"
                        : ""
                    }`}
                  >

                    {/* =================================
                        DRAG HANDLE
                    ================================= */}

                    <div
                      className="flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-gray-300 active:cursor-grabbing"
                      title="Drag to move"
                    >
                      <GripVertical
                        size={16}
                      />
                    </div>

                    {/* =================================
                        CHECKBOX
                    ================================= */}

                    {block.type ===
                      "checklist" && (
                      <button
                        type="button"
                        onClick={() =>
                          toggleCheck(
                            block.id,
                          )
                        }
                        className={`mt-1 mr-1.5 flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[4px] border ${
                          block.checked
                            ? "border-green-600 bg-green-600 text-white"
                            : "border-gray-400 bg-white"
                        }`}
                        aria-label={
                          block.checked
                            ? "Uncheck"
                            : "Check"
                        }
                      >
                        {block.checked && (
                          <span className="text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    )}

                    {/* =================================
                        TEXT
                    ================================= */}

                    <textarea
                      value={
                        block.text
                      }
                      onChange={(
                        event,
                      ) =>
                        changeBlock(
                          block.id,
                          event.target
                            .value,
                        )
                      }
                      onInput={
                        handleInput
                      }
                      onKeyDown={(
                        event,
                      ) =>
                        handleKeyDown(
                          event,
                          index,
                        )
                      }
                      rows={1}
                      placeholder={
                        block.type ===
                        "checklist"
                          ? "List item"
                          : "Write something..."
                      }
                      className={`min-h-[28px] flex-1 resize-none overflow-hidden border-0 bg-transparent p-0 text-[14px] leading-[1.4] text-black outline-none placeholder:text-gray-300 ${
                        block.checked
                          ? "text-gray-400 line-through"
                          : ""
                      }`}
                    />

                    {/* =================================
                        BLOCK CONTROLS

                        ALWAYS VISIBLE
                    ================================= */}

                    <div className="ml-1 flex shrink-0 items-center">

                      {/* MOVE UP */}

                      <button
                        type="button"
                        onClick={() =>
                          moveUp(
                            index,
                          )
                        }
                        disabled={
                          index === 0
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-20"
                        aria-label="Move block up"
                      >
                        ↑
                      </button>

                      {/* MOVE DOWN */}

                      <button
                        type="button"
                        onClick={() =>
                          moveDown(
                            index,
                          )
                        }
                        disabled={
                          index ===
                          draft.blocks
                            .length -
                            1
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-20"
                        aria-label="Move block down"
                      >
                        ↓
                      </button>

                      {/* DELETE BLOCK */}

                      <button
                        type="button"
                        onClick={() =>
                          deleteBlock(
                            block.id,
                          )
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-md text-sm text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                        aria-label="Delete block"
                      >
                        ×
                      </button>

                    </div>
                  </div>
                );
              },
            )}

          </div>
        </div>
      </div>

      {/* =================================================
          BOTTOM TOOLBAR
      ================================================= */}

      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3">

        <div className="mx-auto flex max-w-3xl justify-center gap-2">

          {/* TEXT */}

          <button
            type="button"
            onClick={makeText}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
              allText
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Text
          </button>

          {/* CHECKLIST */}

          <button
            type="button"
            onClick={
              makeChecklist
            }
            className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
              allChecklist
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Checklist
          </button>

        </div>
      </div>
    </div>
  );
}