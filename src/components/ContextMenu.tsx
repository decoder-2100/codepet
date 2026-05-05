import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Sound } from "../utils/sound";
import { usePetStore } from "../stores/petStore";
import { getRandomRoast, getRandomCompliment } from "../canvas/ascii";

interface Props {
  x: number;
  y: number;
  onClose: () => void;
  onChat: () => void;
  onSettings: () => void;
}

const ContextMenu = ({ x, y, onClose, onChat, onSettings }: Props) => {
  const [roasting, setRoasting] = useState(false);
  const [complimenting, setComplimenting] = useState(false);

  const handleCompliment = async () => {
    if (complimenting) return;
    setComplimenting(true);
    Sound.click();
    usePetStore.getState().setAnim("happy");
    usePetStore.getState().showBubble("⏳ 在想一个真诚的夸奖...", 0, "compliment-burst");
    onClose();

    try {
      const compliment = await invoke("random_compliment") as string;
      usePetStore.getState().showBubble(compliment, 6000, "compliment-burst");
    } catch {
      const fallback = getRandomCompliment();
      usePetStore.getState().showBubble(fallback, 5000, "compliment-burst");
    } finally {
      setComplimenting(false);
    }
  };

  const handleRoast = async () => {
    if (roasting) return;
    setRoasting(true);
    Sound.click();
    usePetStore.getState().setAnim("happy");
    usePetStore.getState().showBubble("⏳ 在想一个新鲜的吐槽...", 0, "roast-burst");
    onClose();

    try {
      const roast = await invoke("random_roast") as string;
      usePetStore.getState().showBubble(roast, 6000, "roast-burst");
    } catch {
      const fallback = getRandomRoast();
      usePetStore.getState().showBubble(fallback, 5000, "roast-burst");
    } finally {
      setRoasting(false);
    }
  };

  const items = [
    { label: "💬 聊一聊 Chat", action: onChat },
    { label: "👍 夸一夸 Compliment", action: handleCompliment },
    { label: "😂 吐个槽 Roast", action: handleRoast },
    { label: "⚙️ 设置 Settings", action: onSettings },
  ];

  const menuWidth = 175;
  const menuHeight = 135;
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
        const disabled = (isRoast && roasting) || (isCompliment && complimenting);
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
