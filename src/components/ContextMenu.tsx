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

const ContextMenu = ({ x, y, onClose, onChat, onSettings, onQuit }: Props) => {
  const [_complimenting, setComplimenting] = useState(complimenting);
  const [_roasting, setRoasting] = useState(roasting);

  const handleCompliment = useCallback(() => {
    if (complimenting) return;
    complimenting = true;
    setComplimenting(true);
    Sound.click();
    usePetStore.getState().setAnim("happy");
    usePetStore.getState().showBubble("⏳ 在想一个真诚的夸奖...", 0, "compliment-burst");

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
          store.showBubble(store.bubbleText, 6000, "compliment-burst");
        }
        streamRegistry.clear();
        complimenting = false;
        setComplimenting(false);
      },
      onError: () => {
        streamRegistry.clear();
        const fallback = getRandomCompliment();
        usePetStore.getState().showBubble(fallback, 5000, "compliment-burst");
        complimenting = false;
        setComplimenting(false);
      },
    });

    // Close menu after callbacks are registered
    onClose();

    // Fire the stream (non-streaming fallback uses static content)
    invoke("llm_chat_stream", {
      prompt: "请用1-2句话真诚夸奖主人，让人看了很开心。从以下维度中选1-2个来夸，每次选不同的维度：\n\n- **颜值**：外貌好看、五官精致、笑起来迷人、眼睛有星星\n- **性格**：温柔善良、乐观开朗、坚韧勇敢、有耐心\n- **技术**：代码能力强、逻辑清晰、架构思维好、debug厉害\n- **气质**：优雅从容、有品味、有内涵、格局大\n- **修养**：有礼貌、有教养、情绪稳定、懂得尊重人\n- **综合**：聪明又努力、才华与颜值并存、闪闪发光\n\n要求：语气要像一只真心喜欢主人的小宠物，温暖真诚、不油腻、不敷衍。可以带点小俏皮。",
      scenario: "compliment",
      history: [],
    }).catch(() => {
      streamRegistry.clear();
      const fallback = getRandomCompliment();
      usePetStore.getState().showBubble(fallback, 5000, "compliment-burst");
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
    usePetStore.getState().showBubble("⏳ 在想一个新鲜的吐槽...", 0, "roast-burst");

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
          store.showBubble(store.bubbleText, 6000, "roast-burst");
        }
        streamRegistry.clear();
        roasting = false;
        setRoasting(false);
      },
      onError: () => {
        streamRegistry.clear();
        const fallback = getRandomRoast();
        usePetStore.getState().showBubble(fallback, 5000, "roast-burst");
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
      usePetStore.getState().showBubble(fallback, 5000, "roast-burst");
      roasting = false;
      setRoasting(false);
    });
  }, [onClose]);

  const items = [
    { label: "💬 聊一聊 Chat", action: onChat },
    { label: "👍 夸一夸 Compliment", action: handleCompliment },
    { label: "😂 吐个槽 Roast", action: handleRoast },
    { label: "⚙️ 设置 Settings", action: onSettings },
    { label: "🚪 退出 Quit", action: onQuit },
  ];

  const menuWidth = 175;
  const menuHeight = 170;
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
        const disabled = (isRoast && _roasting) || (isCompliment && _complimenting);
        const loadingText = isRoast ? "⏳ 吐槽中..." : isCompliment ? "⏳ 夸奖中..." : undefined;
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
