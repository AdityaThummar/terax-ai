import { create } from "zustand";

export type PinnedCommand = { id: string; text: string };

const STORAGE_KEY = "terax-pinned-commands";

function load(): PinnedCommand[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PinnedCommand[]) : [];
  } catch {
    return [];
  }
}

function save(commands: PinnedCommand[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(commands));
  } catch {
    /* ignore */
  }
}

let nextId = 1;

function uid(): string {
  return String(Date.now().toString(36) + (nextId++).toString(36));
}

type Store = {
  commands: PinnedCommand[];
  addCommand: (text: string) => void;
  editCommand: (id: string, text: string) => void;
  deleteCommand: (id: string) => void;
};

export const usePinnedCommandsStore = create<Store>((set) => ({
  commands: load(),

  addCommand: (text) =>
    set((prev) => {
      const next = [...prev.commands, { id: uid(), text }];
      save(next);
      return { commands: next };
    }),

  editCommand: (id, text) =>
    set((prev) => {
      const next = prev.commands.map((c) =>
        c.id === id ? { ...c, text } : c,
      );
      save(next);
      return { commands: next };
    }),

  deleteCommand: (id) =>
    set((prev) => {
      const next = prev.commands.filter((c) => c.id !== id);
      save(next);
      return { commands: next };
    }),
}));
