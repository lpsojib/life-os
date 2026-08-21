"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Check,
  CheckSquare,
  FileText,
  GripVertical,
  Plus,
  Trash2,
  Type,
  X,
} from "lucide-react";

import { updateNote } from "../services/notebook.service";

import {
  Note,
  NoteBlock as NoteBlockType,
} from "../types/notebook.types";

interface NoteEditorProps {
  note: Note;
  onChange: (updatedNote: Note) => void;
  onClose: () => void;
}

/* -------------------------------- */
/* Create Block */
/* -------------------------------- */

function createBlock(
  type: "text" | "checklist",
): NoteBlockType {
  if (type === "checklist") {
    return {
      id: crypto.randomUUID(),
      type: "checklist",
      text: "",
      completed: false,
    };
  }

  return {
    id: crypto.randomUUID(),
    type: "text",
    text: "",
  };
}

/* -------------------------------- */
/* Editor */
/* -------------------------------- */

export default function NoteEditor({
  note,
  onChange,
  onClose,
}: NoteEditorProps) {
  const [title, setTitle] = useState(
    note.title || "",
  );

  const [blocks, setBlocks] =
    useState<NoteBlockType[]>(
      () => {
        if (
          note.blocks &&
          note.blocks.length > 0
        ) {
          return note.blocks;
        }

        if (note.content?.trim()) {
          return [
            {
              id: crypto.randomUUID(),
              type: "text",
              text: note.content,
            },
          ];
        }

        if (
          note.checklist &&
          note.checklist.length > 0
        ) {
          return note.checklist.map(
            (item) => ({
              id: item.id,
              type: "checklist",
              text: item.text,
              completed:
                Boolean(
                  item.completed,
                ),
            }),
          );
        }

        return [createBlock("text")];
      },
    );

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const saveTimer =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const firstRender =
    useRef(true);

  /* -------------------------------- */
  /* Auto Save */
  /* -------------------------------- */

  const saveNote = useCallback(
    async (
      currentTitle: string,
      currentBlocks: NoteBlockType[],
    ) => {
      try {
        setSaving(true);
        setSaved(false);

        /*
         * Remove empty blocks.
         */
        const nonEmptyBlocks =
          currentBlocks.filter(
            (block) =>
              block.text.trim() !== "",
          );

        /*
         * IMPORTANT:
         * Remove undefined values before
         * sending anything to Firestore.
         */
        const cleanBlocks: NoteBlockType[] =
          nonEmptyBlocks.map(
            (block) => {
              if (
                block.type ===
                "checklist"
              ) {
                return {
                  id: block.id,
                  type: "checklist",
                  text: block.text,
                  completed:
                    Boolean(
                      block.completed,
                    ),
                };
              }

              return {
                id: block.id,
                type: "text",
                text: block.text,
              };
            },
          );

        /*
         * Paragraph content
         */
        const textBlocks =
          cleanBlocks.filter(
            (block) =>
              block.type ===
              "text",
          );

        const content =
          textBlocks
            .map(
              (block) =>
                block.text,
            )
            .join("\n\n");

        /*
         * Checklist
         */
        const checklist =
          cleanBlocks
            .filter(
              (block) =>
                block.type ===
                "checklist",
            )
            .map((block) => ({
              id: block.id,
              text: block.text,
              completed:
                Boolean(
                  block.completed,
                ),
            }));

        const updatedNote: Note = {
          ...note,

          title:
            currentTitle.trim() ||
            "Untitled Note",

          blocks: cleanBlocks,

          content,

          checklist,

          updatedAt:
            new Date().toISOString(),
        };

        /*
         * Firebase update
         */
        await updateNote(
          note.id,
          {
            title:
              updatedNote.title,

            type:
              updatedNote.type,

            blocks:
              updatedNote.blocks,

            content:
              updatedNote.content,

            checklist:
              updatedNote.checklist,

            pinned:
              updatedNote.pinned,
          },
        );

        /*
         * Immediately update local
         * Notebook state.
         */
        onChange(updatedNote);

        setSaved(true);

        setTimeout(() => {
          setSaved(false);
        }, 1200);
      } catch (error) {
        console.error(
          "Auto-save failed:",
          error,
        );
      } finally {
        setSaving(false);
      }
    },
    [note, onChange],
  );

  /* -------------------------------- */
  /* Auto Save Effect */
  /* -------------------------------- */

  useEffect(() => {
    /*
     * Don't save immediately when
     * editor opens.
     */
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    /*
     * Clear previous timer.
     */
    if (saveTimer.current) {
      clearTimeout(
        saveTimer.current,
      );
    }

    /*
     * Wait 700ms after last change.
     */
    saveTimer.current =
      setTimeout(() => {
        void saveNote(
          title,
          blocks,
        );
      }, 700);

    return () => {
      if (saveTimer.current) {
        clearTimeout(
          saveTimer.current,
        );
      }
    };
  }, [
    title,
    blocks,
    saveNote,
  ]);

  /* -------------------------------- */
  /* Update Block */
  /* -------------------------------- */

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

  /* -------------------------------- */
  /* Toggle Checkbox */
  /* -------------------------------- */

  function toggleBlock(
    id: string,
  ) {
    setBlocks((current) =>
      current.map((block) => {
        if (block.id !== id) {
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
          completed:
            !block.completed,
        };
      }),
    );
  }

  /* -------------------------------- */
  /* Delete Block */
  /* -------------------------------- */

  function deleteBlock(
    id: string,
  ) {
    setBlocks((current) => {
      const next =
        current.filter(
          (block) =>
            block.id !== id,
        );

      if (next.length === 0) {
        return [createBlock("text")];
      }

      return next;
    });
  }

  /* -------------------------------- */
  /* Add Block */
  /* -------------------------------- */

  function addBlock(
    type: "text" | "checklist",
  ) {
    setBlocks((current) => [
      ...current,
      createBlock(type),
    ]);
  }

  /* -------------------------------- */
  /* Render */
  /* -------------------------------- */

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
              flex shrink-0
              items-center
              justify-between
              border-b
              border-gray-100
              px-4 py-4
              sm:px-6
            "
          >
            {/* Back */}
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
              <ArrowLeft
                size={18}
              />

              <span className="hidden sm:inline">
                Back
              </span>
            </button>

            {/* Status */}
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              {saving && (
                <span
                  className="
                    text-xs
                    text-gray-400
                  "
                >
                  Saving...
                </span>
              )}

              {!saving &&
                saved && (
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1
                      text-xs
                      text-green-600
                    "
                  >
                    <Check
                      size={14}
                    />

                    Saved
                  </span>
                )}

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
              {/* Type */}
              <div className="mb-4">
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
                onChange={(event) =>
                  setTitle(
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
                  (block) => {
                    const isChecklist =
                      block.type ===
                      "checklist";

                    return (
                      <div
                        key={block.id}
                        className="
                          group
                          flex
                          items-start
                          gap-2
                          rounded-xl
                          px-2
                          py-0.5
                          transition
                          hover:bg-gray-50
                        "
                      >
                        {/* Drag */}
                        <div
                          className="
                            mt-1.5
                            shrink-0
                            text-gray-200
                            opacity-0
                            transition
                            group-hover:opacity-100
                          "
                        >
                          <GripVertical
                            size={16}
                          />
                        </div>

                        {/* Checkbox */}
                        {isChecklist && (
                          <button
                            type="button"
                            onClick={() =>
                              toggleBlock(
                                block.id,
                              )
                            }
                            className={`
                              mt-1.5
                              flex h-5 w-5
                              shrink-0
                              items-center
                              justify-center
                              rounded-md
                              border
                              transition
                              ${
                                block.completed
                                  ? "border-green-500 bg-green-500 text-white"
                                  : "border-gray-300 bg-white hover:border-green-400"
                              }
                            `}
                          >
                            {block.completed && (
                              <Check
                                size={13}
                              />
                            )}
                          </button>
                        )}

                        {/* Text */}
                        <textarea
                          value={
                            block.text
                          }
                          onChange={(
                            event,
                          ) => {
                            updateBlock(
                              block.id,
                              event.target
                                .value,
                            );
                          }}
                          placeholder={
                            isChecklist
                              ? "Checklist item..."
                              : "Write something..."
                          }
                          rows={1}
                          className={`
                            min-h-[32px]
                            flex-1
                            resize-none
                            border-0
                            bg-transparent
                            px-1
                            py-0.5
                            text-[15px]
                            leading-6
                            outline-none
                            placeholder:text-gray-300
                            ${
                              block.completed
                                ? "text-gray-400 line-through"
                                : "text-gray-700"
                            }
                          `}
                          onInput={(
                            event,
                          ) => {
                            const textarea =
                              event.currentTarget;

                            textarea.style.height =
                              "auto";

                            textarea.style.height =
                              `${textarea.scrollHeight}px`;
                          }}
                        />

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() =>
                            deleteBlock(
                              block.id,
                            )
                          }
                          className="
                            mt-1
                            shrink-0
                            rounded-lg
                            p-1.5
                            text-gray-200
                            opacity-0
                            transition
                            group-hover:opacity-100
                            hover:bg-red-50
                            hover:text-red-500
                          "
                        >
                          <Trash2
                            size={15}
                          />
                        </button>
                      </div>
                    );
                  },
                )}
              </div>

              {/* Add */}
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
                      mr-1
                      text-xs
                      font-medium
                      text-gray-400
                    "
                  >
                    Add
                  </span>

                  {/* Paragraph */}
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

                    Paragraph
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

              {/* Auto save info */}
              <div
                className="
                  mt-6
                  flex
                  items-center
                  gap-2
                  text-xs
                  text-gray-400
                "
              >
                <Plus size={14} />

                Changes save
                automatically.
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
            · Auto-save enabled
          </footer>
        </div>
      </div>
    </div>
  );
}