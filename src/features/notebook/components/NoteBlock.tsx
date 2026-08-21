"use client";

import {
  Check,
  GripVertical,
  Trash2,
} from "lucide-react";

import { NoteBlock as NoteBlockType } from "../types/notebook.types";

interface NoteBlockProps {
  block: NoteBlockType;
  onChange: (
    id: string,
    value: string,
  ) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NoteBlock({
  block,
  onChange,
  onToggle,
  onDelete,
}: NoteBlockProps) {
  const isChecklist =
    block.type === "checklist";

  return (
    <div
      className="
        group flex items-start gap-2
        rounded-xl
        px-2 py-2
        transition
        hover:bg-gray-50
      "
    >
      {/* Drag handle */}
      <div
        className="
          mt-2 shrink-0
          text-gray-200
          opacity-0
          transition
          group-hover:opacity-100
        "
      >
        <GripVertical size={17} />
      </div>

      {/* Checklist checkbox */}
      {isChecklist && (
        <button
          type="button"
          onClick={() =>
            onToggle(block.id)
          }
          className={`
            mt-2 flex h-5 w-5
            shrink-0 items-center
            justify-center
            rounded-md border
            transition
            ${
              block.completed
                ? "border-green-500 bg-green-500 text-white"
                : "border-gray-300 bg-white hover:border-green-400"
            }
          `}
        >
          {block.completed && (
            <Check size={13} />
          )}
        </button>
      )}

      {/* Text */}
      <textarea
        value={block.text}
        onChange={(event) =>
          onChange(
            block.id,
            event.target.value,
          )
        }
        placeholder={
          isChecklist
            ? "Checklist item..."
            : "Write something..."
        }
        rows={1}
        className={`
          min-h-[36px]
          flex-1
          resize-none
          border-0
          bg-transparent
          px-1 py-1
          text-[15px]
          leading-7
          outline-none
          placeholder:text-gray-300
          ${
            block.completed
              ? "text-gray-400 line-through"
              : "text-gray-700"
          }
        `}
        onInput={(event) => {
          const textarea =
            event.currentTarget;

          textarea.style.height = "auto";
          textarea.style.height =
            `${textarea.scrollHeight}px`;
        }}
      />

      {/* Delete */}
      <button
        type="button"
        onClick={() =>
          onDelete(block.id)
        }
        className="
          mt-2 shrink-0
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
        <Trash2 size={15} />
      </button>
    </div>
  );
}