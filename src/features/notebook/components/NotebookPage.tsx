"use client";

import { useState } from "react";

import {
  FileText,
  Plus,
  Search,
} from "lucide-react";

import { useNotes } from "../hooks/useNotes";

export default function NotebookPage() {
  const {
    notes,
    loading,
    error,
  } = useNotes();

  const [search, setSearch] =
    useState("");

  const filteredNotes =
    notes.filter((note) => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return true;
      }

      return (
        note.title
          .toLowerCase()
          .includes(query) ||
        note.content
          .toLowerCase()
          .includes(query)
      );
    });

  if (loading) {
    return (
      <div className="p-6">
        <div
          className="
            mx-auto
            max-w-6xl
            rounded-2xl
            border
            border-gray-100
            bg-white
            p-8
            text-center
            text-sm
            text-gray-500
          "
        >
          Loading notes...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div
          className="
            mx-auto
            max-w-6xl
            rounded-2xl
            border
            border-red-100
            bg-red-50
            p-6
            text-sm
            text-red-600
          "
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        min-h-full
        bg-gray-50
        p-4
        sm:p-6
      "
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div
          className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <h1
              className="
                text-2xl
                font-bold
                text-gray-900
                sm:text-3xl
              "
            >
              Notebook
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-gray-500
              "
            >
              Keep your thoughts,
              notes and checklists
              organized.
            </p>
          </div>

          <button
            type="button"
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-green-600
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-green-700
            "
          >
            <Plus size={18} />
            New Note
          </button>
        </div>

        {/* Search */}
        <div className="mt-6">
          <div
            className="
              flex
              items-center
              gap-3
              rounded-xl
              border
              border-gray-200
              bg-white
              px-4
              py-3
            "
          >
            <Search
              size={18}
              className="text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search notes..."
              className="
                w-full
                border-0
                bg-transparent
                text-sm
                text-gray-900
                outline-none
                placeholder:text-gray-400
              "
            />
          </div>
        </div>

        {/* Notes */}
        {filteredNotes.length === 0 ? (
          <div
            className="
              mt-6
              rounded-2xl
              border
              border-dashed
              border-gray-200
              bg-white
              p-10
              text-center
            "
          >
            <div
              className="
                mx-auto
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-xl
                bg-green-50
                text-green-600
              "
            >
              <FileText size={22} />
            </div>

            <h2
              className="
                mt-4
                font-semibold
                text-gray-800
              "
            >
              No notes found
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-gray-400
              "
            >
              Create your first
              note to get started.
            </p>
          </div>
        ) : (
          <div
            className="
              mt-6
              grid
              gap-4
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >
            {filteredNotes.map(
              (note) => (
                <div
                  key={note.id}
                  className="
                    rounded-2xl
                    border
                    border-gray-100
                    bg-white
                    p-5
                    shadow-sm
                    transition
                    hover:-translate-y-0.5
                    hover:shadow-md
                  "
                >
                  <div
                    className="
                      flex
                      items-start
                      gap-3
                    "
                  >
                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-green-50
                        text-green-600
                      "
                    >
                      <FileText
                        size={18}
                      />
                    </div>

                    <div className="min-w-0">
                      <h2
                        className="
                          truncate
                          font-semibold
                          text-gray-900
                        "
                      >
                        {note.title ||
                          "Untitled Note"}
                      </h2>

                      <p
                        className="
                          mt-1
                          line-clamp-3
                          text-sm
                          leading-6
                          text-gray-500
                        "
                      >
                        {note.content ||
                          "No content"}
                      </p>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}