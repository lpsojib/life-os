"use client";

import { Pin, PinOff, Trash2 } from "lucide-react";

import { Note } from "../types/notebook.types";

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
  onTogglePin: (note: Note) => void;
}

export default function NoteCard({
  note,
  onDelete,
  onTogglePin,
}: NoteCardProps) {
  const preview =
    note.type === "checklist"
      ? note.checklist
          .slice(0, 4)
          .map((item) => `${item.completed ? "✓" : "○"} ${item.text}`)
          .join("\n")
      : note.content;

  return (
    <article
      className="
        group relative flex min-h-[190px] flex-col
        overflow-hidden rounded-2xl border border-black/5
        bg-white p-5
        shadow-sm transition-all duration-200
        hover:-translate-y-1 hover:shadow-lg
      "
    >
      {/* Pin */}
      <button
        type="button"
        onClick={() => onTogglePin(note)}
        className="
          absolute right-4 top-4 rounded-lg p-2
          text-gray-400 transition
          hover:bg-gray-100 hover:text-gray-900
        "
        aria-label={note.pinned ? "Unpin note" : "Pin note"}
      >
        {note.pinned ? (
          <Pin size={17} className="fill-current" />
        ) : (
          <PinOff size={17} />
        )}
      </button>

      {/* Title */}
      <h3 className="pr-10 text-lg font-semibold text-gray-900">
        {note.title || "Untitled Note"}
      </h3>

      {/* Type */}
      <div className="mt-2">
        <span
          className="
            inline-flex rounded-full bg-gray-100
            px-2.5 py-1 text-xs font-medium text-gray-600
          "
        >
          {note.type === "checklist" ? "Checklist" : "Text"}
        </span>
      </div>

      {/* Preview */}
      <div className="mt-4 flex-1">
        {note.type === "checklist" ? (
          <div className="space-y-2">
            {note.checklist.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <span
                  className={`
                    flex h-4 w-4 shrink-0 items-center justify-center
                    rounded border text-[10px]
                    ${
                      item.completed
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-gray-300"
                    }
                  `}
                >
                  {item.completed ? "✓" : ""}
                </span>

                <span
                  className={
                    item.completed
                      ? "line-through text-gray-400"
                      : ""
                  }
                >
                  {item.text}
                </span>
              </div>
            ))}

            {note.checklist.length > 4 && (
              <p className="text-xs text-gray-400">
                +{note.checklist.length - 4} more
              </p>
            )}
          </div>
        ) : (
          <p className="line-clamp-5 whitespace-pre-line text-sm leading-6 text-gray-600">
            {preview || "Empty note"}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-xs text-gray-400">
          {formatDate(note.updatedAt)}
        </span>

        <button
          type="button"
          onClick={() => onDelete(note.id)}
          className="
            rounded-lg p-2 text-gray-400
            opacity-0 transition
            hover:bg-red-50 hover:text-red-500
            group-hover:opacity-100
          "
          aria-label="Delete note"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}