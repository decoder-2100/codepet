import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useChatStore } from "../stores/chatStore";
import { usePetStore } from "../stores/petStore";

export function useLLMStream() {
  useEffect(() => {
    const unlistenToken = listen<string>("llm-token", (event) => {
      useChatStore.getState().appendToken(event.payload);
    });

    const unlistenDone = listen("llm-done", () => {
      useChatStore.getState().flushBuffer();
      useChatStore.getState().setStreaming(false);
      usePetStore.getState().setPose("idle");
      usePetStore.getState().setAnim("idle");
    });

    const unlistenError = listen<string>("llm-error", (event) => {
      useChatStore.getState().flushBuffer();
      useChatStore.getState().setStreaming(false);
      useChatStore.getState().addMessage({
        role: "pet",
        content: `呃，AI 出了点问题：${event.payload}`,
      });
      usePetStore.getState().setPose("idle");
      usePetStore.getState().setAnim("idle");
    });

    return () => {
      unlistenToken.then((f) => f());
      unlistenDone.then((f) => f());
      unlistenError.then((f) => f());
    };
  }, []);
}
