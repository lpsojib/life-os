"use client";

import {
  Pin,
  PinOff,
  Trash2,
  X,
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
  /*
   * =====================================================
   * LOCAL DRAFT
   *
   * Typing-এর সময় শুধু এই local state update হবে।
   *
   * Parent state update হবে না।
   * Firebase call হবে না।
   * IndexedDB save হবে না।
   *
   * শুধু Save button চাপলে parent-এর onSave চলবে।
   * =====================================================
   */

  const [draft, setDraft] =
    useState<Note>(() =>
      cloneNote(note),
    );

  const [saving, setSaving] =
    useState(false);

  const [savedMessage, setSavedMessage] =
    useState(false);

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

    setSavedMessage(false);
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
     * Enter
     *
     * Same type-এর নতুন block তৈরি করবে।
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
     * Backspace
     *
     * Empty block হলে remove করবে।
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
     
     Pin action immediately save করা হবে।
     Content typing-এর সাথে এর কোনো relation নেই।
  ===================================================== */

  const togglePin = async () => {
    const updatedNote: Note = {
      ...draft,
      pinned: !draft.pinned,
    };

    setDraft(updatedNote);

    setSavedMessage(false);

    /*
     * onTogglePin থাকলে সেটাই ব্যবহার করবে।
     *
     * Page-এ বর্তমানে onTogglePin পাঠানো হচ্ছে না,
     * তাই fallback হিসেবে onSave ব্যবহার করছি।
     */

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
      } finally {
        setSaving(false);
      }
    }
  };

  /* =====================================================
     SAVE
     
     IMPORTANT:
     একমাত্র এই button-এ click করলেই
     Firebase + IndexedDB save হবে।
  ===================================================== */

  const handleSave = async () => {
    if (!onSave || saving) {
      return;
    }

    try {
      setSaving(true);

      setSavedMessage(false);

      await onSave(draft);

      setSavedMessage(true);

      /*
       * কয়েক সেকেন্ড পরে Saved message hide হবে।
       */

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
     AUTO RESIZE TEXTAREA
  ===================================================== */

  const handleInput = (
    event: React.FormEvent<HTMLTextAreaElement>,
  ) => {
    const textarea =
      event.currentTarget;

    /*
     * Textarea নিজে নিজে content অনুযায়ী
     * height adjust করবে।
     *
     * এটা event-এর ভিতরে হচ্ছে,
     * render-এর সময় নয়।
     */

    textarea.style.height =
      "auto";

    textarea.style.height = `${Math.max(
      28,
      textarea.scrollHeight,
    )}px`;
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

        {/* RIGHT SIDE */}

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

          {/* DELETE */}

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
          EDITOR
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
              ) => (
                <div
                  key={block.id}
                  className="group flex items-start"
                >

                  {/* CHECKBOX */}

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

                  {/* TEXT */}

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

                  {/* BLOCK CONTROLS */}

                  <div className="ml-1 flex shrink-0 items-center opacity-0 transition group-hover:opacity-100">

                    {/* UP */}

                    <button
                      type="button"
                      onClick={() =>
                        moveUp(index)
                      }
                      disabled={
                        index === 0
                      }
                      className="px-1 text-xs text-gray-400 transition hover:text-gray-700 disabled:opacity-20"
                      aria-label="Move block up"
                    >
                      ↑
                    </button>

                    {/* DOWN */}

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
                      className="px-1 text-xs text-gray-400 transition hover:text-gray-700 disabled:opacity-20"
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
                      className="px-1 text-xs text-gray-400 transition hover:text-red-500"
                      aria-label="Delete block"
                    >
                      ×
                    </button>

                  </div>
                </div>
              ),
            )}

          </div>
        </div>
      </div>

      {/* =================================================
          BOTTOM TOOLBAR
      ================================================= */}

      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3">

        <div className="mx-auto flex max-w-3xl items-center justify-center gap-2">

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