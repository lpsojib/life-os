"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Pin,
  PinOff,
  Trash2,
  X,
} from "lucide-react";

import {
  Note,
  NoteBlock,
} from "../types/notebook.types";

/* =====================================================
   EDITOR BLOCK
===================================================== */

type EditorBlock = NoteBlock & {
  bold?: boolean;
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
};

type EditorNote = Omit<
  Note,
  "blocks"
> & {
  blocks: EditorBlock[];
};

interface NoteEditorProps {
  note: Note;

  onSave?: (
    note: Note,
  ) => void | Promise<void>;

  onDelete?: (
    note: Note,
  ) => void | Promise<void>;

  onTogglePin?: (
    note: Note,
  ) => void | Promise<void>;

  onClose?: () => void;
}

/* =====================================================
   DEFAULT CONTENT SETTINGS

   এখানে content area-এর default vertical
   height/gap কম রাখা হয়েছে।
===================================================== */

const DEFAULT_FONT_SIZE = 14;

/*
 * আগে 1.6 ছিল।
 * এখন 1.0 করা হয়েছে।
 */
const DEFAULT_LINE_HEIGHT = 1.0;

const DEFAULT_FONT_FAMILY =
  "Hind Siliguri";

/* =====================================================
   CREATE BLOCK ID
===================================================== */

