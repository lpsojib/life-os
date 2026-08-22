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
  Save,
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

/* ================================================= */
/* CREATE BLOCK */
/* ================================================= */

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

/* ================================================= */
/* EDITOR */
/* ================================================= */

export default function NoteEditor({
  note,
  onChange,
  onClose,
}: NoteEditorProps) {
  /* ------------------------------------------------ */
  /* TITLE */
  /* ------------------------------------------------ */

  const [title, setTitle] = useState(
    note.title || "",
  );

  /* ------------------------------------------------ */
  /* BLOCKS */
  /* ------------------------------------------------ */

  const [blocks, setBlocks] =
    useState<NoteBlockType[]>(() => {
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
              Boolean(item.completed),
          }),
        );
      }

      return [createBlock("text")];
    });

  /* ------------------------------------------------ */
  /* SAVE STATE */
  /* ------------------------------------------------ */

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [saveError, setSaveError] =
    useState(false);

  const [dirty, setDirty] =
    useState(false);

  /* ------------------------------------------------ */
  /* REFS */
  /* ------------------------------------------------ */

  const mountedRef =
    useRef(true);

  const latestTitle =
    useRef(title);

  const latestBlocks =
    useRef(blocks);

  const savedMessageTimer =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  /* ================================================= */
  /* KEEP LATEST VALUES */
  /* ================================================= */

  useEffect(() => {
    latestTitle.current =
      title;
  }, [title]);

  useEffect(() => {
    latestBlocks.current =
      blocks;
  }, [blocks]);

  /* ================================================= */
  /* BUILD NOTE */
