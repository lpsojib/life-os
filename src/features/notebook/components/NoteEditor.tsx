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

  /* ------------------------------------------------ */
  /* REFS */
  /* ------------------------------------------------ */

  const saveTimer =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const latestTitle =
    useRef(title);

  const latestBlocks =
    useRef(blocks);

  const savingRef =
    useRef(false);

  const mountedRef =
    useRef(true);

  const savedTimer =
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
         * Remove completely empty blocks.
         *
         * Keep one empty text block in editor,
         * but don't send empty blocks to storage.
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
         * Paragraph content
         */
        const content =
          cleanBlocks
            .filter(
              (block) =>
                block.type === "text",
            )
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

        return {
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
      },
      [note],
    );

  /* ================================================= */
  /* SAVE NOTE */
  /* ================================================= */

  const saveNote = useCallback(
    async (
      currentTitle: string,
      currentBlocks: NoteBlockType[],
    ) => {
      /*
       * Prevent duplicate saves running
       * at the exact same time.
       */
      if (savingRef.current) {
        return;
      }

      try {
        savingRef.current = true;

        if (mountedRef.current) {
          setSaving(true);
          setSaved(false);
          setSaveError(false);
        }

        /*
         * Build latest note from editor.
         */
        const updatedNote =
          buildUpdatedNote(
            currentTitle,
            currentBlocks,
          );

        /*
         * LOCAL FIRST
         *
         * updateNote() saves to IndexedDB
         * immediately and Firebase sync
         * happens in background.
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
         * Update parent Notebook state
         * immediately after local save.
         */
        if (mountedRef.current) {
          onChange(updatedNote);

          setSaving(false);
          setSaved(true);
          setSaveError(false);

          /*
           * Hide "Saved" after 1.5 seconds.
           */
          if (
            savedTimer.current
          ) {
            clearTimeout(
              savedTimer.current,
            );
          }

          savedTimer.current =
            setTimeout(() => {
              if (
                mountedRef.current
              ) {
                setSaved(false);
              }
            }, 1500);
        }
      } catch (error) {
        console.error(
          "Note auto-save failed:",
          error,
        );

        if (mountedRef.current) {
          setSaving(false);
          setSaved(false);
          setSaveError(true);
        }
      } finally {
        savingRef.current =
          false;
      }
    },
    [
      buildUpdatedNote,
      note.id,
      onChange,
    ],
  );

  /* ================================================= */
  /* AUTO SAVE */
  /* ================================================= */

  useEffect(() => {
    /*
     * First render should NOT save.
     *
     * We only want to save after the user
     * actually changes something.
     */
    if (
      latestTitle.current ===
        note.title &&
      JSON.stringify(
        latestBlocks.current,
      ) ===
        JSON.stringify(
          note.blocks?.length
            ? note.blocks
            : latestBlocks.current,
        )
    ) {
      return;
    }

    /*
     * Cancel previous timer.
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
          latestTitle.current,
          latestBlocks.current,
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
    note.title,
    note.blocks,
    saveNote,
  ]);

  /* ================================================= */
  /* CLEANUP */
  /* ================================================= */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (saveTimer.current) {
        clearTimeout(
          saveTimer.current,
        );
      }

      if (savedTimer.current) {
        clearTimeout(
          savedTimer.current,
        );
      }
    };
  }, []);

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

      if (next.length === 0) {
        return [
          createBlock("text"),
        ];
      }

      return next;
    });
  }

  /* ================================================= */
  /* ADD BLOCK */
  /* ================================================= */

  function addBlock(
    type: "text" | "checklist",
  ) {
    setBlocks((current) => [
      ...current,
      createBlock(type),
    ]);
  }

  /* ================================================= */
  /* CLOSE */
/* ================================================= */

  function handleClose() {
    /*
     * If a save timer is waiting,
     * save immediately before closing.
     */
    if (saveTimer.current) {
      clearTimeout(
        saveTimer.current,
      );

      saveTimer.current = null;

      void saveNote(
        latestTitle.current,
        latestBlocks.current,
      );
    }

    onClose();
  }

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
              onClick={handleClose}
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

              <button
                type="button"
                onClick={handleClose}
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