function createBlockId(): string {
  return `block-${Math.random()
    .toString(36)
    .slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

/* =====================================================
   NORMALIZE BLOCK
===================================================== */

function normalizeBlock(
  block: NoteBlock,
): EditorBlock {
  const editorBlock =
    block as EditorBlock;

  return {
    ...editorBlock,

    bold:
      editorBlock.bold ??
      false,

    fontSize:
      editorBlock.fontSize ??
      DEFAULT_FONT_SIZE,

    lineHeight:
      editorBlock.lineHeight ??
      DEFAULT_LINE_HEIGHT,

    fontFamily:
      editorBlock.fontFamily ??
      DEFAULT_FONT_FAMILY,
  };
}

/* =====================================================
   CLONE NOTE
===================================================== */

function cloneNote(
  note: Note,
): EditorNote {
  return {
    ...note,

    blocks: note.blocks.map(
      (block) =>
        normalizeBlock(block),
    ),
  };
}

/* =====================================================
   NOTE EDITOR
===================================================== */

export default function NoteEditor({
  note,
  onSave,
  onDelete,
  onTogglePin,
  onClose,
}: NoteEditorProps) {
  /* =====================================================
     DRAFT
  ===================================================== */

  const [draft, setDraft] =
    useState<EditorNote>(() =>
      cloneNote(note),
    );

  /* =====================================================
     SAVE STATE
  ===================================================== */

  const [saving, setSaving] =
    useState(false);

  const [savedMessage, setSavedMessage] =
    useState(false);

  /* =====================================================
     ACTIVE BLOCK

     Formatting/Text/Checklist শুধু এই block-এ কাজ করবে।
  ===================================================== */

  const [activeBlockId, setActiveBlockId] =
    useState<string | null>(
      note.blocks[0]?.id ?? null,
    );

  /* =====================================================
     TEXTAREA REFS
  ===================================================== */

  const textareaRefs =
    useRef<
      Record<
        string,
        HTMLTextAreaElement | null
      >
    >({});

  /* =====================================================
     DRAG STATE

     কোনো 6-dot handle নেই।
     পুরো checklist row drag করা যাবে।
  ===================================================== */

  const [draggedIndex, setDraggedIndex] =
    useState<number | null>(null);

  const [dragOverIndex, setDragOverIndex] =
    useState<number | null>(null);

  /* =====================================================
     HIND SILIGURI FONT
  ===================================================== */

  useEffect(() => {
    const existing =
      document.querySelector(
        'link[data-hind-siliguri-font="true"]',
      );

    if (existing) {
      return;
    }

    const link =
      document.createElement(
        "link",
      );

    link.rel = "stylesheet";

    link.href =
      "https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap";

    link.setAttribute(
      "data-hind-siliguri-font",
      "true",
    );

    document.head.appendChild(link);
  }, []);

  /* =====================================================
     TITLE CHANGE
  ===================================================== */

  const changeTitle = (
    value: string,
  ) => {
    setSavedMessage(false);

    setDraft((previous) => ({
      ...previous,
      title: value,
    }));
  };

  /* =====================================================
     ACTIVE BLOCK
  ===================================================== */

  const setActiveBlock = (
    blockId: string,
  ) => {
    setActiveBlockId(
      blockId,
    );
  };

  /* =====================================================
     CHANGE BLOCK TEXT
  ===================================================== */

  const changeBlock = (
    blockId: string,
    value: string,
  ) => {
    setSavedMessage(false);

    setActiveBlockId(
      blockId,
    );

    setDraft((previous) => ({
      ...previous,

      blocks: previous.blocks.map(
        (block) =>
          block.id === blockId
            ? {
                ...block,
                text: value,
              }
            : block,
      ),
    }));
  };

  /* =====================================================
     CHECKBOX
  ===================================================== */

  const toggleCheck = (
    blockId: string,
  ) => {
    setSavedMessage(false);

    setActiveBlockId(
      blockId,
    );

    setDraft((previous) => ({
      ...previous,

      blocks: previous.blocks.map(
        (block) =>
          block.id === blockId
            ? {
                ...block,
                checked:
                  !block.checked,
              }
            : block,
      ),
    }));
  };

  /* =====================================================
     ADD NEW BLOCK
     
     Current block-এর type অনুযায়ী নতুন block হবে।
     
     Text → Text
     Checklist → Checklist
===================================================== */

  const addBlock = (
    index: number,
  ) => {
    const currentBlock =
      draft.blocks[index];

    if (!currentBlock) {
      return;
    }

    setSavedMessage(false);

    const newBlock: EditorBlock =
      currentBlock.type ===
      "checklist"
        ? {
            id: createBlockId(),
            type: "checklist",
            text: "",
            checked: false,

            bold:
              currentBlock.bold ??
              false,

            fontSize:
              currentBlock.fontSize ??
              DEFAULT_FONT_SIZE,

            lineHeight:
              currentBlock.lineHeight ??
              DEFAULT_LINE_HEIGHT,

            fontFamily:
              currentBlock.fontFamily ??
              DEFAULT_FONT_FAMILY,
          }
        : {
            id: createBlockId(),
            type: "text",
            text: "",

            bold:
              currentBlock.bold ??
              false,

            fontSize:
              currentBlock.fontSize ??
              DEFAULT_FONT_SIZE,

            lineHeight:
              currentBlock.lineHeight ??
              DEFAULT_LINE_HEIGHT,

            fontFamily:
              currentBlock.fontFamily ??
              DEFAULT_FONT_FAMILY,
          };

    setDraft((previous) => {
      const blocks = [
        ...previous.blocks.slice(
          0,
          index + 1,
        ),

        newBlock,

        ...previous.blocks.slice(
          index + 1,
        ),
      ];

      return {
        ...previous,
        blocks,
      };
    });

    setActiveBlockId(
      newBlock.id,
    );

    /*
     * নতুন line-এ focus।
     */
    window.setTimeout(() => {
      const textarea =
        textareaRefs.current[
          newBlock.id
        ];

      if (textarea) {
        textarea.focus();

        textarea.style.height =
          "22px";
      }
    }, 0);
  };

  /* =====================================================
     DELETE BLOCK
     
     Checklist-এর × button-এর জন্য।
===================================================== */

  const deleteBlock = (
    blockId: string,
  ) => {
    setSavedMessage(false);

    setDraft((previous) => {
      const oldIndex =
        previous.blocks.findIndex(
          (block) =>
            block.id === blockId,
        );

      let blocks =
        previous.blocks.filter(
          (block) =>
            block.id !== blockId,
        );

      /*
       * অন্তত একটি text block থাকবে।
       */
      if (
        blocks.length === 0
      ) {
        const newBlock: EditorBlock =
          {
            id: createBlockId(),
            type: "text",
            text: "",
            bold: false,
            fontSize:
              DEFAULT_FONT_SIZE,
            lineHeight:
              DEFAULT_LINE_HEIGHT,
            fontFamily:
              DEFAULT_FONT_FAMILY,
          };

        blocks = [newBlock];

        setActiveBlockId(
          newBlock.id,
        );
      } else if (
        activeBlockId ===
        blockId
      ) {
        const nextIndex =
          Math.min(
            oldIndex,
            blocks.length - 1,
          );

        setActiveBlockId(
          blocks[nextIndex]?.id ??
            null,
        );
      }

      return {
        ...previous,
        blocks,
      };
    });
  };

  /* =====================================================
     MOVE UP
===================================================== */

  const moveUp = (
    index: number,
  ) => {
    const block =
      draft.blocks[index];

    if (
      !block ||
      block.type !==
        "checklist" ||
      index <= 0
    ) {
      return;
    }

    setSavedMessage(false);

    setDraft((previous) => {
      const blocks = [
        ...previous.blocks,
      ];

      const temp =
        blocks[index];

      blocks[index] =
        blocks[index - 1];

      blocks[index - 1] =
        temp;

      return {
        ...previous,
        blocks,
      };
    });
  };

  /* =====================================================
     MOVE DOWN
===================================================== */

  const moveDown = (
    index: number,
  ) => {
    const block =
      draft.blocks[index];

    if (
      !block ||
      block.type !==
        "checklist" ||
      index >=
        draft.blocks.length - 1
    ) {
      return;
    }

    setSavedMessage(false);

    setDraft((previous) => {
      const blocks = [
        ...previous.blocks,
      ];

      const temp =
        blocks[index];

      blocks[index] =
        blocks[index + 1];

      blocks[index + 1] =
        temp;

      return {
        ...previous,
        blocks,
      };
    });
  };

  /* =====================================================
     DRAG START

     6-dot icon নেই।
     Checklist row নিজেই draggable।
===================================================== */

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    const block =
      draft.blocks[index];

    if (
      block?.type !==
      "checklist"
    ) {
      event.preventDefault();
      return;
    }

    setDraggedIndex(index);
    setDragOverIndex(index);

    event.dataTransfer.effectAllowed =
      "move";

    event.dataTransfer.setData(
      "text/plain",
      String(index),
    );
  };

  /* =====================================================
     DRAG OVER
===================================================== */

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    if (
      draft.blocks[index]
        ?.type !== "checklist"
    ) {
      return;
    }

    event.preventDefault();

    event.dataTransfer.dropEffect =
      "move";

    setDragOverIndex(index);
  };

  /* =====================================================
     DROP
===================================================== */

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    targetIndex: number,
  ) => {
    event.preventDefault();

    const sourceValue =
      event.dataTransfer.getData(
        "text/plain",
      );

    const sourceIndex =
      sourceValue !== ""
        ? Number(sourceValue)
        : draggedIndex;

    if (
      sourceIndex === null ||
      sourceIndex ===
        undefined ||
      Number.isNaN(
        sourceIndex,
      ) ||
      sourceIndex ===
        targetIndex
    ) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    if (
      draft.blocks[
        sourceIndex
      ]?.type !== "checklist"
    ) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setSavedMessage(false);

    setDraft((previous) => {
      const blocks = [
        ...previous.blocks,
      ];

      const [
        movedBlock,
      ] = blocks.splice(
        sourceIndex,
        1,
      );

      if (!movedBlock) {
        return previous;
      }

      blocks.splice(
        targetIndex,
        0,
        movedBlock,
      );

      return {
        ...previous,
        blocks,
      };
    });

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  /* =====================================================
     DRAG END
===================================================== */

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  /* =====================================================
     KEYBOARD
===================================================== */

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number,
  ) => {
    const block =
      draft.blocks[index];

    if (!block) {
      return;
    }

    /*
     * ENTER
     *
     * শুধু নতুন line তৈরি হবে।
     * আগের line-এর type পরিবর্তন হবে না।
     */
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      addBlock(index);

      return;
    }

    /*
     * Empty block + Backspace
     */
    if (
      event.key ===
        "Backspace" &&
      block.text === "" &&
      draft.blocks.length > 1
    ) {
      event.preventDefault();

      deleteBlock(
        block.id,
      );
    }
  };

  /* =====================================================
     MAKE TEXT
     
     ONLY ACTIVE BLOCK
===================================================== */

  const makeText = () => {
    if (!activeBlockId) {
      return;
    }

    setSavedMessage(false);

    setDraft((previous) => ({
      ...previous,

      blocks: previous.blocks.map(
        (block) =>
          block.id ===
          activeBlockId
            ? {
                ...block,
                type: "text",
                checked:
                  undefined,
              }
            : block,
      ),
    }));
  };

  /* =====================================================
     MAKE CHECKLIST
     
     ONLY ACTIVE BLOCK
===================================================== */

  const makeChecklist = () => {
    if (!activeBlockId) {
      return;
    }

    setSavedMessage(false);

    setDraft((previous) => ({
      ...previous,

      blocks: previous.blocks.map(
        (block) =>
          block.id ===
          activeBlockId
            ? {
                ...block,
                type: "checklist",
                checked:
                  block.checked ??
                  false,
              }
            : block,
      ),
    }));
  };

  /* =====================================================
     UPDATE ACTIVE BLOCK
     
     Formatting only active block।
===================================================== */

  const updateActiveBlock = (
    changes: Partial<EditorBlock>,
  ) => {
    if (!activeBlockId) {
      return;
    }

    setSavedMessage(false);

    setDraft((previous) => ({
      ...previous,

      blocks: previous.blocks.map(
        (block) =>
          block.id ===
          activeBlockId
            ? {
                ...block,
                ...changes,
              }
            : block,
      ),
    }));
  };

  /* =====================================================
     BOLD
===================================================== */

  const toggleBold = () => {
    if (!activeBlock) {
      return;
    }

    updateActiveBlock({
      bold:
        !activeBlock.bold,
    });
  };

  /* =====================================================
     PIN
===================================================== */

  const togglePin = async () => {
    const updatedNote: EditorNote =
      {
        ...draft,
        pinned:
          !draft.pinned,
      };

    setDraft(updatedNote);
    setSavedMessage(false);

    if (onTogglePin) {
      await onTogglePin(
        updatedNote,
      );

      return;
    }

    if (onSave) {
      try {
        setSaving(true);

        await onSave(
          updatedNote,
        );

        setSavedMessage(true);

        window.setTimeout(() => {
          setSavedMessage(false);
        }, 2000);
      } finally {
        setSaving(false);
      }
    }
  };

  /* =====================================================
     SAVE
===================================================== */

  const handleSave = async () => {
    if (
      !onSave ||
      saving
    ) {
      return;
    }

    try {
      setSaving(true);
      setSavedMessage(false);

      await onSave(draft);

      setSavedMessage(true);

      window.setTimeout(() => {
        setSavedMessage(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Failed to save note:",
        error,
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     DELETE NOTE
===================================================== */

  const handleDelete = async () => {
    if (!onDelete) {
      return;
    }

    await onDelete(draft);
  };

  /* =====================================================
     TEXTAREA INPUT
     
     Content area যতটুকু দরকার ততটুকুই height নেবে।
     Empty line-এর জন্য extra height নয়।
===================================================== */

  const handleInput = (
    event: React.FormEvent<HTMLTextAreaElement>,
  ) => {
    const textarea =
      event.currentTarget;

    textarea.style.height =
      "0px";

    /*
     * Minimum মাত্র 22px।
     */
    textarea.style.height =
      `${Math.max(
        22,
        textarea.scrollHeight,
      )}px`;
  };

  /* =====================================================
     ACTIVE BLOCK
===================================================== */

  const activeBlock =
    draft.blocks.find(
      (block) =>
        block.id ===
        activeBlockId,
    );

  const isActiveText =
    activeBlock?.type ===
    "text";

  const isActiveChecklist =
    activeBlock?.type ===
    "checklist";

  /* =====================================================
     RENDER
===================================================== */

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">

        <div className="flex items-center gap-1">

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              void togglePin()
            }
            disabled={saving}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
              draft.pinned
                ? "bg-green-50 text-green-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
            aria-label={
              draft.pinned
                ? "Unpin note"
                : "Pin note"
            }
          >
            {draft.pinned ? (
              <PinOff size={16} />
            ) : (
              <Pin size={16} />
            )}
          </button>

        </div>

        <div className="flex items-center gap-2">

          {savedMessage && (
            <span className="text-[11px] font-medium text-green-600">
              Saved
            </span>
          )}

          {onSave && (
            <button
              type="button"
              onClick={() =>
                void handleSave()
              }
              disabled={saving}
              className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : "Save"}
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() =>
                void handleDelete()
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-500"
              aria-label="Delete note"
            >
              <Trash2 size={16} />
            </button>
          )}

        </div>
      </div>

      {/* =================================================
          CONTENT AREA

          IMPORTANT:
          এখানে line gap ইচ্ছাকৃতভাবে খুব কম।
      ================================================= */}

      <div className="min-h-0 flex-1 overflow-y-auto">

        <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">

          {/* TITLE */}

          <input
            type="text"
            value={draft.title}
            onChange={(event) =>
              changeTitle(
                event.target.value,
              )
            }
            placeholder="Title"
            className="mb-3 w-full border-0 bg-transparent text-xl font-semibold leading-7 text-black outline-none placeholder:text-gray-300"
          />

          {/* =============================================
              CONTENT BLOCKS

              আগে:
              space-y-1
              py-1

              এখন:
              space-y-0
              py-0

              তাই দুই লাইনের মাঝের gap অনেক কম।
          ============================================= */}

          <div className="space-y-0">

            {draft.blocks.map(
              (
                block,
                index,
              ) => {
                const isChecklist =
                  block.type ===
                  "checklist";

                const isDragging =
                  draggedIndex ===
                  index;

                const isDragOver =
                  dragOverIndex ===
                    index &&
                  draggedIndex !==
                    index;

                const isActive =
                  activeBlockId ===
                  block.id;

                return (
                  <div
                    key={block.id}
                    draggable={
                      isChecklist
                    }
                    onDragStart={(
                      event,
                    ) =>
                      handleDragStart(
                        event,
                        index,
                      )
                    }
                    onDragOver={(
                      event,
                    ) =>
                      handleDragOver(
                        event,
                        index,
                      )
                    }
                    onDrop={(event) =>
                      handleDrop(
                        event,
                        index,
                      )
                    }
                    onDragEnd={
                      handleDragEnd
                    }
                    className={`flex items-start rounded-md py-0 transition ${
                      isDragging
                        ? "opacity-40"
                        : ""
                    } ${
                      isDragOver
                        ? "border-t-2 border-green-500"
                        : ""
                    } ${
                      isActive
                        ? "bg-gray-50/30"
                        : ""
                    }`}
                  >

                    {/* =================================
                        CHECKBOX
                        ONLY CHECKLIST
                    ================================= */}

                    {isChecklist && (
                      <button
                        type="button"
                        onClick={() =>
                          toggleCheck(
                            block.id,
                          )
                        }
                        className={`mt-[2px] mr-2 flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[4px] border transition ${
                          block.checked
                            ? "border-green-600 bg-green-600 text-white"
                            : "border-gray-400 bg-white hover:border-green-500"
                        }`}
                        aria-label={
                          block.checked
                            ? "Uncheck"
                            : "Check"
                        }
                      >
                        {block.checked && (
                          <span className="text-[10px] font-bold leading-none">
                            ✓
                          </span>
                        )}
                      </button>
                    )}

                    {/* =================================
                        CONTENT TEXTAREA

                        VERY SMALL HEIGHT/GAP
                    ================================= */}

                    <textarea
                      ref={(
                        element,
                      ) => {
                        textareaRefs.current[
                          block.id
                        ] = element;
                      }}
                      value={
                        block.text
                      }
                      onFocus={() =>
                        setActiveBlock(
                          block.id,
                        )
                      }
                      onClick={() =>
                        setActiveBlock(
                          block.id,
                        )
                      }
                      onChange={(
                        event,
                      ) =>
                        changeBlock(
                          block.id,
                          event.target
                            .value,
                        )
                      }
                      onInput={
                        handleInput
                      }
                      onKeyDown={(
                        event,
                      ) =>
                        handleKeyDown(
                          event,
                          index,
                        )
                      }
                      rows={1}
                      placeholder={
                        isChecklist
                          ? "List item"
                          : "Write something..."
                      }
                      style={{
                        /*
                         * Content height কম।
                         */
                        minHeight:
                          "22px",

                        height:
                          "22px",

                        /*
                         * Default line height
                         * খুব compact।
                         */
                        lineHeight:
                          block.lineHeight ??
                          DEFAULT_LINE_HEIGHT,

                        fontWeight:
                          block.bold
                            ? 700
                            : 400,

                        fontSize: `${block.fontSize ?? DEFAULT_FONT_SIZE}px`,

                        fontFamily:
                          block.fontFamily ??
                          DEFAULT_FONT_FAMILY,
                      }}
                      className="m-0 flex-1 resize-none overflow-hidden border-0 bg-transparent p-0 text-black outline-none placeholder:text-gray-300"
                    />

                    {/* =================================
                        CHECKLIST CONTROLS

                        ONLY CHECKLIST
                    ================================= */}

                    {isChecklist && (
                      <div className="ml-2 flex shrink-0 items-center">

                        {/* UP */}

                        <button
                          type="button"
                          onClick={() =>
                            moveUp(
                              index,
                            )
                          }
                          disabled={
                            index ===
                            0
                          }
                          className="flex h-6 w-6 items-center justify-center rounded-md text-xs text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20"
                          aria-label="Move checklist up"
                        >
                          ↑
                        </button>

                        {/* DOWN */}

                        <button
                          type="button"
                          onClick={() =>
                            moveDown(
                              index,
                            )
                          }
                          disabled={
                            index ===
                            draft.blocks
                              .length -
                              1
                          }
                          className="flex h-6 w-6 items-center justify-center rounded-md text-xs text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20"
                          aria-label="Move checklist down"
                        >
                          ↓
                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          onClick={() =>
                            deleteBlock(
                              block.id,
                            )
                          }
                          className="flex h-6 w-6 items-center justify-center rounded-md text-sm text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                          aria-label="Delete checklist"
                        >
                          ×
                        </button>

                      </div>
                    )}

                  </div>
                );
              },
            )}

          </div>
        </div>
      </div>

      {/* =================================================
          FORMAT TOOLBAR
          
          এই অংশের spacing পরিবর্তন করা হয়নি।
      ================================================= */}

      <div className="shrink-0 border-t border-gray-200 bg-white px-3 py-2">

        <div className="mx-auto flex max-w-3xl items-center justify-center gap-1.5 overflow-x-auto">

          {/* BOLD */}

          <button
            type="button"
            onClick={toggleBold}
            disabled={!activeBlock}
            title="Bold"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold transition ${
              activeBlock?.bold
                ? "bg-gray-200 text-black"
                : "text-gray-600 hover:bg-gray-100"
            } disabled:opacity-40`}
          >
            B
          </button>

          <div className="mx-1 h-5 w-px shrink-0 bg-gray-200" />

          {/* FONT */}

          <select
            value={
              activeBlock?.fontFamily ??
              DEFAULT_FONT_FAMILY
            }
            onChange={(event) =>
              updateActiveBlock({
                fontFamily:
                  event.target.value,
              })
            }
            disabled={!activeBlock}
            className="h-8 min-w-[125px] shrink-0 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none focus:border-green-500 disabled:opacity-40"
          >
            <option value="Hind Siliguri">
              Hind Siliguri
            </option>

            <option value="Arial">
              Arial
            </option>

            <option value="Georgia">
              Georgia
            </option>

            <option value="sans-serif">
              Sans Serif
            </option>

            <option value="serif">
              Serif
            </option>
          </select>

          {/* FONT SIZE */}

          <select
            value={
              activeBlock?.fontSize ??
              DEFAULT_FONT_SIZE
            }
            onChange={(event) =>
              updateActiveBlock({
                fontSize:
                  Number(
                    event.target
                      .value,
                  ),
              })
            }
            disabled={!activeBlock}
            className="h-8 w-[65px] shrink-0 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none focus:border-green-500 disabled:opacity-40"
          >
            <option value={12}>
              12
            </option>

            <option value={13}>
              13
            </option>

            <option value={14}>
              14
            </option>

            <option value={16}>
              16
            </option>

            <option value={18}>
              18
            </option>

            <option value={20}>
              20
            </option>

            <option value={24}>
              24
            </option>

            <option value={28}>
              28
            </option>

            <option value={32}>
              32
            </option>
          </select>

          {/* LINE HEIGHT */}

          <select
            value={
              activeBlock?.lineHeight ??
              DEFAULT_LINE_HEIGHT
            }
            onChange={(event) =>
              updateActiveBlock({
                lineHeight:
                  Number(
                    event.target
                      .value,
                  ),
              })
            }
            disabled={!activeBlock}
            className="h-8 w-[68px] shrink-0 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none focus:border-green-500 disabled:opacity-40"
          >
            <option value={0.9}>
              0.9
            </option>

            <option value={1}>
              1.0
            </option>

            <option value={1.1}>
              1.1
            </option>

            <option value={1.2}>
              1.2
            </option>

            <option value={1.4}>
              1.4
            </option>

            <option value={1.6}>
              1.6
            </option>

            <option value={1.8}>
              1.8
            </option>

            <option value={2}>
              2.0
            </option>
          </select>

          <div className="mx-1 h-5 w-px shrink-0 bg-gray-200" />

          {/* TEXT */}

          <button
            type="button"
            onClick={makeText}
            disabled={!activeBlock}
            className={`h-8 shrink-0 rounded-md px-3 text-xs font-medium transition ${
              isActiveText
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            } disabled:opacity-40`}
          >
            Text
          </button>

          {/* CHECKLIST */}

          <button
            type="button"
            onClick={makeChecklist}
            disabled={!activeBlock}
            className={`h-8 shrink-0 rounded-md px-3 text-xs font-medium transition ${
              isActiveChecklist
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            } disabled:opacity-40`}
          >
            Checklist
          </button>

        </div>
      </div>

    </div>
  );
}