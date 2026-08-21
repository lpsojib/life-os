"use client";

import {
  useState,
} from "react";

import {
  ArrowLeft,
  CheckSquare,
  FileText,
  Plus,
  Type,
  X,
} from "lucide-react";

import NoteBlock from "./NoteBlock";

import {
  useNoteAutoSave,
} from "../hooks/useNoteAutoSave";

import {
  Note,
  NoteBlock as NoteBlockType,
} from "../types/notebook.types";

interface NoteEditorProps {
  note: Note;
  onClose: () => void;
}

/* -------------------------------- */
/* Create Block */
/* -------------------------------- */

function createBlock(
  type:
    | "text"
    | "checklist",
): NoteBlockType {
  return {
    id: crypto.randomUUID(),

    type,

    text: "",

    completed:
      type ===
      "checklist"
        ? false
        : undefined,
  };
}

/* -------------------------------- */
/* Initial Blocks */
/* -------------------------------- */

function getInitialBlocks(
  note: Note,
): NoteBlockType[] {
  if (
    note.blocks &&
    note.blocks.length > 0
  ) {
    return note.blocks;
  }

  const blocks: NoteBlockType[] =
    [];

  if (
    note.content.trim()
  ) {
    blocks.push({
      id: crypto.randomUUID(),

      type: "text",

      text: note.content,
    });
  }

  note.checklist.forEach(
    (item) => {
      blocks.push({
        id: item.id,

        type: "checklist",

        text: item.text,

        completed:
          item.completed,
      });
    },
  );

  if (
    blocks.length === 0
  ) {
    blocks.push(
      createBlock("text"),
    );
  }

  return blocks;
}

/* -------------------------------- */
/* Editor */
/* -------------------------------- */

