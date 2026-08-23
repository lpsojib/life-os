"use client";

import {
  CheckSquare,
  Pin,
  PinOff,
  FileText,
  MoreVertical,
} from "lucide-react";

import { Note } from "../types/notebook.types";

interface NoteCardProps {
  note: Note;
  onClick?: () => void;
  onTogglePin?: () => void;
}

export default function NoteCard({
  note,
  onClick,
  onTogglePin,
}: NoteCardProps) {
  const blocks = Array.isArray(note.blocks)
    ? note.blocks
    : [];

  const textBlocks = blocks.filter(
    (block) =>
      block.type === "text" &&
      Boolean(block.text?.trim()),
  );

  const checklistBlocks = blocks.filter(
    (block) =>
      block.type === "checklist" &&
      Boolean(block.text?.trim()),
  );

  const hasText = textBlocks.length > 0;

  const hasCheckbox =
    checklistBlocks.length > 0;

  const totalChecklist =
    checklistBlocks.length;

  const completedChecklist =
    checklistBlocks.filter(
      (block) => block.checked === true,
    ).length;

  const previewBlocks = blocks
    .filter((block) =>
      Boolean(block.text?.trim()),
    )
    .slice(0, 4);

  function handlePinClick(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    event.stopPropagation();
    onTogglePin?.();
  }

  return (
    <article
      onClick={onClick}
      className="
        group
        relative
        cursor-pointer
        overflow-hidden
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-5
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-gray-300
        hover:shadow-md
      "
    >
      {/* =========================================
          TOP
      ========================================= */}

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {note.title?.trim() ? (
            <h3
              className="
                line-clamp-2
                text-base
                font-semibold
                leading-6
                text-gray-900
              "
            >
              {note.title}
            </h3>
          ) : (
            <h3
              className="
                text-base
                font-semibold
                leading-6
                text-gray-400
              "
            >
              Untitled Note
            </h3>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {note.pinned ? (
            <button
              type="button"
              onClick={handlePinClick}
              title="Unpin note"
              className="
                rounded-lg
                border
                border-green-200
                bg-green-50
                p-2
                text-green-600
                transition
                hover:border-green-300
                hover:bg-green-100
              "
            >
              <Pin size={15} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePinClick}
              title="Pin note"
              className="
                rounded-lg
                border
                border-gray-200
                bg-white
                p-2
                text-gray-400
                opacity-0
                transition
                group-hover:opacity-100
                hover:border-gray-300
                hover:bg-gray-50
                hover:text-gray-700
              "
            >
              <PinOff size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
            }}
            className="
              rounded-lg
              border
              border-gray-200
              bg-white
              p-2
              text-gray-400
              opacity-0
              transition
              group-hover:opacity-100
              hover:border-gray-300
              hover:bg-gray-50
              hover:text-gray-700
            "
            title="More"
          >
            <MoreVertical size={15} />
          </button>
        </div>
      </div>

      {/* =========================================
          CONTENT PREVIEW
      ========================================= */}

      {previewBlocks.length > 0 ? (
        <div className="space-y-2.5">
          {previewBlocks.map((block) => {
            const isChecklist =
              block.type === "checklist";

            return (
              <div
                key={block.id}
                className="
                  flex
                  min-w-0
                  items-start
                  gap-2.5
                "
              >
                {isChecklist ? (
                  <span
                    className={`
                      mt-1
                      flex
                      h-4
                      w-4
                      shrink-0
                      items-center
                      justify-center
                      rounded-[4px]
                      border
                      ${
                        block.checked
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-300 bg-white"
                      }
                    `}
                  >
                    {block.checked ? (
                      <CheckSquare
                        size={11}
                        strokeWidth={3}
                      />
                    ) : null}
                  </span>
                ) : (
                  <span
                    className="
                      mt-2
                      h-1.5
                      w-1.5
                      shrink-0
                      rounded-full
                      bg-gray-300
                    "
                  />
                )}

                <p
                  className={`
                    line-clamp-2
                    min-w-0
                    flex-1
                    text-[15px]
                    leading-6
                    ${
                      block.checked
                        ? "text-gray-400 line-through"
                        : "text-gray-600"
                    }
                  `}
                >
                  {block.text}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="
            flex
            items-center
            gap-2
            py-3
            text-sm
            text-gray-400
          "
        >
          <FileText size={16} />
          <span>Empty note</span>
        </div>
      )}

      {/* =========================================
          FOOTER
      ========================================= */}

      <div
        className="
          mt-5
          flex
          items-center
          justify-between
          border-t
          border-gray-100
          pt-3
        "
      >
        <div className="flex items-center gap-2">
          {hasText ? (
            <span
              className="
                rounded-lg
                border
                border-gray-200
                bg-gray-50
                px-2.5
                py-1
                text-xs
                font-medium
                text-gray-500
              "
            >
              Paragraph
            </span>
          ) : null}

          {hasCheckbox ? (
            <span
              className="
                rounded-lg
                border
                border-gray-200
                bg-gray-50
                px-2.5
                py-1
                text-xs
                font-medium
                text-gray-500
              "
            >
              {completedChecklist}/
              {totalChecklist}{" "}
              Checklist
            </span>
          ) : null}
        </div>

        {note.pinned ? (
          <span
            className="
              flex
              items-center
              gap-1
              text-xs
              font-medium
              text-green-600
            "
          >
            <Pin size={12} />
            Pinned
          </span>
        ) : null}
      </div>
    </article>
  );
}