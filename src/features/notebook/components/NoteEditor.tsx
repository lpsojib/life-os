"use client";

import {
  useRef,
  useState,
} from "react";

import {
  Bold,
  Check,
  Pin,
  PinOff,
  Plus,
  Save,
  Trash2,
  X,
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
   EDITABLE BLOCK
========================================================= */

interface EditableBlockProps {
  block: NoteBlock;
  onChange: (
    blockId: string,
    value: string,
  ) => void;
  onCheckboxChange: (
    blockId: string,
    checked: boolean,
  ) => void;
  onRemove: (
    blockId: string,
  ) => void;
}

function EditableBlock({
  block,
  onChange,
  onCheckboxChange,
  onRemove,
}: EditableBlockProps) {
  const editorRef =
    useRef<HTMLDivElement>(null);

  const initializedRef =
    useRef(false);

  const isChecklist =
    block.type === "checklist";

  function initializeEditor(
    element: HTMLDivElement,
  ) {
    if (initializedRef.current) {
      return;
    }

    if (
      block.text.includes("<") &&
      block.text.includes(">")
    ) {
      element.innerHTML = block.text;
    } else {
      element.textContent =
        block.text;
    }

    initializedRef.current = true;
  }

  function handleInput() {
    const element =
      editorRef.current;

    if (!element) {
      return;
    }

    onChange(
      block.id,
      element.innerHTML,
    );
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>,
  ) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    document.execCommand(
      "insertLineBreak",
    );

    handleInput();
  }

  return (
    <div
      className="
        group
        flex
        w-full
        items-start
        gap-2
      "
    >
      {/* CHECKBOX */}

      {isChecklist ? (
        <button
          type="button"
          aria-label={
            block.checked
              ? "Uncheck item"
              : "Check item"
          }
          onClick={() =>
            onCheckboxChange(
              block.id,
              !block.checked,
            )
          }
          className={`
            mt-1.5
            flex
            h-[19px]
            w-[19px]
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
      ) : (
        <div className="w-0 shrink-0" />
      )}

      {/* CONTENT */}

      <div
        ref={(element) => {
          editorRef.current = element;

          if (element) {
            initializeEditor(element);
          }
        }}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={
          isChecklist
            ? "Checklist item"
            : "Paragraph"
        }
        data-placeholder={
          isChecklist
            ? "Write a checklist item..."
            : "Start writing..."
        }
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className={`
          min-h-[30px]
          min-w-0
          flex-1
          whitespace-pre-wrap
          break-words
          bg-transparent
          p-0
          text-[16px]
          font-normal
          leading-7
          outline-none
          sm:text-[17px]
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
          onRemove(block.id)
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
        <X size={15} />
      </button>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function NoteEditor({
  note,
  onChange,
  onSave,
  onDelete,
  onClose,
}: NoteEditorProps) {
  const [title, setTitle] =
    useState(note.title ?? "");

  const [blocks, setBlocks] =
    useState<NoteBlock[]>(() =>
      normalizeBlocks(note.blocks),
    );

  const [pinned, setPinned] =
    useState(Boolean(note.pinned));

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  /* =======================================================
     UPDATED NOTE
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
      updatedAt:
        new Date().toISOString(),
    };
  }

  /* =======================================================
     TITLE
  ======================================================= */

  function handleTitleChange(
    value: string,
  ) {
    setTitle(value);

    const updated =
      createUpdatedNote(
        value,
        blocks,
        pinned,
      );

    onChange?.(updated);
  }

  /* =======================================================
     BLOCK CHANGE
  ======================================================= */

  function handleBlockChange(
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

    const updated =
      createUpdatedNote(
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
    const updatedBlocks =
      blocks.map((block) =>
        block.id === blockId
          ? {
              ...block,
              checked,
            }
          : block,
      );

    setBlocks(updatedBlocks);

    const updated =
      createUpdatedNote(
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

    const updated =
      createUpdatedNote(
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

    const updated =
      createUpdatedNote(
        title,
        updatedBlocks,
        pinned,
      );

    onChange?.(updated);
  }

  /* =======================================================
     REMOVE
  ======================================================= */

  function removeBlock(
    blockId: string,
  ) {
    let updatedBlocks =
      blocks.filter(
        (block) =>
          block.id !== blockId,
      );

    if (updatedBlocks.length === 0) {
      updatedBlocks = [
        createTextBlock(),
      ];
    }

    setBlocks(updatedBlocks);

    const updated =
      createUpdatedNote(
        title,
        updatedBlocks,
        pinned,
      );

    onChange?.(updated);
  }

  /* =======================================================
     BOLD
  ======================================================= */

  function handleBold(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();

    document.execCommand(
      "bold",
      false,
    );
  }

  /* =======================================================
     PIN
  ======================================================= */

  function togglePin() {
    const nextPinned = !pinned;

    setPinned(nextPinned);

    const updated =
      createUpdatedNote(
        title,
        blocks,
        nextPinned,
      );

    onChange?.(updated);
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
      const updated =
        createUpdatedNote(
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
        {/* HEADER */}

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
              onClick={
                handleDelete
              }
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

        {/* EDITOR */}

        <div
          className="
            flex-1
            overflow-y-auto
            px-4
            py-5
            sm:px-8
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
                text-xl
                font-semibold
                leading-7
                tracking-tight
                text-gray-900
                outline-none
                transition
                focus:border-green-500
                focus:ring-2
                focus:ring-green-100
                placeholder:text-gray-400
                sm:text-2xl
              "
            />

            {/* CONTENT */}

            <div
              className="
                mt-5
                rounded-2xl
                border
                border-gray-100
                bg-gray-50/40
                px-4
                py-4
                sm:px-5
                sm:py-5
              "
            >
              {/* TOOLBAR */}

              <div
                className="
                  mb-4
                  flex
                  items-center
                  gap-2
                  border-b
                  border-gray-100
                  pb-3
                "
              >
                <button
                  type="button"
                  onMouseDown={
                    handleBold
                  }
                  title="Bold selected text"
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-lg
                    text-gray-500
                    transition
                    hover:bg-gray-200
                    hover:text-gray-900
                  "
                >
                  <Bold
                    size={18}
                    strokeWidth={2.5}
                  />
                </button>

                <span
                  className="
                    text-xs
                    text-gray-400
                  "
                >
                  Select text and press
                  <span className="mx-1 font-semibold text-gray-600">
                    B
                  </span>
                  to make it bold
                </span>
              </div>

              {/* BLOCKS */}

              <div className="space-y-3">
                {blocks.map(
                  (block) => (
                    <EditableBlock
                      key={block.id}
                      block={block}
                      onChange={
                        handleBlockChange
                      }
                      onCheckboxChange={
                        handleCheckboxChange
                      }
                      onRemove={
                        removeBlock
                      }
                    />
                  ),
                )}
              </div>

              {/* ADD BUTTONS */}

              <div
                className="
                  mt-5
                  flex
                  flex-wrap
                  gap-2
                  border-t
                  border-gray-100
                  pt-4
                "
              >
                <button
                  type="button"
                  onClick={
                    addParagraph
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
                    text-sm
                    font-medium
                    text-gray-500
                    shadow-sm
                    transition
                    hover:bg-gray-50
                    hover:text-gray-800
                  "
                >
                  <Plus size={16} />
                  Paragraph
                </button>

                <button
                  type="button"
                  onClick={
                    addCheckbox
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
                    text-sm
                    font-medium
                    text-gray-500
                    shadow-sm
                    transition
                    hover:bg-gray-50
                    hover:text-gray-800
                  "
                >
                  <Plus size={16} />
                  Checkbox
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}

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