export default function NoteEditor({
  note,
  onClose,
}: NoteEditorProps) {
  const [title, setTitle] =
    useState(
      note.title,
    );

  const [blocks, setBlocks] =
    useState<
      NoteBlockType[]
    >(() =>
      getInitialBlocks(
        note,
      ),
    );

  const [
    savedStatus,
    setSavedStatus,
  ] = useState<
    "saved" | "saving" | "error"
  >("saved");

  /* -------------------------------- */
  /* Auto Save */
/* -------------------------------- */

  useNoteAutoSave({
    note,

    title,

    blocks,

    enabled: true,

    delay: 1000,

    onSaved: () => {
      setSavedStatus(
        "saved",
      );
    },

    onError: () => {
      setSavedStatus(
        "error",
      );
    },
  });

  /* -------------------------------- */
  /* Update Block */
/* -------------------------------- */

  function updateBlock(
    id: string,
    value: string,
  ) {
    setSavedStatus(
      "saving",
    );

    setBlocks(
      (current) =>
        current.map(
          (block) =>
            block.id === id
              ? {
                  ...block,
                  text: value,
                }
              : block,
        ),
    );
  }

  /* -------------------------------- */
  /* Toggle Checkbox */
/* -------------------------------- */

  function toggleBlock(
    id: string,
  ) {
    setSavedStatus(
      "saving",
    );

    setBlocks(
      (current) =>
        current.map(
          (block) =>
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

  /* -------------------------------- */
  /* Delete Block */
/* -------------------------------- */

  function deleteBlock(
    id: string,
  ) {
    setSavedStatus(
      "saving",
    );

    setBlocks(
      (current) => {
        const next =
          current.filter(
            (block) =>
              block.id !== id,
          );

        if (
          next.length === 0
        ) {
          return [
            createBlock(
              "text",
            ),
          ];
        }

        return next;
      },
    );
  }

  /* -------------------------------- */
  /* Add Block */
/* -------------------------------- */

  function addBlock(
    type:
      | "text"
      | "checklist",
  ) {
    setSavedStatus(
      "saving",
    );

    setBlocks(
      (current) => [
        ...current,
        createBlock(type),
      ],
    );
  }

  /* -------------------------------- */
  /* Title Change */
/* -------------------------------- */

  function handleTitleChange(
    value: string,
  ) {
    setSavedStatus(
      "saving",
    );

    setTitle(value);
  }

  /* -------------------------------- */
  /* UI */
/* -------------------------------- */

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        bg-black/30
        backdrop-blur-sm
      "
    >
      <div
        className="
          flex
          h-full
          w-full
          items-center
          justify-center
          p-0
          sm:p-6
        "
      >
        <div
          className="
            flex
            h-full
            w-full
            flex-col
            bg-white
            sm:h-[92vh]
            sm:max-w-4xl
            sm:rounded-3xl
            sm:shadow-2xl
          "
        >
          {/* Header */}

          <header
            className="
              flex
              shrink-0
              items-center
              justify-between
              border-b
              border-gray-100
              px-4
              py-3
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
                px-3
                py-2
                text-sm
                font-medium
                text-gray-600
                transition
                hover:bg-gray-100
              "
            >
              <ArrowLeft
                size={18}
              />

              <span className="hidden sm:inline">
                Back
              </span>
            </button>

            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <span
                className={`
                  text-xs
                  ${
                    savedStatus ===
                    "saved"
                      ? "text-green-600"
                      : savedStatus ===
                        "error"
                        ? "text-red-500"
                        : "text-gray-400"
                  }
                `}
              >
                {savedStatus ===
                "saved"
                  ? "Saved"
                  : savedStatus ===
                    "saving"
                    ? "Saving..."
                    : "Save failed"}
              </span>

              <button
                type="button"
                onClick={
                  onClose
                }
                className="
                  rounded-xl
                  p-2
                  text-gray-400
                  transition
                  hover:bg-gray-100
                  hover:text-gray-700
                "
              >
                <X
                  size={19}
                />
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
                py-7
                sm:px-8
                sm:py-9
              "
            >
              {/* Note Type */}

              <div className="mb-5">
                <span
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    bg-green-50
                    px-3
                    py-1.5
                    text-xs
                    font-medium
                    text-green-700
                  "
                >
                  <FileText
                    size={14}
                  />

                  Note
                </span>
              </div>

              {/* Title */}

              <input
                type="text"
                value={title}
                onChange={(
                  event,
                ) =>
                  handleTitleChange(
                    event.target
                      .value,
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
                  leading-tight
                  text-gray-900
                  outline-none
                  placeholder:text-gray-300
                  sm:text-4xl
                "
              />

              {/* Blocks */}

              <div
                className="
                  mt-6
                  space-y-0
                "
              >
                {blocks.map(
                  (block) => (
                    <NoteBlock
                      key={
                        block.id
                      }
                      block={
                        block
                      }
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

              {/* Add Block */}

              <div
                className="
                  mt-5
                  border-t
                  border-gray-100
                  pt-4
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

                  <button
                    type="button"
                    onClick={() =>
                      addBlock(
                        "text",
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
                      px-3
                      py-2
                      text-xs
                      font-medium
                      text-gray-600
                      transition
                      hover:border-green-200
                      hover:bg-green-50
                      hover:text-green-700
                    "
                  >
                    <Type
                      size={15}
                    />

                    Paragraph
                  </button>

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
                      px-3
                      py-2
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

                    Checkbox
                  </button>
                </div>
              </div>

              {/* Tip */}

              <div
                className="
                  mt-7
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
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    bg-white
                    text-green-600
                    shadow-sm
                  "
                >
                  <Plus
                    size={16}
                  />
                </div>

                <div>
                  <p
                    className="
                      text-xs
                      font-semibold
                      text-gray-700
                    "
                  >
                    Auto-save enabled
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      leading-5
                      text-gray-400
                    "
                  >
                    Your note is
                    automatically
                    saved while
                    you write.
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
              px-5
              py-3
              text-xs
              text-gray-400
              sm:px-6
            "
          >
            {blocks.length}{" "}
            {blocks.length ===
            1
              ? "block"
              : "blocks"}{" "}
            · Auto-saved
          </footer>
        </div>
      </div>
    </div>
  );
}