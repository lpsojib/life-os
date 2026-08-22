"use client";

import {
  useState,
} from "react";

import {
  ArrowLeft,
  Check,
  CheckSquare,
  MoreVertical,
  Pin,
  PinOff,
  Plus,
  Save,
  Trash2,
  Type,
  X,
} from "lucide-react";

import {
  Note,
  NoteBlock,
} from "../types/notebook.types";

interface NoteEditorProps {
  note: Note;
  onChange: (note: Note) => void;
  onSave: (note: Note) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  onClose: () => void;
}

export default function NoteEditor({
  note,
  onChange,
  onSave,
  onDelete,
  onClose,
}: NoteEditorProps) {
  const [title, setTitle] =
    useState(note.title || "");

  const [blocks, setBlocks] =
    useState<NoteBlock[]>(
      Array.isArray(note.blocks)
        ? note.blocks
        : [],
    );

  const [saving, setSaving] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  /* =====================================================
     UPDATE TITLE
  ===================================================== */

  function handleTitleChange(
    value: string,
  ) {
    setTitle(value);
    setSaved(false);

    onChange({
      ...note,
      title: value,
      blocks,
    });
  }

  /* =====================================================
     UPDATE BLOCK
  ===================================================== */

  function updateBlock(
    blockId: string,
    value: string,
  ) {
    const updatedBlocks =
      blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              text: value,
            }
          : block,
      );

    setBlocks(updatedBlocks);
    setSaved(false);

    onChange({
      ...note,
      title,
      blocks: updatedBlocks,
    });
  }

  /* =====================================================
     TOGGLE CHECKBOX
  ===================================================== */

  function toggleCheckbox(
    blockId: string,
  ) {
    const updatedBlocks =
      blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              checked:
                !Boolean(
                  block.checked,
                ),
            }
          : block,
      );

    setBlocks(updatedBlocks);
    setSaved(false);

    onChange({
      ...note,
      title,
      blocks: updatedBlocks,
    });
  }

  /* =====================================================
     ADD TEXT
  ===================================================== */

  function addTextBlock() {
    const block: NoteBlock = {
      id: crypto.randomUUID(),
      type: "text",
      text: "",
    };

    const updatedBlocks = [
      ...blocks,
      block,
    ];

    setBlocks(updatedBlocks);

    onChange({
      ...note,
      title,
      blocks: updatedBlocks,
    });

    setSaved(false);
  }

  /* =====================================================
     ADD CHECKBOX
  ===================================================== */

  function addChecklistBlock() {
    const block: NoteBlock = {
      id: crypto.randomUUID(),
      type: "checklist",
      text: "",
      checked: false,
    };

    const updatedBlocks = [
      ...blocks,
      block,
    ];

    setBlocks(updatedBlocks);

    onChange({
      ...note,
      title,
      blocks: updatedBlocks,
    });

    setSaved(false);
  }

  /* =====================================================
     DELETE BLOCK
  ===================================================== */

  function deleteBlock(
    blockId: string,
  ) {
    const updatedBlocks =
      blocks.filter(
        (block) =>
          block.id !== blockId,
      );

    setBlocks(updatedBlocks);

    onChange({
      ...note,
      title,
      blocks: updatedBlocks,
    });

    setSaved(false);
  }

  /* =====================================================
     PIN
  ===================================================== */

  function togglePin() {
    const updatedNote = {
      ...note,
      title,
      blocks,
      pinned: !note.pinned,
    };

    onChange(updatedNote);
    setSaved(false);
  }

  /* =====================================================
     SAVE
  ===================================================== */

  async function handleSave() {
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      const cleanBlocks =
        blocks.filter(
          (block) =>
            block.text.trim() !== "",
        );

      const updatedNote: Note = {
        ...note,

        /*
         * No default title.
         */
        title: title.trim(),

        blocks: cleanBlocks,

        pinned:
          Boolean(note.pinned),

        updatedAt:
          new Date().toISOString(),
      };

      setBlocks(cleanBlocks);

      onChange(updatedNote);

      await onSave(updatedNote);

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 1800);
    } catch (error) {
      console.error(
        "Could not save note:",
        error,
      );
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     DELETE
  ===================================================== */

  async function handleDelete() {
    const confirmed =
      window.confirm(
        "Delete this note?",
      );

    if (!confirmed) {
      return;
    }

    await onDelete();
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        flex-col
        bg-white
      "
    >
      {/* =================================================
         HEADER
      ================================================= */}

      <header
        className="
          flex
          h-16
          shrink-0
          items-center
          justify-between
          border-b
          border-gray-100
          px-4
          sm:px-6
        "
      >
        {/* LEFT */}

        <button
          type="button"
          onClick={onClose}
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            px-2
            py-2
            text-sm
            text-gray-500
            transition
            hover:bg-gray-100
            hover:text-gray-900
          "
        >
          <ArrowLeft size={19} />

          <span className="hidden sm:block">
            Notes
          </span>
        </button>

        {/* RIGHT */}

        <div className="flex items-center gap-1">
          {/* PIN */}

          <button
            type="button"
            onClick={togglePin}
            title={
              note.pinned
                ? "Unpin"
                : "Pin"
            }
            className={`
              rounded-xl
              p-2.5
              transition
              ${
                note.pinned
                  ? "bg-green-50 text-green-600"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              }
            `}
          >
            {note.pinned ? (
              <Pin size={18} />
            ) : (
              <PinOff size={18} />
            )}
          </button>

          {/* DELETE */}

          <button
            type="button"
            onClick={
              handleDelete
            }
            title="Delete"
            className="
              rounded-xl
              p-2.5
              text-gray-400
              transition
              hover:bg-red-50
              hover:text-red-500
            "
          >
            <Trash2 size={18} />
          </button>

          {/* SAVE */}

          <button
            type="button"
            onClick={
              handleSave
            }
            disabled={saving}
            className="
              ml-1
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
              shadow-sm
              transition
              hover:bg-green-700
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {saved ? (
              <>
                <Check size={17} />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save size={17} />
                <span>
                  {saving
                    ? "Saving..."
                    : "Save"}
                </span>
              </>
            )}
          </button>

          {/* CLOSE */}

          <button
            type="button"
            onClick={onClose}
            className="
              ml-1
              rounded-xl
              p-2.5
              text-gray-400
              transition
              hover:bg-gray-100
              hover:text-gray-700
            "
          >
            <X size={19} />
          </button>
        </div>
      </header>

      {/* =================================================
         CONTENT
      ================================================= */}

      <main
        className="
          flex-1
          overflow-y-auto
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-3xl
            px-5
            py-10
            sm:px-8
            sm:py-14
          "
        >
          {/* TITLE */}

          <input
            type="text"
            value={title}
            onChange={(event) =>
              handleTitleChange(
                event.target.value,
              )
            }
            placeholder="Untitled"
            className="
              w-full
              border-0
              bg-transparent
              p-0
              text-3xl
              font-bold
              tracking-tight
              text-gray-900
              outline-none
              placeholder:text-gray-300
              sm:text-4xl
            "
          />

          {/* DIVIDER */}

          <div className="my-7 h-px bg-gray-100" />

          {/* BLOCKS */}

          <div className="space-y-1">
            {blocks.map(
              (block, index) => (
                <EditorBlock
                  key={block.id}
                  block={block}
                  index={index}
                  onChange={
                    updateBlock
                  }
                  onToggle={
                    toggleCheckbox
                  }
                  onDelete={
                    deleteBlock
                  }
                />
              ),
            )}
          </div>

          {/* EMPTY */}

          {blocks.length ===
            0 && (
            <button
              type="button"
              onClick={
                addTextBlock
              }
              className="
                group
                mt-2
                flex
                w-full
                items-center
                gap-3
                py-3
                text-left
                text-gray-400
                transition
                hover:text-gray-600
              "
            >
              <Type size={18} />

              <span className="text-sm">
                Start writing...
              </span>
            </button>
          )}

          {/* ADD */}

          <div
            className="
              mt-8
              flex
              flex-wrap
              items-center
              gap-2
              border-t
              border-gray-100
              pt-5
            "
          >
            <button
              type="button"
              onClick={
                addTextBlock
              }
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                px-3
                py-2
                text-sm
                text-gray-500
                transition
                hover:bg-gray-100
                hover:text-gray-900
              "
            >
              <Type size={16} />
              Paragraph
            </button>

            <button
              type="button"
              onClick={
                addChecklistBlock
              }
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                px-3
                py-2
                text-sm
                text-gray-500
                transition
                hover:bg-gray-100
                hover:text-gray-900
              "
            >
              <CheckSquare
                size={16}
              />
              Checkbox
            </button>
          </div>

          {/* BOTTOM SAVE */}

          <div
            className="
              mt-10
              flex
              items-center
              justify-between
              border-t
              border-gray-100
              pt-5
            "
          >
            <span className="text-xs text-gray-400">
              {saved
                ? "Changes saved"
                : "Changes are not saved yet"}
            </span>

            <button
              type="button"
              onClick={
                handleSave
              }
              disabled={saving}
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-gray-900
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-gray-800
                disabled:opacity-60
              "
            >
              <Save size={16} />

              {saving
                ? "Saving..."
                : "Save Note"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   EDITOR BLOCK
========================================================= */

function EditorBlock({
  block,
  index,
  onChange,
  onToggle,
  onDelete,
}: {
  block: NoteBlock;
  index: number;
  onChange: (
    id: string,
    value: string,
  ) => void;
  onToggle: (
    id: string,
  ) => void;
  onDelete: (
    id: string,
  ) => void;
}) {
  const isChecklist =
    block.type ===
    "checklist";

  return (
    <div
      className="
        group
        relative
        flex
        items-start
        gap-3
        py-1
      "
    >
      {/* CHECKBOX */}

      {isChecklist && (
        <button
          type="button"
          onClick={() =>
            onToggle(block.id)
          }
          className="
            mt-1
            flex
            h-5
            w-5
            shrink-0
            items-center
            justify-center
            rounded-md
            border
            border-gray-300
            transition
            hover:border-green-500
          "
        >
          {block.checked && (
            <Check
              size={14}
              className="text-green-600"
            />
          )}
        </button>
      )}

      {/* TEXT */}

      <textarea
        value={block.text}
        onChange={(event) =>
          onChange(
            block.id,
            event.target.value,
          )
        }
        placeholder={
          isChecklist
            ? "To-do..."
            : index === 0
              ? "Start writing..."
              : "Continue writing..."
        }
        rows={1}
        className={`
          min-h-[28px]
          flex-1
          resize-none
          overflow-hidden
          border-0
          bg-transparent
          p-0
          text-[16px]
          leading-7
          outline-none
          placeholder:text-gray-300
          ${
            block.checked
              ? "text-gray-400 line-through"
              : "text-gray-700"
          }
        `}
        onInput={(event) => {
          const target =
            event.currentTarget;

          target.style.height =
            "auto";

          target.style.height =
            `${target.scrollHeight}px`;
        }}
      />

      {/* DELETE */}

      <button
        type="button"
        onClick={() =>
          onDelete(block.id)
        }
        className="
          mt-1
          shrink-0
          rounded-lg
          p-1.5
          text-gray-300
          opacity-0
          transition
          hover:bg-red-50
          hover:text-red-500
          group-hover:opacity-100
          focus:opacity-100
        "
        title="Remove"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}