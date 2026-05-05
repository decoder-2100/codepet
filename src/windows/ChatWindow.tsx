import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import ChatPanel from "../components/ChatPanel";
import { useLLMStream } from "../hooks/useLLMStream";
import { usePetStore } from "../stores/petStore";
import { normalizeSettings } from "../utils/normalizeSettings";

function ChatWindow() {
  useLLMStream();

  // Load settings on mount
  useEffect(() => {
    invoke("get_settings")
      .then((s: any) => {
        const normalized = normalizeSettings(s);
        usePetStore.getState().setSettings(normalized);
        usePetStore.getState().setPetConfig(normalized.petConfig);
      })
      .catch(() => {});
  }, []);

  // Listen for settings-updated events
  useEffect(() => {
    const unlisten = listen("settings-updated", async () => {
      try {
        const s: any = await invoke("get_settings");
        const normalized = normalizeSettings(s);
        usePetStore.getState().setSettings(normalized);
      } catch {
        // ignore
      }
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return <ChatPanel />;
}

export default ChatWindow;
