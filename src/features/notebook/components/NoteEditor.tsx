"use client";

import { useState } from "react";

import {
  ArrowLeft,
  Check,
  CheckSquare,
  FileText,
  Plus,
  Type,
  X,
} from "lucide-react";

import NoteBlock from "./NoteBlock";

import { useNoteAutoSave } from "../hooks/useNoteAutoSave";

import {
  Note,
  NoteBlock as NoteBlockType,
} from "../types/notebook.types";

interface NoteEditorProps {
  note: Note;
  onSave: (note: Note) => Promise<void>;
  onClose: () => void;
}

function createBlock(
  type: "text" | "checklist",
): NoteBlockType {
  return {
    id: crypto.randomUUID(),
    type,
    text: "",
    completed:
      type === "checklist"
        ? false
        : undefined,
  };
}

function getInitialBlocks(
  note: Note,
): NoteBlockType[] {
  // New notes already have blocks
  if (
    note.blocks &&
    note.blocks.length > 0
  ) {
    return note.blocks;
  }

  const blocks: NoteBlockType[] = [];

  // Convert old paragraph content
  if (note.content.trim()) {
    blocks.push({
      id: crypto.randomUUID(),
      type: "text",
      text: note.content,
    });
  }

  // Convert old checklist
  note.checklist.forEach((item) => {
    blocks.push({
      id: item.id,
      type: "checklist",
      text: item.text,
      completed: item.completed,
    });
  });

  // Always start with one text block
  if (blocks.length === 0) {
    blocks.push(createBlock("text"));
  }

  return blocks;
}

