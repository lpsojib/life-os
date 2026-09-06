"use client";

import {
  Pin,
  PinOff,
  Trash2,
  X,
} from "lucide-react";

import { Note } from "../types/notebook.types";

interface NoteEditorProps {
  note: Note;
  onChange?: (note: Note) => void;
  onSave?: (note: Note) => void;
  onDelete?: (note: Note) => void;
  onTogglePin?: (note: Note) => void;
  onClose?: () => void;
}

function createBlockId(): string {
  return `block-${Math.random()
    .toString(36)
    .slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export default function NoteEditor({
  note,
  onChange,
  onSave,
  onDelete,
  onTogglePin,
  onClose,
}: NoteEditorProps) {
  /*
   * Send the changed note to parent.
   *
   * No state.
   * No effect.
   * No ref.
   * No Date.now().
   */
  const updateNote = (
    nextNote: Note,
  ) => {
    onChange?.(nextNote);
    onSave?.(nextNote);
  };

  const changeTitle = (
    value: string,
  ) => {
    updateNote({
      ...note,
      title: value,
    });
  };

  const changeBlock = (
    blockId: string,
    value: string,
  ) => {
    const blocks =
      note.blocks.map(
        (block) =>
          block.id === blockId
            ? {
                ...block,
                text: value,
              }
            : block,
      );

    updateNote({
      ...note,
      blocks,
    });
  };

  const toggleCheck = (
    blockId: string,
  ) => {
    const blocks =
      note.blocks.map(
        (block) =>
          block.id === blockId
            ? {
                ...block,
                checked:
                  !block.checked,
              }
            : block,
      );

    updateNote({
      ...note,
      blocks,
    });
  };

  const addBlock = (
    index: number,
  ) => {
    const currentBlock =
      note.blocks[index];

    const newBlock =
      currentBlock?.type ===
      "checklist"
        ? {
            id: createBlockId(),
            type: "checklist" as const,
            text: "",
            checked: false,
          }
        : {
            id: createBlockId(),
            type: "text" as const,
            text: "",
          };

    const blocks = [
      ...note.blocks.slice(
        0,
        index + 1,
      ),
      newBlock,
      ...note.blocks.slice(
        index + 1,
      ),
    ];

    updateNote({
      ...note,
      blocks,
    });
  };

  const deleteBlock = (
    blockId: string,
  ) => {
    let blocks =
      note.blocks.filter(
        (block) =>
          block.id !== blockId,
      );

    if (blocks.length === 0) {
      blocks = [
        {
          id: createBlockId(),
          type: "text",
          text: "",
        },
      ];
    }

    updateNote({
      ...note,
      blocks,
    });
  };

  const moveUp = (
    index: number,
  ) => {
    if (index <= 0) {
      return;
    }

    const blocks = [
      ...note.blocks,
    ];

    const temp = blocks[index];

    blocks[index] =
      blocks[index - 1];

    blocks[index - 1] = temp;

    updateNote({
      ...note,
      blocks,
    });
  };

  const moveDown = (
    index: number,
  ) => {
    if (
      index >=
      note.blocks.length - 1
    ) {
      return;
    }

    const blocks = [
      ...note.blocks,
    ];

    const temp = blocks[index];

    blocks[index] =
      blocks[index + 1];

    blocks[index + 1] = temp;

    updateNote({
      ...note,
      blocks,
    });
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number,
  ) => {
    const block =
      note.blocks[index];

    if (!block) {
      return;
    }

    /*
     * Enter = new block
     */
    if (event.key === "Enter") {
      event.preventDefault();

      addBlock(index);

      return;
    }

    /*
     * Backspace on empty block
     */
    if (
      event.key === "Backspace" &&
      block.text === "" &&
      note.blocks.length > 1
    ) {
      event.preventDefault();

      deleteBlock(block.id);
    }
  };

  const makeText = () => {
    const blocks =
      note.blocks.map(
        (block) => ({
          id: block.id,
          type: "text" as const,
          text: block.text,
        }),
      );

    updateNote({
      ...note,
      blocks,
    });
  };

  const makeChecklist = () => {
    const blocks =
      note.blocks.map(
        (block) => ({
          id: block.id,
          type: "checklist" as const,
          text: block.text,
          checked:
            block.checked ?? false,
        }),
      );

    updateNote({
      ...note,
      blocks,
    });
  };

  const togglePin = () => {
    const updatedNote: Note = {
      ...note,
      pinned: !note.pinned,
    };

    onChange?.(updatedNote);
    onSave?.(updatedNote);
    onTogglePin?.(updatedNote);
  };

  const deleteNote = () => {
    onDelete?.(note);
  };

  const allText =
    note.blocks.length > 0 &&
    note.blocks.every(
      (block) =>
        block.type === "text",
    );

  const allChecklist =
    note.blocks.length > 0 &&
    note.blocks.every(
      (block) =>
        block.type === "checklist",
    );

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-1">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          )}

          <button
            type="button"
            onClick={togglePin}
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              note.pinned
                ? "bg-green-50 text-green-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
            aria-label={
              note.pinned
                ? "Unpin note"
                : "Pin note"
            }
          >
            {note.pinned ? (
              <PinOff size={16} />
            ) : (
              <Pin size={16} />
            )}
          </button>
        </div>

        {onDelete && (
          <button
            type="button"
            onClick={deleteNote}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500"
            aria-label="Delete note"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Editor */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
          {/* Title */}
          <input
            type="text"
            value={note.title}
            onChange={(event) =>
              changeTitle(
                event.target.value,
              )
            }
            placeholder="Title"
            className="mb-4 w-full border-0 bg-transparent text-xl font-semibold leading-7 text-black outline-none placeholder:text-gray-300"
          />

          {/* Blocks */}
          <div className="space-y-1">
            {note.blocks.map(
              (
                block,
                index,
              ) => (
                <div
                  key={block.id}
                  className="group flex items-start"
                >
                  {/* Checkbox */}
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

                  {/* Text */}
                  <textarea
                    value={block.text}
                    onChange={(event) =>
                      changeBlock(
                        block.id,
                        event.target.value,
                      )
                    }
                    onKeyDown={(event) =>
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
                    className={`min-h-[28px] flex-1 resize-none overflow-hidden border-0 bg-transparent p-0 text-[14px] leading-[1.45] text-black outline-none placeholder:text-gray-300 ${
                      block.checked
                        ? "text-gray-400 line-through"
                        : ""
                    }`}
                  />

                  {/* Block controls */}
                  <div className="ml-1 flex shrink-0 items-center opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() =>
                        moveUp(index)
                      }
                      disabled={
                        index === 0
                      }
                      className="px-1 text-xs text-gray-400 hover:text-gray-700 disabled:opacity-20"
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        moveDown(index)
                      }
                      disabled={
                        index ===
                        note.blocks
                          .length -
                          1
                      }
                      className="px-1 text-xs text-gray-400 hover:text-gray-700 disabled:opacity-20"
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deleteBlock(
                          block.id,
                        )
                      }
                      className="px-1 text-xs text-gray-400 hover:text-red-500"
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

      {/* Bottom selector */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl justify-center gap-2">
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

          <button
            type="button"
            onClick={makeChecklist}
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