/* ================================================= */

  const buildUpdatedNote =
    useCallback(
      (
        currentTitle: string,
        currentBlocks: NoteBlockType[],
      ): Note => {
        /*
         * Remove empty blocks before saving.
         */
        const cleanBlocks =
          currentBlocks
            .filter(
              (block) =>
                block.text.trim() !== "",
            )
            .map((block) => {
              if (
                block.type ===
                "checklist"
              ) {
                return {
                  id: block.id,
                  type: "checklist" as const,
                  text: block.text,
                  completed:
                    Boolean(
                      block.completed,
                    ),
                };
              }

              return {
                id: block.id,
                type: "text" as const,
                text: block.text,
              };
            });

        /*
         * Paragraph content.
         */
        const content =
          cleanBlocks
            .filter(
              (block) =>
                block.type ===
                "text",
            )
            .map(
              (block) =>
                block.text,
            )
            .join("\n\n");

        /*
         * Checklist.
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

        return {
          ...note,

          title:
            currentTitle.trim() ||
            "Untitled Note",

          blocks:
            cleanBlocks,

          content,

          checklist,

          updatedAt:
            new Date().toISOString(),
        };
      },
      [note],
    );

  /* ================================================= */
  /* MANUAL SAVE */
/* ================================================= */

  const handleSave =
    useCallback(async () => {
      if (saving) {
        return;
      }

      try {
        setSaving(true);
        setSaved(false);
        setSaveError(false);

        /*
         * Get the latest editor values.
         */
        const currentTitle =
          latestTitle.current;

        const currentBlocks =
          latestBlocks.current;

        /*
         * Build updated note.
         */
        const updatedNote =
          buildUpdatedNote(
            currentTitle,
            currentBlocks,
          );

        /*
         * Save locally first.
         *
         * updateNote() saves to IndexedDB
         * immediately and starts Firebase
         * sync in background.
         */
        const savedNote =
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
         * Update parent Notebook.
         */
        onChange(
          savedNote,
        );

        if (
          mountedRef.current
        ) {
          setDirty(false);
          setSaved(true);
          setSaveError(false);
        }

        /*
         * Hide Saved message.
         */
        if (
          savedMessageTimer.current
        ) {
          clearTimeout(
            savedMessageTimer.current,
          );
        }

        savedMessageTimer.current =
          setTimeout(() => {
            if (
              mountedRef.current
            ) {
              setSaved(false);
            }
          }, 1800);
      } catch (error) {
        console.error(
          "Manual note save failed:",
          error,
        );

        if (
          mountedRef.current
        ) {
          setSaveError(true);
          setSaved(false);
        }
      } finally {
        if (
          mountedRef.current
        ) {
          setSaving(false);
        }
      }
    }, [
      buildUpdatedNote,
      note.id,
      onChange,
      saving,
    ]);

  /* ================================================= */
  /* MARK DIRTY */
/* ================================================= */

  function markDirty() {
    setDirty(true);
    setSaved(false);
    setSaveError(false);
  }

  /* ================================================= */
  /* UPDATE TITLE */
/* ================================================= */

  function handleTitleChange(
    value: string,
  ) {
    latestTitle.current =
      value;

    setTitle(value);

    markDirty();
  }

  /* ================================================= */
  /* UPDATE BLOCK */
/* ================================================= */

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

    latestBlocks.current =
      latestBlocks.current.map(
        (block) =>
          block.id === id
            ? {
                ...block,
                text: value,
              }
            : block,
      );

    markDirty();
  }

  /* ================================================= */
  /* TOGGLE CHECKBOX */
/* ================================================= */

  function toggleBlock(
    id: string,
  ) {
    setBlocks((current) =>
      current.map((block) => {
        if (
          block.id !== id
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
          completed:
            !block.completed,
        };
      }),
    );

    latestBlocks.current =
      latestBlocks.current.map(
        (block) => {
          if (
            block.id !== id
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
            completed:
              !block.completed,
          };
        },
      );

    markDirty();
  }

  /* ================================================= */
  /* DELETE BLOCK */
/* ================================================= */

  function deleteBlock(
    id: string,
  ) {
    setBlocks((current) => {
      const next =
        current.filter(
          (block) =>
            block.id !== id,
        );

      if (
        next.length === 0
      ) {
        return [
          createBlock("text"),
        ];
      }

      return next;
    });

    const next =
      latestBlocks.current.filter(
        (block) =>
          block.id !== id,
      );

    latestBlocks.current =
      next.length === 0
        ? [
            createBlock("text"),
          ]
        : next;

    markDirty();
  }

  /* ================================================= */
  /* ADD BLOCK */
/* ================================================= */

  function addBlock(
    type: "text" | "checklist",
  ) {
    const newBlock =
      createBlock(type);

    setBlocks((current) => [
      ...current,
      newBlock,
    ]);

    latestBlocks.current =
      [
        ...latestBlocks.current,
        newBlock,
      ];

    markDirty();
  }

  /* ================================================= */
  /* CLEANUP */
/* ================================================= */

  useEffect(() => {
    mountedRef.current =
      true;

    return () => {
      mountedRef.current =
        false;

      if (
        savedMessageTimer.current
      ) {
        clearTimeout(
          savedMessageTimer.current,
        );
      }
    };
  }, []);

  /* ================================================= */
  /* RENDER */
/* ================================================= */

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
          {/* HEADER */}

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

            {/* SAVE STATUS */}

            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              {dirty &&
                !saving && (
                  <span
                    className="
                      text-xs
                      text-amber-500
                    "
                  >
                    Unsaved
                  </span>
                )}

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

              {!saving &&
                saveError && (
                  <span
                    className="
                      text-xs
                      text-red-500
                    "
                  >
                    Save failed
                  </span>
                )}

              {/* SAVE BUTTON */}

              <button
                type="button"
                onClick={() =>
                  void handleSave()
                }
                disabled={
                  saving ||
                  !dirty
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-green-600
                  px-4 py-2
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-green-700
                  disabled:cursor-not-allowed
                  disabled:bg-gray-200
                  disabled:text-gray-400
                "
              >
                <Save
                  size={16}
                />

                {saving
                  ? "Saving..."
                  : "Save"}
              </button>

              {/* CLOSE */}

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

          {/* EDITOR */}

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
              {/* TYPE */}

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

              {/* TITLE */}

              <input
                type="text"
                value={title}
                onChange={(event) =>
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

              {/* BLOCKS */}

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
                        {/* DRAG */}

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

                        {/* CHECKBOX */}

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

                        {/* TEXT */}

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

                        {/* DELETE */}

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

              {/* ADD */}

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

                  {/* PARAGRAPH */}

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
                    <Type
                      size={15}
                    />

                    Paragraph
                  </button>

                  {/* CHECKLIST */}

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

              {/* SAVE INFO */}

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
                <Save size={14} />

                Click Save to save
                your changes.
              </div>
            </div>
          </main>

          {/* FOOTER */}

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
            · Manual save
          </footer>
        </div>
      </div>
    </div>
  );
}