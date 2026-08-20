"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckSquare,
  FileText,
  Grid2X2,
  List,
  Pin,
  Plus,
  Search,
} from "lucide-react";

import NoteCard from "./NoteCard";

import {
  addNote,
  deleteNote,
  getNotes,
  toggleNotePin,
} from "../services/notebook.service";

import { Note, NoteType } from "../types/notebook.types";

type FilterType = "all" | "text" | "checklist" | "pinned";

export default function NotebookPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getNotes();

      setNotes(data);
    } catch (error) {
      console.error("Failed to load notes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadNotes();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadNotes]);

  async function handleCreateNote(type: NoteType) {
    try {
      const title =
        type === "checklist"
          ? "New Checklist"
          : "New Note";

      const id = await addNote(title, type);

      const newNote: Note = {
        id,
        title,
        type,
        content: "",
        checklist: [],
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setNotes((current) => [newNote, ...current]);
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  }

  async function handleDeleteNote(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteNote(id);

      setNotes((current) =>
        current.filter((note) => note.id !== id),
      );
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  }

  async function handleTogglePin(note: Note) {
    try {
      await toggleNotePin(note.id, !note.pinned);

      setNotes((current) =>
        current.map((item) =>
          item.id === note.id
            ? {
                ...item,
                pinned: !item.pinned,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error("Failed to update pin:", error);
    }
  }

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notes.filter((note) => {
      const matchesSearch =
        !query ||
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "text" && note.type === "text") ||
        (filter === "checklist" && note.type === "checklist") ||
        (filter === "pinned" && note.pinned);

      return matchesSearch && matchesFilter;
    });
  }, [notes, search, filter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600">
            <BookOpen size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Notebook
            </h1>

            <p className="text-sm text-gray-500">
              All your notes in one place
            </p>
          </div>
        </div>

        {/* New Note */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => handleCreateNote("text")}
            className="
              inline-flex items-center gap-2 rounded-xl
              bg-green-600 px-4 py-2.5
              text-sm font-semibold text-white
              shadow-sm transition
              hover:bg-green-700
            "
          >
            <Plus size={18} />
            New Note
          </button>

          {/* Small create options */}
          <div
            className="
              invisible absolute right-0 top-full z-20 mt-2
              w-44 rounded-xl border border-gray-100
              bg-white p-1.5 opacity-0 shadow-xl
              transition-all
              group-hover:visible group-hover:opacity-100
            "
          >
            <button
              type="button"
              onClick={() => handleCreateNote("text")}
              className="
                flex w-full items-center gap-3 rounded-lg
                px-3 py-2.5 text-sm text-gray-700
                hover:bg-gray-50
              "
            >
              <FileText size={17} />
              Text Note
            </button>

            <button
              type="button"
              onClick={() => handleCreateNote("checklist")}
              className="
                flex w-full items-center gap-3 rounded-lg
                px-3 py-2.5 text-sm text-gray-700
                hover:bg-gray-50
              "
            >
              <CheckSquare size={17} />
              Checklist
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative w-full lg:max-w-md">
          <Search
            size={18}
            className="
              absolute left-3 top-1/2
              -translate-y-1/2 text-gray-400
            "
          />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notes..."
            className="
              w-full rounded-xl border border-gray-200
              bg-white py-2.5 pl-10 pr-4
              text-sm outline-none
              transition
              focus:border-green-400
              focus:ring-2 focus:ring-green-100
            "
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Filters */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
            <FilterButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All
            </FilterButton>

            <FilterButton
              active={filter === "text"}
              onClick={() => setFilter("text")}
            >
              Text
            </FilterButton>

            <FilterButton
              active={filter === "checklist"}
              onClick={() => setFilter("checklist")}
            >
              Checklist
            </FilterButton>

            <FilterButton
              active={filter === "pinned"}
              onClick={() => setFilter("pinned")}
            >
              <Pin size={14} />
              Pinned
            </FilterButton>
          </div>

          {/* View */}
          <div className="hidden items-center gap-1 rounded-xl bg-gray-100 p-1 sm:flex">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`
                rounded-lg p-2 transition
                ${
                  view === "grid"
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-700"
                }
              `}
            >
              <Grid2X2 size={17} />
            </button>

            <button
              type="button"
              onClick={() => setView("list")}
              className={`
                rounded-lg p-2 transition
                ${
                  view === "list"
                    ? "bg-white text-green-600 shadow-sm"
                    : "text-gray-400 hover:text-gray-700"
                }
              `}
            >
              <List size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Notes */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredNotes.length === 0 ? (
        <EmptyState
          search={search}
          onCreate={() => handleCreateNote("text")}
        />
      ) : (
        <div
          className={
            view === "grid"
              ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
              : "space-y-3"
          }
        >
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={handleDeleteNote}
              onTogglePin={handleTogglePin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterButton({
  active,
  onClick,
  children,
}: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex shrink-0 items-center gap-1.5
        rounded-lg px-3 py-1.5
        text-xs font-medium transition
        ${
          active
            ? "bg-white text-green-600 shadow-sm"
            : "text-gray-500 hover:text-gray-800"
        }
      `}
    >
      {children}
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="
            h-[190px] animate-pulse
            rounded-2xl bg-gray-100
          "
        />
      ))}
    </div>
  );
}

interface EmptyStateProps {
  search: string;
  onCreate: () => void;
}

function EmptyState({
  search,
  onCreate,
}: EmptyStateProps) {
  return (
    <div
      className="
        flex min-h-[400px] flex-col
        items-center justify-center
        rounded-2xl border border-dashed
        border-gray-200 bg-white
        px-6 text-center
      "
    >
      <div
        className="
          mb-4 flex h-16 w-16
          items-center justify-center
          rounded-2xl bg-green-50
          text-green-600
        "
      >
        <BookOpen size={30} />
      </div>

      <h2 className="text-lg font-semibold text-gray-900">
        {search ? "No notes found" : "No notes yet"}
      </h2>

      <p className="mt-2 max-w-sm text-sm text-gray-500">
        {search
          ? "Try a different search term or filter."
          : "Create your first note and keep your ideas organized."}
      </p>

      {!search && (
        <button
          type="button"
          onClick={onCreate}
          className="
            mt-5 inline-flex items-center gap-2
            rounded-xl bg-green-600
            px-4 py-2.5
            text-sm font-semibold text-white
            hover:bg-green-700
          "
        >
          <Plus size={17} />
          Create Note
        </button>
      )}
    </div>
  );
}