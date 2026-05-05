import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { ChatMessage } from "../types";

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface ChatStore {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentBuffer: string;
  sessions: ChatSession[];
  activeSessionId: string | null;
  showHistory: boolean;
  showSkills: boolean;

  addMessage: (msg: ChatMessage) => void;
  appendToken: (token: string) => void;
  flushBuffer: () => void;
  setStreaming: (v: boolean) => void;
  clear: () => void;
  setShowHistory: (v: boolean) => void;
  setShowSkills: (v: boolean) => void;
  saveCurrentSession: () => void;
  loadSession: (id: string) => void;
  newSession: () => void;
  deleteSession: (id: string) => void;
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function extractTitle(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "新对话";
  const text = first.content.slice(0, 30);
  return text.length < first.content.length ? text + "..." : text;
}

const STORAGE_KEY = "coderpet_sessions";

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Load sessions from backend (filesystem) — survives window destroy/relaunch.
 * Call this after store initialization to merge backend data into localStorage.
 */
async function syncFromBackend(): Promise<ChatSession[]> {
  try {
    const json = await invoke<string>("load_chat_sessions");
    const backend: ChatSession[] = JSON.parse(json);
    if (backend.length > 0) {
      // Merge: backend sessions take priority (more durable), fill localStorage
      const local = loadSessions();
      const merged = new Map<string, ChatSession>();
      for (const s of local) merged.set(s.id, s);
      for (const s of backend) {
        const existing = merged.get(s.id);
        if (!existing || s.updatedAt >= existing.updatedAt) {
          merged.set(s.id, s);
        }
      }
      const result = Array.from(merged.values()).sort((a, b) => b.updatedAt - a.updatedAt);
      // Sync localStorage with merged data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      return result;
    }
    return loadSessions();
  } catch {
    return loadSessions();
  }
}

function persistSessions(sessions: ChatSession[]) {
  try {
    const json = JSON.stringify(sessions);
    localStorage.setItem(STORAGE_KEY, json);
    // Fire-and-forget: also persist to backend for cross-webview durability
    invoke("save_chat_sessions", { sessionsJson: json }).catch(() => {});
  } catch {
    // localStorage full or unavailable
  }
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isStreaming: false,
  currentBuffer: "",
  sessions: loadSessions(),
  activeSessionId: null,
  showHistory: false,
  showSkills: false,

  // ... rest stays the same
}));

// On module init, sync sessions from backend (filesystem) — catches
// sessions created in other webviews or previous window sessions.
syncFromBackend().then((sessions) => {
  useChatStore.setState({ sessions });
});
  messages: [],
  isStreaming: false,
  currentBuffer: "",
  sessions: loadSessions(),
  activeSessionId: null,
  showHistory: false,
  showSkills: false,

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  appendToken: (token) => set((s) => ({ currentBuffer: s.currentBuffer + token })),

  flushBuffer: () => {
    const { currentBuffer } = get();
    if (!currentBuffer) return;
    set((s) => ({
      messages: [...s.messages, { role: "pet", content: currentBuffer }],
      currentBuffer: "",
    }));
  },

  setStreaming: (isStreaming) => {
    if (!isStreaming) {
      get().flushBuffer();
    }
    set({ isStreaming });
  },

  clear: () => {
    get().saveCurrentSession();
    set({ messages: [], currentBuffer: "", activeSessionId: null });
  },

  setShowHistory: (showHistory) => set({ showHistory }),
  setShowSkills: (showSkills) => set({ showSkills }),

  saveCurrentSession: () => {
    const { messages, sessions, activeSessionId } = get();
    if (messages.length === 0) return;
    const now = Date.now();
    const id = activeSessionId || genId();
    const existing = sessions.find((s) => s.id === id);
    const session: ChatSession = {
      id,
      title: existing?.title || extractTitle(messages),
      messages,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    const updated = existing
      ? sessions.map((s) => (s.id === id ? session : s))
      : [session, ...sessions];
    set({ sessions: updated, activeSessionId: id });
    persistSessions(updated);
  },

  loadSession: (id) => {
    const session = get().sessions.find((s) => s.id === id);
    if (!session) return;
    set({
      messages: [...session.messages],
      currentBuffer: "",
      activeSessionId: id,
      showHistory: false,
    });
  },

  newSession: () => {
    get().saveCurrentSession();
    set({ messages: [], currentBuffer: "", activeSessionId: null, showHistory: false });
  },

  deleteSession: (id) => {
    const { sessions, activeSessionId } = get();
    const updated = sessions.filter((s) => s.id !== id);
    set({
      sessions: updated,
      activeSessionId: activeSessionId === id ? null : activeSessionId,
    });
    persistSessions(updated);
  },
}));
