"use client";

import {
  Pin,
  PinOff,
  Trash2,
  X,
  GripVertical,
} from "lucide-react";

import {
  useEffect,
  useRef,
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

/* =====================================================
   CREATE BLOCK ID
===================================================== */

function createBlockId(): string {
  return `block-${Math.random()
    .toString(36)
    .slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

/* =====================================================
   CLONE NOTE
===================================================== */

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

/* =====================================================
   NOTE EDITOR
===================================================== */

export default function NoteEditor({
  note,
  onSave,
  onDelete,
  onTogglePin,
  onClose,
}: NoteEditorProps) {
  /* =====================================================
     LOCAL DRAFT

     NoteEditor নতুন note-এর সাথে mount হলে
     এই initial value নেওয়া হবে।

     Parent থেকে নতুন note এলে parent-এ
     key={note.id} ব্যবহার করতে হবে।
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
     ACTIVE BLOCK

     Bottom Text / Checklist button শুধু
     selected block-এর উপর কাজ করবে।
  ===================================================== */

  const [activeBlockId, setActiveBlockId] =
    useState<string | null>(
      note.blocks[0]?.id ?? null,
    );

  /* =====================================================
     TEXTAREA REFS
  ===================================================== */

  const textareaRefs = useRef<
    Record<
      string,
      HTMLTextAreaElement | null
    >
  >({});

  /* =====================================================
     DRAG STATE
  ===================================================== */

  const [draggedIndex, setDraggedIndex] =
    useState<number | null>(null);

  const [dragOverIndex, setDragOverIndex] =
    useState<number | null>(null);

  /* =====================================================
     AUTO RESIZE

     খুব গুরুত্বপূর্ণ:

     textarea-কে 28px / 32px height-এ আটকে
     রাখা হবে না।

     Content যত লম্বা হবে textarea তত height
     নেবে।

     100+ line হলেও পুরো text-এর height
     automatically নেওয়া হবে।
  ===================================================== */

  const resizeAllTextareas = () => {
    Object.values(
      textareaRefs.current,
    ).forEach((textarea) => {
      if (!textarea) {
        return;
      }

      /*
       * আগে height reset করছি।
       * এতে content ছোট-বড় দুই ক্ষেত্রেই
       * সঠিক scrollHeight পাওয়া যাবে।
       */
      textarea.style.height = "auto";

      /*
       * scrollHeight = পুরো content-এর actual height
       */
      textarea.style.height = `${textarea.scrollHeight}px`;

      /*
       * textarea যেন নিজের ভিতরে scroll না করে।
       */
      textarea.style.overflowY = "hidden";
    });
  };

  /*
   * Note load / block change হওয়ার পর
   * textarea-এর actual content height calculate হবে।
   *
   * এখানে কোনো setState নেই।
   * তাই cascading render error হবে না।
   */
  useEffect(() => {
    const frame =
      window.requestAnimationFrame(() => {
        resizeAllTextareas();
      });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [draft.blocks]);

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

    setActiveBlockId(blockId);

    setDraft(
      (previous) => ({
        ...previous,

        blocks:
          previous.blocks.map(
            (block) =>
              block.id === blockId
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
     BLOCK ACTIVE
  ===================================================== */

  const setActiveBlock = (
    blockId: string,
  ) => {
    setActiveBlockId(blockId);
  };

  /* =====================================================
     CHECKLIST
  ===================================================== */

  const toggleCheck = (
    blockId: string,
  ) => {
    setSavedMessage(false);

    setActiveBlockId(blockId);

    setDraft(
      (previous) => ({
        ...previous,

        blocks:
          previous.blocks.map(
            (block) =>
              block.id === blockId
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

        setActiveBlockId(
          newBlock.id,
        );

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
              block.id !== blockId,
          );

        if (
          blocks.length === 0
        ) {
          const newBlock: NoteBlock = {
            id: createBlockId(),
            type: "text",
            text: "",
          };

          blocks = [newBlock];

          setActiveBlockId(
            newBlock.id,
          );
        } else if (
          activeBlockId === blockId
        ) {
          const deletedIndex =
            previous.blocks.findIndex(
              (block) =>
                block.id === blockId,
            );

          const nextBlock =
            blocks[
              Math.min(
                deletedIndex,
                blocks.length - 1,
              )
            ];

          setActiveBlockId(
            nextBlock?.id ??
              null,
          );
        }

        return {
          ...previous,
          blocks,
        };
      },
    );
  };

  /* =====================================================
     MOVE UP
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
     MOVE DOWN
  ===================================================== */

  const moveDown = (
    index: number,
  ) => {
    if (
      index >=
      draft.blocks.length - 1
    ) {
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

    setActiveBlockId(block.id);

    /* =================================================
       ENTER

       বর্তমান block-এর একই type-এর
       নতুন block তৈরি হবে।
    ================================================= */

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      addBlock(index);

      return;
    }

    /* =================================================
       BACKSPACE

       Empty block delete।
    ================================================= */

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

     শুধু ACTIVE BLOCK text হবে।

     অন্য কোনো line পরিবর্তন হবে না।
  ===================================================== */

  const makeText = () => {
    if (!activeBlockId) {
      return;
    }

    setSavedMessage(false);

    setDraft(
      (previous) => ({
        ...previous,

        blocks:
          previous.blocks.map(
            (block) =>
              block.id ===
              activeBlockId
                ? {
                    id: block.id,
                    type: "text",
                    text: block.text,
                  }
                : block,
          ),
      }),
    );
  };

  /* =====================================================
     CHECKLIST MODE

     শুধু ACTIVE BLOCK checklist হবে।

     আগের text blocks checklist হবে না।
  ===================================================== */

  const makeChecklist = () => {
    if (!activeBlockId) {
      return;
    }

    setSavedMessage(false);

    setDraft(
      (previous) => ({
        ...previous,

        blocks:
          previous.blocks.map(
            (block) =>
              block.id ===
              activeBlockId
                ? {
                    id: block.id,
                    type: "checklist",
                    text: block.text,
                    checked:
                      block.checked ??
                      false,
                  }
                : block,
          ),
      }),
    );
  };

  /* =====================================================
     ACTIVE BLOCK
  ===================================================== */

  const activeBlock =
    draft.blocks.find(
      (block) =>
        block.id ===
        activeBlockId,
    );

  const activeIsText =
    activeBlock?.type ===
    "text";

  const activeIsChecklist =
    activeBlock?.type ===
    "checklist";

  /* =====================================================
     PIN
  ===================================================== */

  const togglePin = async () => {
    const updatedNote: Note = {
      ...draft,
      pinned: !draft.pinned,
    };

    setDraft(updatedNote);

    setSavedMessage(false);

    if (onTogglePin) {
      await onTogglePin(
        updatedNote,
      );

      return;
    }

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
     INPUT

     প্রতিবার লেখা পরিবর্তন হলে সাথে সাথে
     textarea পুরো content অনুযায়ী বড় হবে।
  ===================================================== */

  const handleInput = (
    event: React.FormEvent<HTMLTextAreaElement>,
  ) => {
    const textarea =
      event.currentTarget;

    textarea.style.height =
      "auto";

    textarea.style.height = `${textarea.scrollHeight}px`;

    textarea.style.overflowY =
      "hidden";
  };

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
              <X size={18} />
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
              <PinOff size={17} />
            ) : (
              <Pin size={17} />
            )}
          </button>
        </div>

        {/* RIGHT ACTIONS */}

        <div className="flex items-center gap-2">

          {savedMessage && (
            <span className="text-[11px] font-medium text-green-600">
              Saved
            </span>
          )}

          {onSave && (
            <button
              type="button"
              onClick={() =>
                void handleSave()
              }
              disabled={saving}
              className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : "Save"}
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() =>
                void handleDelete()
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-500"
              aria-label="Delete note"
            >
              <Trash2 size={17} />
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
            className="mb-5 w-full border-0 bg-transparent text-2xl font-semibold leading-8 text-black outline-none placeholder:text-gray-300"
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

                const isActive =
                  activeBlockId ===
                  block.id;

                return (
                  <div
                    key={block.id}
                    draggable
                    onClick={() =>
                      setActiveBlock(
                        block.id,
                      )
                    }
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
                      className="flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-gray-300 active:cursor-grabbing"
                      title="Drag to move"
                    >
                      <GripVertical
                        size={17}
                      />
                    </div>

                    {/* =================================
                        CHECKBOX
                    ================================= */}

                    {block.type ===
                      "checklist" && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();

                          toggleCheck(
                            block.id,
                          );
                        }}
                        className={`mt-1 mr-2 flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[5px] border ${
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
                          <span className="text-[11px] font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    )}

                    {/* =================================
                        TEXTAREA

                        গুরুত্বপূর্ণ CSS:

                        - text-[17px]
                        - leading-[1.55]
                        - min-h-[0]
                        - h-auto
                        - overflow-hidden

                        ফলে textarea 28px-এ আটকে
                        থাকবে না।
                    ================================= */}

                    <textarea
                      ref={(element) => {
                        textareaRefs.current[
                          block.id
                        ] = element;

                        /*
                         * নতুন textarea mount হওয়ার
                         * সময়ও height calculate হবে।
                         */
                        if (element) {
                          window.requestAnimationFrame(
                            () => {
                              element.style.height =
                                "auto";

                              element.style.height = `${element.scrollHeight}px`;

                              element.style.overflowY =
                                "hidden";
                            },
                          );
                        }
                      }}
                      value={
                        block.text
                      }
                      onFocus={() =>
                        setActiveBlock(
                          block.id,
                        )
                      }
                      onClick={() =>
                        setActiveBlock(
                          block.id,
                        )
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
                      style={{
                        height:
                          "auto",
                        overflowY:
                          "hidden",
                      }}
                      className={`h-auto min-h-0 flex-1 resize-none overflow-hidden border-0 bg-transparent p-0 text-[17px] leading-[1.55] text-black outline-none placeholder:text-gray-300 ${
                        block.checked
                          ? "text-gray-400 line-through"
                          : ""
                      }`}
                    />

                    {/* =================================
                        BLOCK CONTROLS

                        Active block-এ hidden।

                        তাই text select/focus করলে
                        ↑ ↓ × দেখা যাবে না।
                    ================================= */}

                    {!isActive && (
                      <div className="ml-1 flex shrink-0 items-center">

                        {/* MOVE UP */}

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();

                            moveUp(
                              index,
                            );
                          }}
                          disabled={
                            index ===
                            0
                          }
                          className="flex h-8 w-7 items-center justify-center rounded-md text-xs text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-20"
                          aria-label="Move block up"
                        >
                          ↑
                        </button>

                        {/* MOVE DOWN */}

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();

                            moveDown(
                              index,
                            );
                          }}
                          disabled={
                            index ===
                            draft
                              .blocks
                              .length -
                              1
                          }
                          className="flex h-8 w-7 items-center justify-center rounded-md text-xs text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-20"
                          aria-label="Move block down"
                        >
                          ↓
                        </button>

                        {/* DELETE BLOCK */}

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();

                            deleteBlock(
                              block.id,
                            );
                          }}
                          className="flex h-8 w-7 items-center justify-center rounded-md text-sm text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                          aria-label="Delete block"
                        >
                          ×
                        </button>

                      </div>
                    )}
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
            disabled={!activeBlockId}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition ${
              activeIsText
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Text
          </button>

          {/* CHECKLIST */}

          <button
            type="button"
            onClick={makeChecklist}
            disabled={!activeBlockId}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition ${
              activeIsChecklist
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Checklist
          </button>

        </div>
      </div>
    </div>
  );
}