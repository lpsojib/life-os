"use client";

import {
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";

import { Note } from "../types/notebook.types";

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onTogglePin?: () => void;
  onDelete?: () => void;
}

export default function NoteCard({
  note,
  onClick,
  onTogglePin,
  onDelete,
}: NoteCardProps) {
  const preview =
    note.blocks
      .map((block) => {
        const prefix =
          block.type === "checklist"
            ? block.checked
              ? "✓ "
              : "☐ "
            : "";

        return `${prefix}${block.text}`;
      })
      .filter(Boolean)
      .join(" ");

  const date = new Date(
    note.updatedAt,
  );

  const formattedDate =
    date.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      },
    );

  return (
    <article
      className="group relative cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm"
      onClick={onClick}
    >
      {/* PIN INDICATOR */}

      {note.pinned && (
        <div className="absolute right-3 top-3 text-green-600">
          <Pin size={15} />
        </div>
      )}

      {/* TITLE */}

      <h3
        className={`pr-7 text-[15px] font-semibold leading-5 text-black ${
          note.title
            ? ""
            : "text-gray-400"
        }`}
      >
        {note.title || "Untitled note"}
      </h3>

      {/* PREVIEW */}

      <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-[13px] leading-[1.45] text-gray-600">
        {preview ||
          "No content yet"}
      </p>

      {/* FOOTER */}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">
          {formattedDate}
        </span>

        <div
          className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          {/* PIN */}

          {onTogglePin && (
            <button
              type="button"
              onClick={
                onTogglePin
              }
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-green-600"
              aria-label={
                note.pinned
                  ? "Unpin note"
                  : "Pin note"
              }
            >
              {note.pinned ? (
                <PinOff
                  size={14}
                />
              ) : (
                <Pin
                  size={14}
                />
              )}
            </button>
          )}

          {/* DELETE */}

          {onDelete && (
            <button
              type="button"
              onClick={
                onDelete
              }
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-500"
              aria-label="Delete note"
            >
              <Trash2
                size={14}
              />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}