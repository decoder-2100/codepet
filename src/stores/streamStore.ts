import { useChatStore } from "./chatStore";
import { usePetStore } from "./petStore";

type StreamType = "chat" | "roast" | "compliment" | "joke" | null;

interface StreamHandlers {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

let activeStream: StreamType = null;
let handlers: StreamHandlers | null = null;

export const streamRegistry = {
  register(type: Exclude<StreamType, null>, h: StreamHandlers) {
    activeStream = type;
    handlers = h;
  },

  clear() {
    activeStream = null;
    handlers = null;
  },

  getActive(): StreamType {
    return activeStream;
  },

  emitToken(token: string) {
    if (handlers) handlers.onToken(token);
  },

  emitDone() {
    if (handlers) handlers.onDone();
  },

  emitError(error: string) {
    if (handlers) handlers.onError(error);
  },
};
