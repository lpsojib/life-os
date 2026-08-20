import type { FocusItem } from "../types/focus.types";

const STORAGE_KEY = "life-os-focus-items";

export function loadFocusItems(): FocusItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as FocusItem[];
  } catch (error) {
    console.error("Failed to load focus items:", error);
    return [];
  }
}

export function saveFocusItems(items: FocusItem[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items)
    );
  } catch (error) {
    console.error("Failed to save focus items:", error);
  }
}

export function createFocusItem(
  title: string
): FocusItem {
  const now = new Date().getTime();

  return {
    id: `${now}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    title,
    startedAt: null,
    elapsed: 0,
    running: false,
    createdAt: now,
  };
}

export function getElapsedTime(
  item: FocusItem
): number {
  if (!item.running || item.startedAt === null) {
    return item.elapsed;
  }

  return (
    item.elapsed +
    (new Date().getTime() - item.startedAt)
  );
}

export function startFocus(
  item: FocusItem
): FocusItem {
  if (item.running) {
    return item;
  }

  return {
    ...item,
    running: true,
    startedAt: new Date().getTime(),
  };
}

export function pauseFocus(
  item: FocusItem
): FocusItem {
  if (!item.running || item.startedAt === null) {
    return item;
  }

  const now = new Date().getTime();

  const additionalTime =
    now - item.startedAt;

  return {
    ...item,
    running: false,
    startedAt: null,
    elapsed:
      item.elapsed + additionalTime,
  };
}

export function resetFocus(
  item: FocusItem
): FocusItem {
  return {
    ...item,
    running: false,
    startedAt: null,
    elapsed: 0,
  };
}