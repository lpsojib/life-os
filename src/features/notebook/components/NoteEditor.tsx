"use client";

import { useState } from "react";

import {
  Check,
  Pin,
  PinOff,
  Plus,
  Save,
  Trash2,
  X,
  Bold,
} from "lucide-react";

import {
  deleteNote,
  saveNote,
} from "../services/notebook.service";

import {
  Note,
  NoteBlock,
} from "../types/notebook.types";

interface NoteEditorProps {
  note: Note;
  onChange?: (note: Note) => void;
  onSave?: (
    note: Note,
  ) => Promise<void> | void;
  onDelete?: () =>
    Promise<void> | void;
  onClose: () => void;
}

/* =========================================================
   HELPERS
========================================================= */

function createTextBlock(): NoteBlock {
  return {
    id: crypto.randomUUID(),
    type: "text",
    text: "",
  };
}

function createChecklistBlock(): NoteBlock {
  return {
    id: crypto.randomUUID(),
    type: "checklist",
    text: "",
    checked: false,
  };
}

function normalizeBlocks(
  blocks: NoteBlock[] | undefined,
): NoteBlock[] {
  if (
    !Array.isArray(blocks) ||
    blocks.length === 0
  ) {
    return [createTextBlock()];
  }

  return blocks.map((block) => {
    if (block.type === "checklist") {
      return {
        ...block,
        type: "checklist",
        text:
          typeof block.text === "string"
            ? block.text
            : "",
        checked: Boolean(block.checked),
      };
    }

    return {
      ...block,
      type: "text",
      text:
        typeof block.text === "string"
          ? block.text
          : "",
    };
  });
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
  const [title, setTitle] = useState(
    note.title ?? "",
  );

  const [blocks, setBlocks] =
    useState<NoteBlock[]>(() =>
      normalizeBlocks(note.blocks),
    );

  const [pinned, setPinned] = useState(
    Boolean(note.pinned),
  );

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] =
    useState(false);

  /* =======================================================
     CREATE UPDATED NOTE
  ======================================================= */

  function createUpdatedNote(
    nextTitle: string,
    nextBlocks: NoteBlock[],
    nextPinned: boolean,
  ): Note {
    return {
      ...note,
      title: nextTitle,
      type: note.type ?? "text",
      blocks: nextBlocks,
      pinned: nextPinned,
      createdAt: note.createdAt,
      updatedAt: new Date().toISOString(),
    };
  }

  /* =======================================================
     TITLE
  ======================================================= */

  function handleTitleChange(value: string) {
    setTitle(value);

    const updated = createUpdatedNote(
      value,
      blocks,
      pinned,
    );

    onChange?.(updated);
  }

  /* =======================================================
     BLOCK TEXT
  ======================================================= */

  function handleBlockChange(
    blockId: string,
    value: string,
  ) {
    const updatedBlocks = blocks.map(
      (block) =>
        block.id === blockId
          ? {
              ...block,
              text: value,
            }
          : block,
    );

    setBlocks(updatedBlocks);

    const updated = createUpdatedNote(
      title,
      updatedBlocks,
      pinned,
    );

    onChange?.(updated);
  }

  /* =======================================================
     CHECKBOX
  ======================================================= */

  function handleCheckboxChange(
    blockId: string,
    checked: boolean,
  ) {
    const updatedBlocks = blocks.map(
      (block) =>
        block.id === blockId
          ? {
              ...block,
              checked,
            }
          : block,
    );

    setBlocks(updatedBlocks);

    const updated = createUpdatedNote(
      title,
      updatedBlocks,
      pinned,
    );

    onChange?.(updated);
  }

  /* =======================================================
     ADD PARAGRAPH
  ======================================================= */

  function addParagraph() {
    const updatedBlocks = [
      ...blocks,
      createTextBlock(),
    ];

    setBlocks(updatedBlocks);

    const updated = createUpdatedNote(
      title,
      updatedBlocks,
      pinned,
    );

    onChange?.(updated);
  }

  /* =======================================================
     ADD CHECKBOX
  ======================================================= */

  function addCheckbox() {
    const updatedBlocks = [
      ...blocks,
      createChecklistBlock(),
    ];

    setBlocks(updatedBlocks);

    const updated = createUpdatedNote(
      title,
      updatedBlocks,
      pinned,
    );

    onChange?.(updated);
  }

  /* =======================================================
     REMOVE BLOCK
  ======================================================= */

  function removeBlock(blockId: string) {
    let updatedBlocks = blocks.filter(
      (block) => block.id !== blockId,
    );

    if (updatedBlocks.length === 0) {
      updatedBlocks = [createTextBlock()];
    }

    setBlocks(updatedBlocks);

    const updated = createUpdatedNote(
      title,
      updatedBlocks,
      pinned,
    );

    onChange?.(updated);
  }

  /* =======================================================
     PIN
  ======================================================= */

  function togglePin() {
    const nextPinned = !pinned;

    setPinned(nextPinned);

    const updated = createUpdatedNote(
      title,
      blocks,
      nextPinned,
    );

    onChange?.(updated);
  }

  /* =======================================================
     BOLD SELECTED TEXT
  ======================================================= */

  function makeSelectedTextBold(
    blockId: string,
    textarea: HTMLTextAreaElement,
  ) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) {
      return;
    }

    const block = blocks.find(
      (item) => item.id === blockId,
    );

    if (!block) {
      return;
    }

    const selectedText = block.text.slice(
      start,
      end,
    );

    if (!selectedText.trim()) {
      return;
    }

    /*
     * NoteBlock currently stores plain text.
     *
     * Therefore we use Markdown-style **text**
     * to preserve bold formatting without
     * changing the existing Firebase structure.
     */

    const before = block.text.slice(
      0,
      start,
    );

    const after = block.text.slice(end);

    const newText =
      `${before}**${selectedText}**${after}`;

    handleBlockChange(
      blockId,
      newText,
    );

    /*
     * Restore focus after updating.
     */
    requestAnimationFrame(() => {
      textarea.focus();

      const newCursorPosition =
        start +
        selectedText.length +
        4;

      textarea.setSelectionRange(
        start,
        newCursorPosition,
      );
    });
  }

  /* =======================================================
     SAVE
  ======================================================= */

  async function handleSave() {
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      const updated = createUpdatedNote(
        title,
        blocks,
        pinned,
      );

      onChange?.(updated);

      if (onSave) {
        await onSave(updated);
      } else {
        await saveNote(updated);
      }
    } catch (error) {
      console.error(
        "Note save failed:",
        error,
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function handleDelete() {
    if (deleting) {
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this note?",
      );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      if (onDelete) {
        await onDelete();
      } else {
        await deleteNote(note.id);
      }

      onClose();
    } catch (error) {
      console.error(
        "Note delete failed:",
        error,
      );
    } finally {
      setDeleting(false);
    }
  }

  /* =======================================================
     AUTO RESIZE
  ======================================================= */

  function resizeTextarea(
    element: HTMLTextAreaElement,
  ) {
    element.style.height = "auto";
    element.style.height =
      `${element.scrollHeight}px`;
  }

  /* =======================================================
     RENDER BOLD MARKDOWN
  ======================================================= */

  function renderFormattedText(
    text: string,
  ): React.ReactNode {
    const parts = text.split(
      /(\*\*.*?\*\*)/g,
    );

    return parts.map((part, index) => {
      if (
        part.startsWith("**") &&
        part.endsWith("**")
      ) {
        return (
          <strong key={index}>
            {part.slice(2, -2)}
          </strong>
        );
      }

      return (
        <span key={index}>
          {part}
        </span>
      );
    });
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/40
        p-3
        backdrop-blur-sm
        sm:p-6
      "
    >
      <div
        className="
          flex
          h-[95vh]
          w-full
          max-w-4xl
          flex-col
          overflow-hidden
          rounded-3xl
          bg-white
          shadow-2xl
          sm:h-[90vh]
        "
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-gray-100
            px-4
            py-3
            sm:px-6
          "
        >
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
              title="Close"
            >
              <X size={20} />
            </button>

            <span
              className="
                hidden
                text-sm
                font-medium
                text-gray-500
                sm:block
              "
            >
              Notebook
            </span>

          </div>

          <div className="flex items-center gap-1">

            {/* PIN */}

            <button
              type="button"
              onClick={togglePin}
              title={
                pinned
                  ? "Unpin"
                  : "Pin"
              }
              className={`
                rounded-xl
                p-2.5
                transition
                ${
                  pinned
                    ? "bg-green-50 text-green-600"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                }
              `}
            >
              {pinned ? (
                <Pin size={18} />
              ) : (
                <PinOff size={18} />
              )}
            </button>

            {/* DELETE */}

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete"
              className="
                rounded-xl
                p-2.5
                text-gray-400
                transition
                hover:bg-red-50
                hover:text-red-500
                disabled:opacity-50
              "
            >
              <Trash2 size={18} />
            </button>

            {/* SAVE */}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="
                ml-1
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-green-600
                px-3
                py-2
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-green-700
                disabled:cursor-not-allowed
                disabled:opacity-60
                sm:px-4
              "
            >
              <Save size={16} />

              <span>
                {saving
                  ? "Saving..."
                  : "Save"}
              </span>
            </button>

          </div>
        </div>

        {/* =================================================
            EDITOR
        ================================================= */}

        <div
          className="
            flex-1
            overflow-y-auto
            px-4
            py-5
            sm:px-7
            sm:py-7
          "
        >
          <div className="mx-auto max-w-3xl">

            {/* TITLE */}

            <input
              type="text"
              value={title}
              onChange={(event) =>
                handleTitleChange(
                  event.target.value,
                )
              }
              placeholder="Write a title"
              className="
                w-full
                rounded-xl
                border
                border-gray-200
                bg-white
                px-4
                py-3
                text-lg
                font-semibold
                leading-6
                tracking-tight
                text-gray-900
                outline-none
                transition
                focus:border-green-500
                focus:ring-2
                focus:ring-green-100
                placeholder:text-gray-400
                sm:text-xl
              "
            />

            {/* =================================================
                CONTENT
            ================================================= */}

            <div
              className="
                mt-5
                w-full
                space-y-1
              "
            >
              {blocks.map((block) => {
                const checklist =
                  block.type ===
                  "checklist";

                return (
                  <div
                    key={block.id}
                    className="
                      group
                      flex
                      w-full
                      items-start
                      gap-2
                      py-1
                    "
                  >

                    {/* CHECKBOX */}

                    {checklist ? (
                      <button
                        type="button"
                        aria-label={
                          block.checked
                            ? "Uncheck item"
                            : "Check item"
                        }
                        onClick={() =>
                          handleCheckboxChange(
                            block.id,
                            !block.checked,
                          )
                        }
                        className={`
                          mt-1
                          flex
                          h-[20px]
                          w-[20px]
                          shrink-0
                          items-center
                          justify-center
                          rounded-[5px]
                          border-2
                          transition
                          ${
                            block.checked
                              ? "border-green-600 bg-green-600 text-white"
                              : "border-gray-400 bg-white text-transparent hover:border-green-600"
                          }
                        `}
                      >
                        <Check
                          size={13}
                          strokeWidth={3}
                        />
                      </button>
                    ) : null}

                    {/* TEXT */}

                    <textarea
                      value={
                        block.text ?? ""
                      }
                      onChange={(event) => {
                        handleBlockChange(
                          block.id,
                          event.target.value,
                        );

                        resizeTextarea(
                          event.currentTarget,
                        );
                      }}
                      onInput={(event) => {
                        resizeTextarea(
                          event.currentTarget,
                        );
                      }}
                      placeholder={
                        checklist
                          ? "Write a checklist item..."
                          : "Start writing..."
                      }
                      rows={1}
                      className={`
                        min-h-[28px]
                        min-w-0
                        flex-1
                        resize-none
                        overflow-hidden
                        border-0
                        bg-transparent
                        p-0
                        text-base
                        font-normal
                        leading-7
                        outline-none
                        placeholder:text-gray-300
                        ${
                          block.checked
                            ? "text-gray-400 line-through"
                            : "text-gray-800"
                        }
                      `}
                    />

                    {/* REMOVE */}

                    <button
                      type="button"
                      onClick={() =>
                        removeBlock(
                          block.id,
                        )
                      }
                      title="Remove"
                      className="
                        mt-1
                        shrink-0
                        rounded-lg
                        p-1
                        text-gray-300
                        opacity-0
                        transition
                        group-hover:opacity-100
                        hover:bg-red-50
                        hover:text-red-500
                      "
                    >
                      <X size={14} />
                    </button>

                  </div>
                );
              })}
            </div>

            {/* =================================================
                ADD OPTIONS
            ================================================= */}

            <div
              className="
                mt-6
                flex
                flex-wrap
                items-center
                gap-2
                border-t
                border-gray-100
                pt-4
              "
            >

              {/* PARAGRAPH */}

              <button
                type="button"
                onClick={addParagraph}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  px-3
                  py-2
                  text-sm
                  font-medium
                  text-gray-500
                  transition
                  hover:bg-gray-100
                  hover:text-gray-800
                "
              >
                <Plus size={16} />
                Paragraph
              </button>

              {/* CHECKBOX */}

              <button
                type="button"
                onClick={addCheckbox}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  px-3
                  py-2
                  text-sm
                  font-medium
                  text-gray-500
                  transition
                  hover:bg-gray-100
                  hover:text-gray-800
                "
              >
                <Plus size={16} />
                Checkbox
              </button>

              {/* BOLD */}

              <button
                type="button"
                onMouseDown={(event) => {
                  /*
                   * Prevent textarea selection from
                   * disappearing before click fires.
                   */
                  event.preventDefault();

                  const active =
                    document.activeElement;

                  if (
                    active instanceof
                    HTMLTextAreaElement
                  ) {
                    const block =
                      blocks.find(
                        (item) =>
                          active.value ===
                          item.text,
                      );

                    if (block) {
                      makeSelectedTextBold(
                        block.id,
                        active,
                      );
                    }
                  }
                }}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  px-3
                  py-2
                  text-sm
                  font-semibold
                  text-gray-600
                  transition
                  hover:bg-gray-100
                  hover:text-gray-900
                "
                title="Bold selected text"
              >
                <Bold size={16} />
                <span>Bold</span>
              </button>

            </div>

            {/* =================================================
                BOLD INFO
            ================================================= */}

            <div
              className="
                mt-2
                px-1
                text-xs
                text-gray-400
              "
            >
              Select any text and click Bold
              to make it bold.
            </div>

          </div>
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          className="
            flex
            items-center
            justify-between
            border-t
            border-gray-100
            px-5
            py-3
            text-xs
            text-gray-400
            sm:px-6
          "
        >
          <span>
            {pinned
              ? "Pinned note"
              : "Notebook"}
          </span>

          <span>
            {blocks.length}{" "}
            {blocks.length === 1
              ? "block"
              : "blocks"}
          </span>
        </div>

      </div>
    </div>
  );
}