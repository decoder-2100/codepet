import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Sound } from "../utils/sound";
import { usePetStore } from "../stores/petStore";
import { streamRegistry } from "../stores/streamStore";
import { getRandomRoast, getRandomCompliment } from "../canvas/ascii";

interface Props {
  x: number;
  y: number;
  onClose: () => void;
  onChat: () => void;
  onSettings: () => void;
  onQuit: () => void;
}

// Module-level guards so concurrent requests are blocked across menu reopens
let complimenting = false;
let roasting = false;
let tellingJoke = false;

const ContextMenu = ({ x, y, onClose, onChat, onSettings, onQuit }: Props) => {
  const [_complimenting, setComplimenting] = useState(complimenting);
  const [_roasting, setRoasting] = useState(roasting);
  const [_tellingJoke, setTellingJoke] = useState(tellingJoke);

  const handleCompliment = useCallback(() => {
    if (complimenting) return;
    complimenting = true;
    setComplimenting(true);
    Sound.click();
    usePetStore.getState().setAnim("happy");
    usePetStore.getState().showBubble("⏳ 在想一个真诚的夸奖...", 0);

    // Register stream callbacks BEFORE closing menu so the registry is ready
    streamRegistry.register("compliment", {
      onToken: (token) => {
        const store = usePetStore.getState();
        const current = store.bubbleText || "";
        if (current.startsWith("⏳")) {
          store.showBubble(token, 0);
        } else {
          store.showBubble(current + token, 0);
        }
      },
      onDone: () => {
        const store = usePetStore.getState();
        if (store.bubbleText) {
          store.showBubble(store.bubbleText, 6000);
        }
        streamRegistry.clear();
        complimenting = false;
        setComplimenting(false);
      },
      onError: () => {
        streamRegistry.clear();
        const fallback = getRandomCompliment();
        usePetStore.getState().showBubble(fallback, 5000);
        complimenting = false;
        setComplimenting(false);
      },
    });

    // Close menu after callbacks are registered
    onClose();

    // Fire the stream (non-streaming fallback uses static content)
    invoke("llm_chat_stream", {
      prompt: "请用10个字以内直白地夸奖主人，内容围绕：颜值高、技术精湛、工作态度好，多说彩虹屁。语气像真心喜欢主人的小宠物，温暖真诚。",
      scenario: "compliment",
      history: [],
    }).catch(() => {
      streamRegistry.clear();
      const fallback = getRandomCompliment();
      usePetStore.getState().showBubble(fallback, 5000);
      complimenting = false;
      setComplimenting(false);
    });
  }, [onClose]);

  const handleRoast = useCallback(() => {
    if (roasting) return;
    roasting = true;
    setRoasting(true);
    Sound.click();
    usePetStore.getState().setAnim("happy");
    usePetStore.getState().showBubble("⏳ 在想一个新鲜的吐槽...", 0);

    // Register stream callbacks BEFORE closing menu
    streamRegistry.register("roast", {
      onToken: (token) => {
        const store = usePetStore.getState();
        const current = store.bubbleText || "";
        if (current.startsWith("⏳")) {
          store.showBubble(token, 0);
        } else {
          store.showBubble(current + token, 0);
        }
      },
      onDone: () => {
        const store = usePetStore.getState();
        if (store.bubbleText) {
          store.showBubble(store.bubbleText, 6000);
        }
        streamRegistry.clear();
        roasting = false;
        setRoasting(false);
      },
      onError: () => {
        streamRegistry.clear();
        const fallback = getRandomRoast();
        usePetStore.getState().showBubble(fallback, 5000);
        roasting = false;
        setRoasting(false);
      },
    });

    // Close menu after callbacks are registered
    onClose();

    // Fire the stream (non-streaming fallback uses static content)
    invoke("llm_chat_stream", {
      prompt: "请吐槽一句程序员最懂的梗，主题：主管定需求、排进度、工具难用、开发方案挫、架构设计烂、项目/测试计划太激进等。20字以内，犀利吐槽。",
      scenario: "roast",
      history: [],
    }).catch(() => {
      streamRegistry.clear();
      const fallback = getRandomRoast();
      usePetStore.getState().showBubble(fallback, 5000);
      roasting = false;
      setRoasting(false);
    });
  }, [onClose]);

  const handleJoke = useCallback(() => {
    if (tellingJoke) return;
    tellingJoke = true;
    setTellingJoke(true);
    Sound.click();
    usePetStore.getState().setAnim("happy");
    usePetStore.getState().showBubble("⏳ 在想一个好笑的梗...", 0);

    streamRegistry.register("joke", {
      onToken: (token) => {
        const store = usePetStore.getState();
        const current = store.bubbleText || "";
        if (current.startsWith("⏳")) {
          store.showBubble(token, 0);
        } else {
          store.showBubble(current + token, 0);
        }
      },
      onDone: () => {
        const store = usePetStore.getState();
        if (store.bubbleText) {
          store.showBubble(store.bubbleText, 5000);
        }
        streamRegistry.clear();
        tellingJoke = false;
        setTellingJoke(false);
      },
      onError: () => {
        streamRegistry.clear();
        usePetStore.getState().showBubble("我的代码能跑，别碰它。", 5000);
        tellingJoke = false;
        setTellingJoke(false);
      },
    });

    onClose();

    invoke("llm_chat_stream", {
      prompt: "请讲一个10字以内的程序员幽默梗，要搞笑、有趣、接地气。",
      scenario: "joke",
      history: [],
    }).catch(() => {
      streamRegistry.clear();
      usePetStore.getState().showBubble("我的代码能跑，别碰它。", 5000);
      tellingJoke = false;
      setTellingJoke(false);
    });
  }, [onClose]);

  const items = [
    { label: "💬 聊一聊 Chat", action: onChat },
    { label: "👍 夸一夸 Compliment", action: handleCompliment },
    { label: "😂 吐个槽 Roast", action: handleRoast },
    { label: "🤣 讲个梗 Joke", action: handleJoke },
    { label: "⚙️ 设置 Settings", action: onSettings },
    { label: "🚪 退出 Quit", action: onQuit },
  ];

  const menuWidth = 175;
  const menuHeight = 200;
  const clampedX = Math.min(x, window.innerWidth - menuWidth);
  const clampedY = Math.min(y, window.innerHeight - menuHeight);

  return (
    <div
      className="context-menu"
      style={{ position: "fixed", top: Math.max(0, clampedY), left: Math.max(0, clampedX), zIndex: 10000 }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item) => {
        const isRoast = item.label.includes("吐个槽");
        const isCompliment = item.label.includes("夸一夸");
        const isJoke = item.label.includes("讲个梗");
        const disabled = (isRoast && _roasting) || (isCompliment && _complimenting) || (isJoke && _tellingJoke);
        const loadingText = isRoast ? "⏳ 吐槽中..." : isCompliment ? "⏳ 夸奖中..." : isJoke ? "⏳ 想梗中..." : undefined;
        return (
          <button
            key={item.label}
            className={`menu-item${disabled ? " disabled" : ""}`}
            onClick={item.action}
            disabled={disabled}
          >
            {disabled ? loadingText : item.label}
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;
