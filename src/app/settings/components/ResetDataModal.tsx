"use client";

import { Check, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";

import {
  RESET_MODULES,
  ResetModule,
} from "../types/settings.types";

interface ResetDataModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: (modules: ResetModule[]) => void;
}

export default function ResetDataModal({
  open,
  onClose,
  onContinue,
}: ResetDataModalProps) {
  const [selected, setSelected] = useState<ResetModule[]>(
    RESET_MODULES.map((item) => item.id),
  );

  const allSelected = useMemo(
    () => selected.length === RESET_MODULES.length,
    [selected],
  );

  if (!open) {
    return null;
  }

  function toggleModule(id: ResetModule) {
    setSelected((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      return [...current, id];
    });
  }

  function selectAll() {
    setSelected(RESET_MODULES.map((item) => item.id));
  }

  function clearAll() {
    setSelected([]);
  }

  function handleContinue() {
    if (selected.length === 0) {
      return;
    }

    onContinue(selected);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-data-title"
        className="w-full max-w-md overflow-hidden rounded-3xl border bg-background shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10">
              <RotateCcw className="h-5 w-5 text-red-500" />
            </div>

            <div>
              <h2
                id="reset-data-title"
                className="text-lg font-bold"
              >
                Reset Life OS
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Select the data you want to reset.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Select controls */}
        <div className="flex items-center justify-between border-b px-5 py-3 sm:px-6">
          <p className="text-xs font-medium text-muted-foreground">
            {selected.length} of {RESET_MODULES.length} selected
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={allSelected ? clearAll : selectAll}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
            >
              {allSelected ? "Clear All" : "Select All"}
            </button>
          </div>
        </div>

        {/* Modules */}
        <div className="max-h-[55vh] overflow-y-auto px-5 py-4 sm:px-6">
          <div className="space-y-2">
            {RESET_MODULES.map((item) => {
              const isSelected = selected.includes(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleModule(item.id)}
                  aria-pressed={isSelected}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                    isSelected
                      ? "border-red-500/30 bg-red-500/[0.04]"
                      : "border-border bg-background hover:bg-muted/50"
                  }`}
                >
                  {/* Custom checkbox */}
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                      isSelected
                        ? "border-red-500 bg-red-500 text-white"
                        : "border-muted-foreground/30 bg-background"
                    }`}
                  >
                    {isSelected && (
                      <Check
                        className="h-3.5 w-3.5"
                        strokeWidth={3}
                      />
                    )}
                  </span>

                  {/* Text */}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">
                      {item.label}
                    </span>

                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Warning */}
        <div className="mx-5 mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 sm:mx-6">
          <p className="text-xs leading-5 text-muted-foreground">
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              Important:
            </span>{" "}
            Resetting selected data cannot be undone. Your account
            and login information will not be affected.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t bg-muted/20 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border bg-background px-4 py-3 text-sm font-semibold transition hover:bg-muted"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleContinue}
            disabled={selected.length === 0}
            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset Selected
          </button>
        </div>
      </div>
    </div>
  );
}