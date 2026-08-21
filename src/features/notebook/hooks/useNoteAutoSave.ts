"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  updateNote,
} from "../services/notebook.service";

import {
  updateNoteInStore,
} from "./useNotes";

import {
  Note,
} from "../types/notebook.types";

interface UseNoteAutoSaveProps {
  note: Note;

  title: string;

  blocks: Note["blocks"];

  enabled?: boolean;

  delay?: number;

  onSaved?: () => void;

  onError?: (
    error: unknown,
  ) => void;
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
  const firstRender =
    useRef(true);

  const latestSave =
    useRef(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (firstRender.current) {
      firstRender.current =
        false;

      return;
    }

    const timer =
      window.setTimeout(
        () => {
          void save();
        },
        delay,
      );

    async function save() {
      const saveId =
        Date.now();

      latestSave.current =
        saveId;

      try {
        const cleanBlocks =
          (
            blocks ?? []
          ).filter(
            (block) =>
              block.text
                .trim() !== "",
          );

        const textBlocks =
          cleanBlocks.filter(
            (block) =>
              block.type ===
              "text",
          );

        const checklistBlocks =
          cleanBlocks.filter(
            (block) =>
              block.type ===
              "checklist",
          );

        const content =
          textBlocks
            .map(
              (block) =>
                block.text,
            )
            .join("\n\n");

        const checklist =
          checklistBlocks.map(
            (block) => ({
              id: block.id,
              text: block.text,
              completed:
                Boolean(
                  block.completed,
                ),
            }),
          );

        const updatedNote:
          Note = {
          ...note,

          title:
            title.trim() ||
            "Untitled Note",

          blocks:
            cleanBlocks,

          content,

          checklist,

          updatedAt:
            new Date().toISOString(),
        };

        await updateNote(
          note.id,
          {
            title:
              updatedNote.title,

            blocks:
              updatedNote.blocks,

            content:
              updatedNote.content,

            checklist:
              updatedNote.checklist,

            type:
              updatedNote.type,

            pinned:
              updatedNote.pinned,
          },
        );

        /*
         * Only update store if this is
         * still the latest save.
         */
        if (
          latestSave.current ===
          saveId
        ) {
          updateNoteInStore(
            updatedNote,
          );

          onSaved?.();
        }
      } catch (error) {
        console.error(
          "Auto-save failed:",
          error,
        );

        if (
          latestSave.current ===
          saveId
        ) {
          onError?.(
            error,
          );
        }
      }
    }

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    note,
    title,
    blocks,
    delay,
    enabled,
    onSaved,
    onError,
  ]);
}