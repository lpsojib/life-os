"use client";

import {
  useEffect,
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
  onSave?: (note: Note) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
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
  if (!Array.isArray(blocks) || blocks.length === 0) {
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
   HTML HELPERS
========================================================= */

function containsHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function textToHtml(value: string): string {
  if (!value) {
    return "";
  }

  if (containsHtml(value)) {
    return value;
  }

  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />");
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

  const [blocks, setBlocks] = useState<NoteBlock[]>(
    () => normalizeBlocks(note.blocks),
  );

  const [pinned, setPinned] = useState(
    Boolean(note.pinned),
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const editorRefs = useRef<
    Record<string, HTMLDivElement | null>
  >({});

  const savedSelection = useRef<Range | null>(
    null,
  );

  /* =======================================================
     SYNC EDITOR
  ======================================================= */

  useEffect(() => {
    blocks.forEach((block) => {
      const editor =
        editorRefs.current[block.id];

      if (!editor) {
        return;
      }

      const expected = textToHtml(
        block.text ?? "",
      );

      if (editor.innerHTML !== expected) {
        editor.innerHTML = expected;
      }
    });
  }, [blocks]);

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
     BLOCK INPUT
  ======================================================= */

  function handleBlockInput(
    blockId: string,
    element: HTMLDivElement,
  ) {
    const html = element.innerHTML;

    const updatedBlocks = blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            text: html,
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
    const updatedBlocks = blocks.map((block) =>
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
    const newBlock = createTextBlock();

    const updatedBlocks = [
      ...blocks,
      newBlock,
    ];

    setBlocks(updatedBlocks);

    const updated = createUpdatedNote(
      title,
      updatedBlocks,
      pinned,
    );

    onChange?.(updated);

    requestAnimationFrame(() => {
      editorRefs.current[
        newBlock.id
      ]?.focus();
    });
  }

  /* =======================================================
     ADD CHECKBOX
  ======================================================= */

  function addCheckbox() {
    const newBlock =
      createChecklistBlock();

    const updatedBlocks = [
      ...blocks,
      newBlock,
    ];

    setBlocks(updatedBlocks);

    const updated = createUpdatedNote(
      title,
      updatedBlocks,
      pinned,
    );

    onChange?.(updated);

    requestAnimationFrame(() => {
      editorRefs.current[
        newBlock.id
      ]?.focus();
    });
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
     SAVE CURRENT SELECTION
  ======================================================= */

  function saveCurrentSelection() {
    const selection = window.getSelection();

    if (!selection) {
      return;
    }

    if (selection.rangeCount === 0) {
      return;
    }

    if (selection.toString().trim().length === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    const container =
      range.commonAncestorContainer;

    const parentElement =
      container.nodeType === Node.ELEMENT_NODE
        ? (container as Element)
        : container.parentElement;

    const editor =
      parentElement?.closest(
        "[data-note-editor]",
      );

    if (!editor) {
      return;
    }

    savedSelection.current =
      range.cloneRange();
  }

  /* =======================================================
     BOLD
  ======================================================= */

  function handleBold() {
    const selection = window.getSelection();

    if (!selection) {
      return;
    }

    /*
     * Restore previous selection.
     */
    if (savedSelection.current) {
      selection.removeAllRanges();

      selection.addRange(
        savedSelection.current,
      );
    }

    if (selection.rangeCount === 0) {
      return;
    }

    const selectedText =
      selection.toString();

    if (!selectedText.trim()) {
      return;
    }

    /*
     * Native browser bold.
     *
     * IMPORTANT:
     * This creates <strong>/<b>.
     * It never creates * or **.
     */
    document.execCommand(
      "bold",
      false,
    );

    const range =
      selection.getRangeAt(0);

    const container =
      range.commonAncestorContainer;

    const element =
      container.nodeType === Node.ELEMENT_NODE
        ? (container as Element)
        : container.parentElement;

    const editor =
      element?.closest(
        "[data-note-editor]",
      ) as HTMLDivElement | null;

    if (!editor) {
      return;
    }

    const blockId =
      editor.dataset.blockId;

    if (!blockId) {
      return;
    }

    handleBlockInput(
      blockId,
      editor,
    );

    editor.focus();

    savedSelection.current =
      range.cloneRange();
  }

  /* =======================================================
     KEYBOARD
  ======================================================= */

  function handleEditorKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>,
  ) {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "b"
    ) {
      event.preventDefault();

      saveCurrentSelection();

      handleBold();
    }
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

    const confirmed = window.confirm(
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
                border
                border-gray-200
                p-2
                text-gray-400
                transition
                hover:bg-gray-50
                hover:text-gray-700
              "
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

          <div className="flex items-center gap-1.5">
            {/* PIN */}

            <button
              type="button"
              onClick={togglePin}
              title={
                pinned ? "Unpin" : "Pin"
              }
              className={`
                rounded-xl
                border
                p-2.5
                transition
                ${
                  pinned
                    ? "border-green-200 bg-green-50 text-green-600"
                    : "border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
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
                border
                border-gray-200
                p-2.5
                text-gray-400
                transition
                hover:border-red-200
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
                border
                border-green-600
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
                leading-7
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

            {/* CONTENT */}

            <div
              className="
                mt-6
                w-full
                space-y-2
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
                    "
                  >
                    {/* CHECKBOX */}

                    {checklist && (
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
                          mt-[5px]
                          flex
                          h-5
                          w-5
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
                    )}

                    {/* TEXT */}

                    <div
                      ref={(element) => {
                        editorRefs.current[
                          block.id
                        ] = element;
                      }}
                      data-note-editor
                      data-block-id={
                        block.id
                      }
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(event) =>
                        handleBlockInput(
                          block.id,
                          event.currentTarget,
                        )
                      }
                      onSelect={
                        saveCurrentSelection
                      }
                      onMouseUp={
                        saveCurrentSelection
                      }
                      onKeyUp={
                        saveCurrentSelection
                      }
                      onKeyDown={
                        handleEditorKeyDown
                      }
                      role="textbox"
                      aria-multiline="true"
                      data-placeholder={
                        checklist
                          ? "Write a checklist item..."
                          : "Start writing..."
                      }
                      className={`
                        note-editor-content
                        min-h-[30px]
                        min-w-0
                        flex-1
                        whitespace-pre-wrap
                        break-words
                        border-0
                        bg-transparent
                        p-0
                        text-[18px]
                        font-normal
                        leading-8
                        outline-none
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
                        border
                        border-transparent
                        p-1
                        text-gray-300
                        opacity-0
                        transition
                        group-hover:opacity-100
                        hover:border-red-200
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

            {/* TOOLBAR */}

            <div
              className="
                mt-7
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
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2
                  text-sm
                  font-medium
                  text-gray-600
                  shadow-sm
                  transition
                  hover:border-gray-400
                  hover:bg-gray-50
                  hover:text-gray-900
                "
              >
                <Plus size={16} />
                <span>
                  Paragraph
                </span>
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
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2
                  text-sm
                  font-medium
                  text-gray-600
                  shadow-sm
                  transition
                  hover:border-gray-400
                  hover:bg-gray-50
                  hover:text-gray-900
                "
              >
                <Check size={16} />
                <span>
                  Checkbox
                </span>
              </button>

              {/* BOLD */}

              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();

                  saveCurrentSelection();

                  handleBold();
                }}
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2
                  text-sm
                  font-semibold
                  text-gray-700
                  shadow-sm
                  transition
                  hover:border-gray-500
                  hover:bg-gray-50
                  hover:text-gray-950
                  active:scale-[0.98]
                "
                title="Select text and click Bold"
              >
                <Bold size={16} />
                <span>Bold</span>
              </button>
            </div>

            {/* HINT */}

            <p
              className="
                mt-2
                px-1
                text-xs
                text-gray-400
              "
            >
              Select text and click
              Bold, or press Ctrl+B.
            </p>
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