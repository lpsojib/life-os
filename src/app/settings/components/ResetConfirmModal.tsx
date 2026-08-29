"use client";

import {
  AlertTriangle,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";

import { RESET_MODULES, ResetModule } from "../types/settings.types";

interface ResetConfirmModalProps {
  open: boolean;
  modules: ResetModule[];
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ResetConfirmModal({
  open,
  modules,
  loading = false,
  onCancel,
  onConfirm,
}: ResetConfirmModalProps) {
  if (!open) {
    return null;
  }

  const selectedItems = RESET_MODULES.filter((item) =>
    modules.includes(item.id),
  );

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reset-confirm-title"
        className="w-full max-w-md overflow-hidden rounded-3xl border bg-background shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>

            <div>
              <h2
                id="reset-confirm-title"
                className="text-lg font-bold"
              >
                Are you sure?
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                This action cannot be undone.
              </p>
            </div>
          </div>

          {!loading && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Warning */}
        <div className="px-5 py-5 sm:px-6">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-4">
            <p className="text-sm leading-6 text-foreground">
              The following Life OS data will be permanently
              deleted:
            </p>

            {/* Selected modules */}
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedItems.map((item) => (
                <span
                  key={item.id}
                  className="rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400"
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {/* Account safety */}
          <div className="mt-4 rounded-2xl border bg-muted/30 p-4">
            <p className="text-xs leading-5 text-muted-foreground">
              <span className="font-semibold text-foreground">
                Your account is safe.
              </span>{" "}
              Your email, password, Firebase authentication,
              and account itself will not be deleted.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t bg-muted/20 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border bg-background px-4 py-3 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || modules.length === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                Reset Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}