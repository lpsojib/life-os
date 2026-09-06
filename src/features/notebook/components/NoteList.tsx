"use client";

import {
  FileText,
  Pin,
  Search,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import NoteCard from "./NoteCard";

import {
  Note,
} from "../types/notebook.types";

interface NoteListProps {
  notes: Note[];
  selectedNoteId?: string | null;
  onSelectNote: (
    note: Note,
  ) => void;
  onTogglePin?: (
    note: Note,
  ) => void;
  onDelete?: (
    note: Note,
  ) => void;
  onCreateNote?: () => void;
}

type FilterType =
  | "all"
  | "pinned";

export default function NoteList({
  notes,
  selectedNoteId,
  onSelectNote,
  onTogglePin,
  onDelete,
  onCreateNote,
}: NoteListProps) {
  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<FilterType>("all");

  /* =======================================================
     FILTER NOTES
  ======================================================= */

  const filteredNotes =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return notes.filter(
        (note) => {
          /*
           * PIN FILTER
           */
          if (
            filter === "pinned" &&
            !note.pinned
          ) {
            return false;
          }

          /*
           * SEARCH
           */
          if (!query) {
            return true;
          }

          const title =
            note.title
              .toLowerCase();

          const content =
            note.blocks
              .map(
                (block) =>
                  block.text,
              )
              .join(" ")
              .toLowerCase();

          return (
            title.includes(
              query,
            ) ||
            content.includes(
              query,
            )
          );
        },
      );
    }, [notes, search, filter]);

  /* =======================================================
     EMPTY STATE
  ======================================================= */

  const isEmpty =
    filteredNotes.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-50">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="shrink-0 border-b border-gray-200 bg-white">
        <div className="px-4 pb-3 pt-4 sm:px-5">
          {/* TITLE */}

          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <FileText
                  size={17}
                />
              </div>

              <div>
                <h1 className="text-[16px] font-semibold text-black">
                  Notes
                </h1>

                <p className="text-[11px] text-gray-400">
                  {notes.length}{" "}
                  {notes.length ===
                  1
                    ? "note"
                    : "notes"}
                </p>
              </div>
            </div>

            {/* NEW NOTE */}

            {onCreateNote && (
              <button
                type="button"
                onClick={
                  onCreateNote
                }
                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-green-700"
              >
                + New
              </button>
            )}
          </div>

          {/* SEARCH */}

          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={search}
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search notes..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-black outline-none transition placeholder:text-gray-400 focus:border-green-500 focus:bg-white"
            />
          </div>

          {/* FILTERS */}

          <div className="mt-3 flex items-center gap-1.5">
            {/* ALL */}

            <button
              type="button"
              onClick={() =>
                setFilter("all")
              }
              className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition ${
                filter === "all"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FileText
                size={13}
              />

              <span>
                All Notes
              </span>
            </button>

            {/* PINNED */}

            <button
              type="button"
              onClick={() =>
                setFilter("pinned")
              }
              className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition ${
                filter ===
                "pinned"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Pin
                size={13}
              />

              <span>
                Pinned
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
          NOTES
      ================================================= */}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        {isEmpty ? (
          /* =============================================
             EMPTY
          ============================================= */

          <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-300 shadow-sm">
              {search ? (
                <Search
                  size={21}
                />
              ) : filter ===
                "pinned" ? (
                <Pin
                  size={21}
                />
              ) : (
                <FileText
                  size={21}
                />
              )}
            </div>

            <h2 className="text-sm font-medium text-gray-700">
              {search
                ? "No notes found"
                : filter ===
                    "pinned"
                  ? "No pinned notes"
                  : "No notes yet"}
            </h2>

            <p className="mt-1 max-w-[250px] text-xs leading-5 text-gray-400">
              {search
                ? "Try a different search keyword."
                : filter ===
                    "pinned"
                  ? "Pin a note to see it here."
                  : "Create your first note to get started."}
            </p>

            {!search &&
              filter ===
                "all" &&
              onCreateNote && (
                <button
                  type="button"
                  onClick={
                    onCreateNote
                  }
                  className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-green-700"
                >
                  Create Note
                </button>
              )}
          </div>
        ) : (
          /* =============================================
             LIST
          ============================================= */

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {filteredNotes.map(
              (note) => (
                <div
                  key={note.id}
                  className={
                    selectedNoteId ===
                    note.id
                      ? "rounded-xl ring-2 ring-green-500/30"
                      : ""
                  }
                >
                  <NoteCard
                    note={note}
                    onClick={() =>
                      onSelectNote(
                        note,
                      )
                    }
                    onTogglePin={
                      onTogglePin
                        ? () =>
                            onTogglePin(
                              note,
                            )
                        : undefined
                    }
                    onDelete={
                      onDelete
                        ? () =>
                            onDelete(
                              note,
                            )
                        : undefined
                    }
                  />
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}