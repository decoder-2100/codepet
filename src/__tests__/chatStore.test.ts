import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "../stores/chatStore";

describe("chatStore", () => {
  beforeEach(() => {
    useChatStore.setState({
      messages: [],
      isStreaming: false,
      currentBuffer: "",
    });
  });

  describe("F3.4: Chat messages", () => {
    it("should start with empty messages", () => {
      expect(useChatStore.getState().messages).toHaveLength(0);
    });

    it("should add user messages", () => {
      useChatStore.getState().addMessage({ role: "user", content: "Hello!" });
      expect(useChatStore.getState().messages).toHaveLength(1);
      expect(useChatStore.getState().messages[0]).toEqual({ role: "user", content: "Hello!" });
    });

    it("should add pet messages", () => {
      useChatStore.getState().addMessage({ role: "pet", content: "Hi there!" });
      expect(useChatStore.getState().messages[0]).toEqual({ role: "pet", content: "Hi there!" });
    });

    it("should append multiple messages in order", () => {
      useChatStore.getState().addMessage({ role: "user", content: "msg1" });
      useChatStore.getState().addMessage({ role: "pet", content: "reply1" });
      useChatStore.getState().addMessage({ role: "user", content: "msg2" });

      expect(useChatStore.getState().messages).toHaveLength(3);
      expect(useChatStore.getState().messages[0].content).toBe("msg1");
      expect(useChatStore.getState().messages[1].content).toBe("reply1");
      expect(useChatStore.getState().messages[2].content).toBe("msg2");
    });
  });

  describe("F3.2: Streaming buffer", () => {
    it("should start with empty buffer", () => {
      expect(useChatStore.getState().currentBuffer).toBe("");
      expect(useChatStore.getState().isStreaming).toBe(false);
    });

    it("should append tokens to buffer", () => {
      useChatStore.getState().appendToken("Hello");
      expect(useChatStore.getState().currentBuffer).toBe("Hello");

      useChatStore.getState().appendToken(" World");
      expect(useChatStore.getState().currentBuffer).toBe("Hello World");
    });

    it("should flush buffer to messages", () => {
      useChatStore.getState().appendToken("Testing");
      useChatStore.getState().appendToken(" flush");
      useChatStore.getState().flushBuffer();

      expect(useChatStore.getState().messages).toHaveLength(1);
      expect(useChatStore.getState().messages[0]).toEqual({ role: "pet", content: "Testing flush" });
      expect(useChatStore.getState().currentBuffer).toBe("");
    });

    it("should not flush empty buffer", () => {
      useChatStore.getState().flushBuffer();
      expect(useChatStore.getState().messages).toHaveLength(0);
    });

    it("should flush when setting streaming to false", () => {
      useChatStore.getState().appendToken("Final message");
      useChatStore.getState().setStreaming(false);

      expect(useChatStore.getState().messages).toHaveLength(1);
      expect(useChatStore.getState().isStreaming).toBe(false);
    });

    it("should set streaming state", () => {
      useChatStore.getState().setStreaming(true);
      expect(useChatStore.getState().isStreaming).toBe(true);
    });
  });

  describe("F3.4: Clearing chat", () => {
    it("should clear all messages and buffer", () => {
      useChatStore.getState().addMessage({ role: "user", content: "test" });
      useChatStore.getState().appendToken("partial");
      useChatStore.getState().clear();

      expect(useChatStore.getState().messages).toHaveLength(0);
      expect(useChatStore.getState().currentBuffer).toBe("");
    });
  });
});