export default function NoteEditor({
  note,
  onSave,
  onClose,
}: NoteEditorProps) {
  const [title, setTitle] = useState(
    note.title,
  );

  const [blocks, setBlocks] = useState<
    NoteBlockType[]
  >(() => getInitialBlocks(note));

  const [saving, setSaving] =
    useState(false);

  /*
   * Auto Save
   *
   * Title, text blocks and checklist
   * changes will automatically save
   * after 1 second.
   */
  useNoteAutoSave({
    note,
    title,
    blocks,
    enabled: true,
    delay: 1000,
  });

  function updateBlock(
    id: string,
    value: string,
  ) {
    setBlocks((current) =>
      current.map((block) =>
        block.id === id
          ? {
              ...block,
              text: value,
            }
          : block,
      ),
    );
  }

  function toggleBlock(id: string) {
    setBlocks((current) =>
      current.map((block) =>
        block.id === id
          ? {
              ...block,
              completed:
                !block.completed,
            }
          : block,
      ),
    );
  }

  function deleteBlock(id: string) {
    setBlocks((current) => {
      const next = current.filter(
        (block) => block.id !== id,
      );

      if (next.length === 0) {
        return [createBlock("text")];
      }

      return next;
    });
  }

  function addBlock(
    type: "text" | "checklist",
  ) {
    setBlocks((current) => [
      ...current,
      createBlock(type),
    ]);
  }

  async function handleSave() {
    try {
      setSaving(true);

      const cleanBlocks = blocks.filter(
        (block) =>
          block.text.trim() !== "",
      );

      // Convert blocks back to old fields
      // so existing data remains compatible.
      const textBlocks =
        cleanBlocks.filter(
          (block) =>
            block.type === "text",
        );

      const checklistBlocks =
        cleanBlocks.filter(
          (block) =>
            block.type ===
            "checklist",
        );

      const content = textBlocks
        .map((block) => block.text)
        .join("\n\n");

      const checklist =
        checklistBlocks.map(
          (block) => ({
            id: block.id,
            text: block.text,
            completed:
              Boolean(block.completed),
          }),
        );

      await onSave({
        ...note,

        title:
          title.trim() ||
          "Untitled Note",

        blocks: cleanBlocks,

        content,

        checklist,

        updatedAt:
          new Date().toISOString(),
      });

      onClose();
    } catch (error) {
      console.error(
        "Failed to save note:",
        error,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="
        fixed inset-0 z-50
        bg-black/30
        backdrop-blur-sm
      "
    >
      <div
        className="
          flex h-full w-full
          items-center justify-center
          p-0 sm:p-6
        "
      >
        <div
          className="
            flex h-full w-full
            flex-col bg-white
            sm:h-[92vh]
            sm:max-w-4xl
            sm:rounded-3xl
            sm:shadow-2xl
          "
        >
          {/* Header */}
          <header
            className="
              flex shrink-0
              items-center
              justify-between
              border-b
              border-gray-100
              px-4 py-4
              sm:px-6
            "
          >
            <button
              type="button"
              onClick={onClose}
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                px-3 py-2
                text-sm
                font-medium
                text-gray-600
                transition
                hover:bg-gray-100
              "
            >
              <ArrowLeft size={18} />

              <span className="hidden sm:inline">
                Back
              </span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="
                  rounded-xl
                  p-2
                  text-gray-400
                  transition
                  hover:bg-gray-100
                  hover:text-gray-700
                "
              >
                <X size={19} />
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-green-600
                  px-4 py-2.5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-green-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                <Check size={17} />

                {saving
                  ? "Saving..."
                  : "Save"}
              </button>
            </div>
          </header>

          {/* Editor */}
          <main
            className="
              flex-1
              overflow-y-auto
            "
          >
            <div
              className="
                mx-auto
                max-w-3xl
                px-5
                py-8
                sm:px-8
                sm:py-10
              "
            >
              {/* Note type */}
              <div className="mb-5">
                <span
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    bg-green-50
                    px-3 py-1.5
                    text-xs
                    font-medium
                    text-green-700
                  "
                >
                  <FileText size={14} />
                  Note
                </span>
              </div>

              {/* Title */}
              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value,
                  )
                }
                placeholder="Note title"
                autoFocus
                className="
                  w-full
                  border-0
                  bg-transparent
                  text-3xl
                  font-bold
                  text-gray-900
                  outline-none
                  placeholder:text-gray-300
                  sm:text-4xl
                "
              />

              {/* Blocks */}
              <div
                className="
                  mt-8
                  space-y-1
                "
              >
                {blocks.map(
                  (block) => (
                    <NoteBlock
                      key={block.id}
                      block={block}
                      onChange={
                        updateBlock
                      }
                      onToggle={
                        toggleBlock
                      }
                      onDelete={
                        deleteBlock
                      }
                    />
                  ),
                )}
              </div>

              {/* Add block */}
              <div
                className="
                  mt-6
                  border-t
                  border-gray-100
                  pt-5
                "
              >
                <div
                  className="
                    flex
                    flex-wrap
                    items-center
                    gap-2
                  "
                >
                  <span
                    className="
                      mr-2
                      text-xs
                      font-medium
                      text-gray-400
                    "
                  >
                    Add
                  </span>

                  {/* Text */}
                  <button
                    type="button"
                    onClick={() =>
                      addBlock("text")
                    }
                    className="
                      inline-flex
                      items-center
                      gap-2
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      px-3 py-2
                      text-xs
                      font-medium
                      text-gray-600
                      transition
                      hover:border-green-200
                      hover:bg-green-50
                      hover:text-green-700
                    "
                  >
                    <Type size={15} />
                    Text
                  </button>

                  {/* Checklist */}
                  <button
                    type="button"
                    onClick={() =>
                      addBlock(
                        "checklist",
                      )
                    }
                    className="
                      inline-flex
                      items-center
                      gap-2
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      px-3 py-2
                      text-xs
                      font-medium
                      text-gray-600
                      transition
                      hover:border-green-200
                      hover:bg-green-50
                      hover:text-green-700
                    "
                  >
                    <CheckSquare
                      size={15}
                    />
                    Checklist
                  </button>
                </div>
              </div>

              {/* Tip */}
              <div
                className="
                  mt-8
                  flex
                  items-start
                  gap-3
                  rounded-2xl
                  bg-gray-50
                  p-4
                "
              >
                <div
                  className="
                    flex h-8 w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    bg-white
                    text-green-600
                    shadow-sm
                  "
                >
                  <Plus size={16} />
                </div>

                <div>
                  <p
                    className="
                      text-xs
                      font-semibold
                      text-gray-700
                    "
                  >
                    Build your note
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      leading-5
                      text-gray-400
                    "
                  >
                    Mix paragraphs and
                    checklists freely.
                    Add as many blocks
                    as you need.
                  </p>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer
            className="
              shrink-0
              border-t
              border-gray-100
              px-5 py-3
              text-xs
              text-gray-400
              sm:px-6
            "
          >
            {blocks.length}{" "}
            {blocks.length === 1
              ? "block"
              : "blocks"}{" "}
            · Changes are saved
            automatically.
          </footer>
        </div>
      </div>
    </div>
  );
}