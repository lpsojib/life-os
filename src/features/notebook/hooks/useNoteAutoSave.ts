"use client";

import { useEffect, useRef } from "react";

import { updateNote } from "../services/notebook.service";
import { Note } from "../types/notebook.types";

interface UseNoteAutoSaveProps {
  note: Note;
  title: string;
  blocks: Note["blocks"];
  enabled?: boolean;
  delay?: number;
  onSaved?: () => void;
  onError?: (error: unknown) => void;
}

export function useNoteAutoSave({
  note,
  title,
  blocks,
  enabled = true,
  delay = 1000,
  onSaved,
  onError,
}: UseNoteAutoSaveProps) {
  const firstRender = useRef(true);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Don't auto-save when the note is opened for the first time.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const cleanBlocks = (blocks ?? []).filter(
          (block) => block.text.trim() !== "",
        );

        const textBlocks = cleanBlocks.filter(
          (block) => block.type === "text",
        );

        const checklistBlocks = cleanBlocks.filter(
          (block) => block.type === "checklist",
        );

        const content = textBlocks
          .map((block) => block.text.trim())
          .filter(Boolean)
          .join("\n\n");

        const checklist = checklistBlocks.map((block) => ({
          id: block.id,
          text: block.text,
          completed: Boolean(block.completed),
        }));

        await updateNote(note.id, {
          title: title.trim() || "Untitled Note",
          blocks: cleanBlocks,
          content,
          checklist,
          type: note.type,
          pinned: note.pinned,
        });

        onSaved?.();
      } catch (error) {
        console.error("Auto-save failed:", error);
        onError?.(error);
      }
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    note.id,
    note.type,
    note.pinned,
    title,
    blocks,
    delay,
    enabled,
    onSaved,
    onError,
  ]);
}