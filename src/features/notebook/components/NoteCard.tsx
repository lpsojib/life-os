"use client";

import {
  CheckSquare,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";

import { Note } from "../types/notebook.types";

interface NoteCardProps {
  note: Note;

  onOpen: () => void;

  onDelete: () => void;

  onPin: () => void;
}

export default function NoteCard({
  note,
  onOpen,
  onDelete,
  onPin,
}: NoteCardProps) {
  const blocks =
    Array.isArray(note.blocks)
      ? note.blocks
      : [];

  const textBlocks =
    blocks.filter(
      (block) =>
        block.type ===
          "text" &&
        block.text.trim(),
    );

  const checklistBlocks =
    blocks.filter(
      (block) =>
        block.type ===
          "checklist" &&
        block.text.trim(),
    );

  const hasParagraph =
    textBlocks.length > 0 ||
    Boolean(
      note.content?.trim(),
    );

  const hasCheckbox =
    checklistBlocks.length > 0 ||
    Boolean(
      note.checklist?.length,
    );

  const preview =
    textBlocks
      .map(
        (block) =>
          block.text,
      )
      .join(" ") ||
    note.content?.trim() ||
    checklistBlocks
      .map(
        (block) =>
          block.text,
      )
      .join(" ") ||
    "No content";

  let typeLabel =
    "Empty";

  if (
    hasParagraph &&
    hasCheckbox
  ) {
    typeLabel = "Both";
  } else if (hasParagraph) {
    typeLabel = "Paragraph";
  } else if (hasCheckbox) {
    typeLabel = "Checkbox";
  }

  return (
    <div
      className="
        group
        relative
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-5
        shadow-sm
        transition
        hover:-translate-y-0.5
        hover:shadow-lg
      "
    >
      <button
        type="button"
        onClick={onPin}
        className="
          absolute
          right-3
          top-3
          rounded-xl
          p-2
          text-gray-400
          transition
          hover:bg-gray-100
        "
      >
        {note.pinned ? (
          <Pin
            size={17}
            className="text-green-600"
          />
        ) : (
          <PinOff size={17} />
        )}
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left"
      >
        <div className="pr-9">
          <h3
            className="
              truncate
              text-base
              font-semibold
              text-gray-900
            "
          >
            {note.title ||
              "Untitled Note"}
          </h3>

          <p
            className="
              mt-2
              line-clamp-3
              min-h-[60px]
              text-sm
              leading-5
              text-gray-500
            "
          >
            {preview}
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          {typeLabel ===
            "Paragraph" && (
            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-600">
              Paragraph
            </span>
          )}

          {typeLabel ===
            "Checkbox" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 text-[11px] font-medium text-orange-600">
              <CheckSquare size={12} />
              Checkbox
            </span>
          )}

          {typeLabel ===
            "Both" && (
            <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-[11px] font-medium text-purple-600">
              Both
            </span>
          )}

          {note.pinned && (
            <span className="rounded-lg bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-600">
              Pinned
            </span>
          )}
        </div>
      </button>

      <div
        className="
          mt-4
          flex
          items-center
          justify-between
          border-t
          border-gray-100
          pt-3
        "
      >
        <span className="text-[11px] text-gray-400">
          {formatDate(
            note.updatedAt,
          )}
        </span>

        <button
          type="button"
          onClick={onDelete}
          className="
            rounded-lg
            p-2
            text-gray-400
            transition
            hover:bg-red-50
            hover:text-red-500
          "
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function formatDate(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}