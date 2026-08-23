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
   BLOCK HELPERS
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

  const [deleting, setDeleting] = useState(false);

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
     TITLE CHANGE
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
     BLOCK TEXT CHANGE
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
     CHECKBOX CHANGE
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
     REMOVE BLOCK
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
            shrink-0
            items-center
            justify-between
            border-b
            border-gray-100
            bg-white
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
                font-semibold
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
                disabled:cursor-not-allowed
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
                shadow-sm
                transition
                hover:bg-green-700
                hover:shadow
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
            bg-white
            px-4
            py-6
            sm:px-10
            sm:py-8
          "
        >
          <div className="mx-auto max-w-3xl">

            {/* =================================================
                TITLE
            ================================================= */}

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
                rounded-2xl
                border
                border-gray-200
                bg-gray-50/50
                px-4
                py-3.5
                text-xl
                font-bold
                leading-7
                tracking-tight
                text-gray-900
                outline-none
                transition
                focus:border-green-500
                focus:bg-white
                focus:ring-4
                focus:ring-green-50
                placeholder:text-gray-300
                sm:px-5
                sm:text-2xl
                sm:leading-8
              "
            />

            {/* =================================================
                CONTENT AREA
            ================================================= */}

            <div
              className="
                mt-6
                rounded-2xl
                border
                border-gray-100
                bg-white
                px-3
                py-3
                sm:px-4
              "
            >

              {/* =================================================
                  BLOCK LIST

                  IMPORTANT:
                  Every block uses the same 28px left column.
                  Therefore paragraph and checkbox always stay
                  perfectly aligned.
              ================================================= */}

              <div className="space-y-1">

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
                        rounded-xl
                        px-1
                        py-1.5
                        transition
                        hover:bg-gray-50
                      "
                    >

                      {/* =================================================
                          FIXED LEFT ALIGNMENT AREA
                      ================================================= */}

                      <div
                        className="
                          flex
                          w-6
                          shrink-0
                          items-start
                          justify-center
                          pt-[3px]
                        "
                      >
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
                              flex
                              h-[18px]
                              w-[18px]
                              shrink-0
                              items-center
                              justify-center
                              rounded-[5px]
                              border-2
                              transition
                              ${
                                block.checked
                                  ? "border-green-600 bg-green-600 text-white"
                                  : "border-gray-300 bg-white text-transparent hover:border-green-500"
                              }
                            `}
                          >
                            <Check
                              size={12}
                              strokeWidth={3}
                            />
                          </button>
                        ) : (
                          <div
                            className="
                              h-[18px]
                              w-[18px]
                            "
                          />
                        )}
                      </div>

                      {/* =================================================
                          TEXT AREA

                          Both paragraph and checkbox use exactly
                          the same textarea area.
                      ================================================= */}

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
                          min-h-[24px]
                          min-w-0
                          flex-1
                          resize-none
                          overflow-hidden
                          border-0
                          bg-transparent
                          p-0
                          text-[15px]
                          font-normal
                          leading-6
                          outline-none
                          placeholder:text-gray-300
                          ${
                            block.checked
                              ? "text-gray-400 line-through"
                              : "text-gray-800"
                          }
                        `}
                      />

                      {/* =================================================
                          REMOVE BUTTON
                      ================================================= */}

                      <button
                        type="button"
                        onClick={() =>
                          removeBlock(
                            block.id,
                          )
                        }
                        title="Remove block"
                        className="
                          mt-0.5
                          shrink-0
                          rounded-lg
                          p-1
                          text-gray-300
                          opacity-0
                          transition
                          group-hover:opacity-100
                          hover:bg-red-50
                          hover:text-red-500
                          focus:opacity-100
                        "
                      >
                        <X size={14} />
                      </button>

                    </div>
                  );
                })}

              </div>

              {/* =================================================
                  ADD BLOCK BAR
              ================================================= */}

              <div
                className="
                  mt-3
                  border-t
                  border-gray-100
                  pt-3
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

                  {/* PARAGRAPH */}

                  <button
                    type="button"
                    onClick={addParagraph}
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-xl
                      border
                      border-transparent
                      px-3
                      py-2
                      text-sm
                      font-medium
                      text-gray-500
                      transition
                      hover:border-gray-200
                      hover:bg-gray-50
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
                      gap-1.5
                      rounded-xl
                      border
                      border-transparent
                      px-3
                      py-2
                      text-sm
                      font-medium
                      text-gray-500
                      transition
                      hover:border-gray-200
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

            {/* =================================================
                SMALL HELPER TEXT
            ================================================= */}

            <p
              className="
                mt-3
                px-1
                text-xs
                text-gray-400
              "
            >
              Add paragraphs and checklist
              items to build your note.
            </p>

          </div>
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            border-t
            border-gray-100
            bg-gray-50/50
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