"use client";

import {
  Check,
  GripVertical,
  Trash2,
} from "lucide-react";

import {
  NoteBlock as NoteBlockType,
} from "../types/notebook.types";

interface NoteBlockProps {
  block: NoteBlockType;

  onChange: (
    id: string,
    value: string,
  ) => void;

  onToggle: (
    id: string,
  ) => void;

  onDelete: (
    id: string,
  ) => void;
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
        group
        flex
        items-start
        gap-1.5
        rounded-lg
        px-1
        py-0.5
        transition
        hover:bg-gray-50
      "
    >
      {/* Drag Handle */}
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
          size={15}
        />
      </div>

      {/* Checklist Checkbox */}
      {isChecklist && (
        <button
          type="button"
          onClick={() =>
            onToggle(block.id)
          }
          className={`
            mt-1.5
            flex
            h-[18px]
            w-[18px]
            shrink-0
            items-center
            justify-center
            rounded-[5px]
            border
            transition
            ${
              block.completed
                ? "border-green-500 bg-green-500 text-white"
                : "border-gray-300 bg-white hover:border-green-400"
            }
          `}
          aria-label={
            block.completed
              ? "Mark incomplete"
              : "Mark complete"
          }
        >
          {block.completed && (
            <Check size={12} />
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
          min-h-[30px]
          flex-1
          resize-none
          border-0
          bg-transparent
          px-1
          py-0.5
          text-[15px]
          leading-5
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
          onDelete(block.id)
        }
        className="
          mt-1
          shrink-0
          rounded-md
          p-1
          text-gray-200
          opacity-0
          transition
          group-hover:opacity-100
          hover:bg-red-50
          hover:text-red-500
        "
        aria-label="Delete block"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}