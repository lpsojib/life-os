"use client";

import {
  ChevronRight,
  Settings as SettingsIcon,
} from "lucide-react";
import { useState } from "react";

import ResetDataModal from "./components/ResetDataModal";
import ResetConfirmModal from "./components/ResetConfirmModal";

import {
  resetSelectedData,
} from "./services/reset.service";

import {
  ResetModule,
} from "./types/settings.types";

export default function SettingsPage() {
  const [showResetModal, setShowResetModal] =
    useState(false);

  const [showConfirmModal, setShowConfirmModal] =
    useState(false);

  const [selectedModules, setSelectedModules] =
    useState<ResetModule[]>([]);

  const [resetting, setResetting] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  /* ======================================================
     OPEN RESET MODAL
  ====================================================== */

  function handleOpenReset() {
    setSuccessMessage("");
    setErrorMessage("");
    setShowResetModal(true);
  }

  /* ======================================================
     CLOSE RESET MODAL
  ====================================================== */

  function handleCloseReset() {
    if (resetting) {
      return;
    }

    setShowResetModal(false);
  }

  /* ======================================================
     CONTINUE TO CONFIRMATION
  ====================================================== */

  function handleContinue(
    modules: ResetModule[],
  ) {
    if (!modules.length) {
      return;
    }

    setSelectedModules(modules);
    setShowResetModal(false);
    setShowConfirmModal(true);
  }

  /* ======================================================
     CANCEL CONFIRMATION
  ====================================================== */

  function handleCancelConfirmation() {
    if (resetting) {
      return;
    }

    setShowConfirmModal(false);
    setShowResetModal(true);
  }

  /* ======================================================
     ACTUAL RESET
  ====================================================== */

  async function handleConfirmReset() {
    if (!selectedModules.length) {
      return;
    }

    try {
      setResetting(true);
      setErrorMessage("");
      setSuccessMessage("");

      await resetSelectedData(
        selectedModules,
      );

      setShowConfirmModal(false);

      setSuccessMessage(
        `${selectedModules.length} ${
          selectedModules.length === 1
            ? "section"
            : "sections"
        } reset successfully.`,
      );

      setSelectedModules([]);
    } catch (error) {
      console.error(
        "Life OS reset failed:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while resetting data.";

      setErrorMessage(message);
    } finally {
      setResetting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <SettingsIcon className="h-5 w-5 text-primary" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Settings
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Personalize and manage your Life OS
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            SUCCESS MESSAGE
        ================================================== */}

        {successMessage && (
          <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/[0.06] px-4 py-3">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              ✓ {successMessage}
            </p>
          </div>
        )}

        {/* ==================================================
            ERROR MESSAGE
        ================================================== */}

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* ==================================================
              APPEARANCE
          ================================================== */}

          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-semibold">
                Appearance
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Customize how Life OS looks and feels.
              </p>
            </div>

            <div className="divide-y rounded-xl border">
              <button
                type="button"
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-muted/50"
              >
                <div>
                  <p className="text-sm font-medium">
                    Theme
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose your preferred theme
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-between p-4 text-left transition hover:bg-muted/50"
              >
                <div>
                  <p className="text-sm font-medium">
                    Language
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose your interface language
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </section>

          {/* ==================================================
              ACCOUNT
          ================================================== */}

          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-semibold">
                Account
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage your Life OS account.
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm font-medium">
                Account data
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Your account and login information will
                not be affected by data reset.
              </p>
            </div>
          </section>

          {/* ==================================================
              DANGER ZONE
          ================================================== */}

          <section className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-red-600 dark:text-red-400">
                Danger Zone
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Reset selected Life OS data.
                Your account and login will remain safe.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenReset}
              className="flex w-full items-center justify-between rounded-xl border border-red-500/30 bg-background px-4 py-4 text-left transition hover:border-red-500/50 hover:bg-red-500/[0.04]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                  <span className="text-lg">
                    ↻
                  </span>
                </div>

                <div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Reset Life OS
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose which data you want to reset
                  </p>
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </section>
        </div>
      </div>

      {/* ====================================================
          SELECT DATA MODAL
      ==================================================== */}

      <ResetDataModal
        open={showResetModal}
        onClose={handleCloseReset}
        onContinue={handleContinue}
      />

      {/* ====================================================
          FINAL CONFIRMATION MODAL
      ==================================================== */}

      <ResetConfirmModal
        open={showConfirmModal}
        modules={selectedModules}
        loading={resetting}
        onCancel={handleCancelConfirmation}
        onConfirm={handleConfirmReset}
      />
    </main>
  );
}