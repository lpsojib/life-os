"use client";

import {
  useState,
} from "react";

import {
  Check,
  CheckSquare,
  Pin,
  PinOff,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  Note,
  NoteBlock,
} from "../types/notebook.types";

/* =========================================================
   PROPS
========================================================= */

interface NoteEditorProps {
  note: Note;
  onChange: (note: Note) => void;
  onSave: (note: Note) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  onClose: () => void;
}

/* =========================================================
   CREATE TEXT BLOCK
========================================================= */

function createTextBlock(): NoteBlock {
  return {
    id: crypto.randomUUID(),
    type: "text",
    text: "",
  };
}

/* =========================================================
   CREATE CHECKLIST BLOCK
========================================================= */

function createChecklistBlock(): NoteBlock {
  return {
    id: crypto.randomUUID(),
    type: "checklist",
    text: "",
    checked: false,
  };
}

/* =========================================================
   INITIAL BLOCKS
========================================================= */

function getInitialBlocks(
  note: Note,
): NoteBlock[] {
  if (
    Array.isArray(note.blocks) &&
    note.blocks.length > 0
  ) {
    return note.blocks;
  }

  return [
    createTextBlock(),
  ];
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
  /*
   * IMPORTANT
   *
   * No useEffect + setState.
   *
   * This prevents the React warning:
   *
   * Calling setState synchronously within an effect
   */

  const [
    title,
    setTitle,
  ] = useState(
    note.title || "",
  );

  const [
    blocks,
    setBlocks,
  ] = useState<NoteBlock[]>(
    getInitialBlocks(note),
  );

  const [
    pinned,
    setPinned,
  ] = useState(
    Boolean(note.pinned),
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  /* =======================================================
     BUILD NOTE
  ======================================================= */

  function buildNote(
    currentBlocks: NoteBlock[] = blocks,
    currentTitle: string = title,
    currentPinned: boolean = pinned,
  ): Note {
    const now =
      new Date().toISOString();

    /*
     * IMPORTANT
     *
     * checklist must remain NoteBlock[].
     *
     * Do NOT map it into:
     *
     * { id, text, checked }
     *
     * because NoteBlock requires "type".
     */

    const checklistBlocks =
      currentBlocks.filter(
        (block) =>
          block.type ===
          "checklist",
      );

    const textBlocks =
      currentBlocks.filter(
        (block) =>
          block.type ===
          "text",
      );

    return {
      ...note,

      id: note.id,

      title:
        currentTitle.trim() ||
        "Untitled Note",

      type:
        "text",

      content:
        textBlocks
          .map(
            (block) =>
              block.text,
          )
          .join("\n"),

      blocks:
        currentBlocks,

      checklist:
        checklistBlocks,

      pinned:
        currentPinned,

      createdAt:
        note.createdAt ||
        now,

      updatedAt:
        now,
    };
  }

  /* =======================================================
     EMIT CHANGE
  ======================================================= */

  function emitChange(
    currentBlocks: NoteBlock[],
    currentTitle: string,
    currentPinned: boolean,
  ) {
    const updatedNote =
      buildNote(
        currentBlocks,
        currentTitle,
        currentPinned,
      );

    onChange(updatedNote);
  }

  /* =======================================================
     TITLE CHANGE
  ======================================================= */

  function handleTitleChange(
    value: string,
  ) {
    setTitle(value);

    emitChange(
      blocks,
      value,
      pinned,
    );
  }

  /* =======================================================
     BLOCK TEXT CHANGE
  ======================================================= */

  function handleBlockTextChange(
    blockId: string,
    value: string,
  ) {
    const updatedBlocks =
      blocks.map(
        (block) => {
          if (
            block.id !==
            blockId
          ) {
            return block;
          }

          return {
            ...block,
            text: value,
          };
        },
      );

    setBlocks(
      updatedBlocks,
    );

    emitChange(
      updatedBlocks,
      title,
      pinned,
    );
  }

  /* =======================================================
     TOGGLE CHECKBOX
  ======================================================= */

  function handleToggleCheckbox(
    blockId: string,
  ) {
    const updatedBlocks =
      blocks.map(
        (block) => {
          if (
            block.id !==
            blockId
          ) {
            return block;
          }

          if (
            block.type !==
            "checklist"
          ) {
            return block;
          }

          return {
            ...block,
            checked:
              !Boolean(
                block.checked,
              ),
          };
        },
      );

    setBlocks(
      updatedBlocks,
    );

    emitChange(
      updatedBlocks,
      title,
      pinned,
    );
  }

  /* =======================================================
     ADD TEXT BLOCK
  ======================================================= */

  function handleAddText() {
    const newBlock =
      createTextBlock();

    const updatedBlocks = [
      ...blocks,
      newBlock,
    ];

    setBlocks(
      updatedBlocks,
    );

    emitChange(
      updatedBlocks,
      title,
      pinned,
    );
  }

  /* =======================================================
     ADD CHECKLIST
  ======================================================= */

  function handleAddChecklist() {
    const newBlock =
      createChecklistBlock();

    const updatedBlocks = [
      ...blocks,
      newBlock,
    ];

    setBlocks(
      updatedBlocks,
    );

    emitChange(
      updatedBlocks,
      title,
      pinned,
    );
  }

  /* =======================================================
     DELETE BLOCK
  ======================================================= */

  function handleDeleteBlock(
    blockId: string,
  ) {
    let updatedBlocks =
      blocks.filter(
        (block) =>
          block.id !==
          blockId,
      );

    /*
     * Never leave the editor
     * without a block.
     */

    if (
      updatedBlocks.length ===
      0
    ) {
      updatedBlocks = [
        createTextBlock(),
      ];
    }

    setBlocks(
      updatedBlocks,
    );

    emitChange(
      updatedBlocks,
      title,
      pinned,
    );
  }

  /* =======================================================
     PIN
  ======================================================= */

  function handleTogglePin() {
    const newPinned =
      !pinned;

    setPinned(
      newPinned,
    );

    emitChange(
      blocks,
      title,
      newPinned,
    );
  }

  /* =======================================================
     MANUAL SAVE
  ======================================================= */

  async function handleSave() {
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      const updatedNote =
        buildNote();

      /*
       * Update NotebookPage UI.
       */

      onChange(
        updatedNote,
      );

      /*
       * Save using the current
       * notebook.service.ts API:
       *
       * updateNote(note)
       */

      await onSave(
        updatedNote,
      );
    } catch (error) {
      console.error(
        "Notebook save failed:",
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

    setDeleting(
      true,
    );

    try {
      await onDelete();
    } catch (error) {
      console.error(
        "Notebook delete failed:",
        error,
      );
    } finally {
      setDeleting(
        false,
      );
    }
  }

  /* =======================================================
     RENDER
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
        sm:p-6
      "
    >
      <div
        className="
          flex
          max-h-[95vh]
          w-full
          max-w-3xl
          flex-col
          overflow-hidden
          rounded-3xl
          bg-white
          shadow-2xl
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
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-green-50
                text-green-600
              "
            >
              <CheckSquare
                size={18}
              />
            </div>

            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-gray-900
                "
              >
                Note Editor
              </p>

              <p
                className="
                  text-[11px]
                  text-gray-400
                "
              >
                Write and save manually
              </p>
            </div>
          </div>

          <div
            className="
              flex
              items-center
              gap-1
            "
          >
            {/* PIN */}

            <button
              type="button"
              onClick={
                handleTogglePin
              }
              className={`
                rounded-xl
                p-2
                transition
                ${
                  pinned
                    ? "bg-green-50 text-green-600"
                    : "text-gray-400 hover:bg-gray-100"
                }
              `}
              title={
                pinned
                  ? "Unpin note"
                  : "Pin note"
              }
            >
              {pinned ? (
                <Pin size={18} />
              ) : (
                <PinOff
                  size={18}
                />
              )}
            </button>

            {/* CLOSE */}

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
              title="Close"
            >
              <X size={19} />
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
            sm:px-6
            sm:py-6
          "
        >
          {/* TITLE */}

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
            placeholder="Note title..."
            className="
              w-full
              border-0
              bg-transparent
              text-2xl
              font-bold
              text-gray-900
              outline-none
              placeholder:text-gray-300
              sm:text-3xl
            "
          />

          {/* BLOCKS */}

          <div
            className="
              mt-6
              space-y-3
            "
          >
            {blocks.map(
              (
                block,
                index,
              ) => (
                <div
                  key={
                    block.id
                  }
                  className="
                    group
                    flex
                    items-start
                    gap-3
                    rounded-2xl
                    border
                    border-gray-100
                    bg-gray-50/70
                    p-3
                    transition
                    focus-within:border-green-200
                    focus-within:bg-white
                  "
                >
                  {/* CHECKBOX */}

                  {block.type ===
                    "checklist" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleCheckbox(
                          block.id,
                        )
                      }
                      className={`
                        mt-1
                        flex
                        h-5
                        w-5
                        shrink-0
                        items-center
                        justify-center
                        rounded-md
                        border
                        transition
                        ${
                          block.checked
                            ? "border-green-600 bg-green-600 text-white"
                            : "border-gray-300 bg-white text-transparent"
                        }
                      `}
                    >
                      <Check
                        size={14}
                      />
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
                      handleBlockTextChange(
                        block.id,
                        event.target
                          .value,
                      )
                    }
                    placeholder={
                      block.type ===
                      "checklist"
                        ? "Write checklist item..."
                        : index ===
                            0
                          ? "Start writing..."
                          : "Write something..."
                    }
                    rows={Math.max(
                      1,
                      Math.min(
                        8,
                        block.text.split(
                          "\n",
                        ).length,
                      ),
                    )}
                    className={`
                      min-h-[28px]
                      flex-1
                      resize-none
                      border-0
                      bg-transparent
                      text-sm
                      leading-6
                      outline-none
                      placeholder:text-gray-400
                      ${
                        block.checked
                          ? "text-gray-400 line-through"
                          : "text-gray-700"
                      }
                    `}
                  />

                  {/* DELETE BLOCK */}

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteBlock(
                        block.id,
                      )
                    }
                    className="
                      shrink-0
                      rounded-lg
                      p-1.5
                      text-gray-300
                      transition
                      hover:bg-red-50
                      hover:text-red-500
                      sm:opacity-0
                      sm:group-hover:opacity-100
                    "
                    title="Remove block"
                  >
                    <X
                      size={15}
                    />
                  </button>
                </div>
              ),
            )}
          </div>

          {/* =================================================
              ADD OPTIONS
          ================================================= */}

          <div
            className="
              mt-5
              flex
              flex-wrap
              gap-2
            "
          >
            <button
              type="button"
              onClick={
                handleAddText
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
                hover:text-green-600
              "
            >
              <Plus size={15} />
              Paragraph
            </button>

            <button
              type="button"
              onClick={
                handleAddChecklist
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
                hover:border-orange-200
                hover:bg-orange-50
                hover:text-orange-600
              "
            >
              <CheckSquare
                size={15}
              />
              Checkbox
            </button>
          </div>
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          className="
            flex
            flex-col-reverse
            gap-3
            border-t
            border-gray-100
            bg-gray-50/70
            px-4
            py-3
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:px-6
          "
        >
          {/* DELETE */}

          <button
            type="button"
            onClick={
              handleDelete
            }
            disabled={
              deleting ||
              saving
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              px-3
              py-2.5
              text-sm
              font-medium
              text-red-500
              transition
              hover:bg-red-50
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <Trash2 size={16} />

            {deleting
              ? "Deleting..."
              : "Delete"}
          </button>

          {/* RIGHT ACTIONS */}

          <div
            className="
              flex
              w-full
              gap-2
              sm:w-auto
            "
          >
            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                saving ||
                deleting
              }
              className="
                flex-1
                rounded-xl
                border
                border-gray-200
                bg-white
                px-4
                py-2.5
                text-sm
                font-medium
                text-gray-600
                transition
                hover:bg-gray-100
                disabled:opacity-50
                sm:flex-none
              "
            >
              Close
            </button>

            <button
              type="button"
              onClick={
                handleSave
              }
              disabled={
                saving ||
                deleting
              }
              className="
                inline-flex
                flex-1
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-green-600
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-green-700
                disabled:cursor-not-allowed
                disabled:opacity-60
                sm:flex-none
              "
            >
              <Save size={16} />

              {saving
                ? "Saving..."
                : "Save Note"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}