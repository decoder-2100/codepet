import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow, PhysicalPosition } from "@tauri-apps/api/window";
import ContextMenu from "../components/ContextMenu";
import SpeechBubble from "../components/SpeechBubble";
import ReminderToast from "../components/ReminderToast";
import ZhurongAvatar from "../components/ZhurongAvatar";
import { useKeyboardActivity } from "../hooks/useKeyboardActivity";
import { useAutoHide } from "../hooks/useAutoHide";
import { useTheme } from "../hooks/useTheme";
import { usePetStore } from "../stores/petStore";
import { usePetAnimator } from "../hooks/usePetAnimator";
import { normalizeSettings } from "../utils/normalizeSettings";

function PetWindow() {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [avatarActive, setAvatarActive] = useState(false);

  const avatarRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    clicked: boolean;
  }>({ dragging: false, startX: 0, startY: 0, clicked: false });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useKeyboardActivity();
  usePetAnimator(canvasRef);
  useAutoHide();
  useTheme();

  // Initial window positioning to bottom-right
  useEffect(() => {
    try {
      const win = getCurrentWindow();
      const screenW = window.screen.availWidth;
      const screenH = window.screen.availHeight;
      const winW = 200;
      const winH = 280;
      const x = screenW - winW - 24;
      const y = screenH - winH - 48;
      win.setPosition(new PhysicalPosition(x, y));
    } catch {
      // ignore
    }
  }, []);

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

  // Listen for "open-settings" from tray menu
  useEffect(() => {
    const unlisten = listen("open-settings", () => {
      invoke("open_window", { label: "settings" }).catch(() => {});
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  // Listen for settings-updated events to refresh config
  useEffect(() => {
    const unlisten = listen("settings-updated", async () => {
      try {
        const s: any = await invoke("get_settings");
        const normalized = normalizeSettings(s);
        usePetStore.getState().setPetConfig(normalized.petConfig);
        usePetStore.getState().setSettings(normalized);
      } catch {
        // ignore
      }
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  // Avatar mousedown: distinguish click from drag
  const handleAvatarMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    dragState.current = {
      dragging: false,
      startX: e.clientX,
      startY: e.clientY,
      clicked: true,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragState.current.startX;
      const dy = ev.clientY - dragState.current.startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        dragState.current.dragging = true;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        getCurrentWindow().startDragging();
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (!dragState.current.dragging) {
        setAvatarActive(true);
        setTimeout(() => setAvatarActive(false), 450);
        invoke("open_window", { label: "chat" }).catch(() => {});
        setShowMenu(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleBgClick = () => {
    setShowMenu(false);
  };

  const hasMessages = usePetStore((s) => s.bubbleVisible);

  return (
    <div className="app" onContextMenu={handleContextMenu}>
      <div className="app-bg-hitarea" onClick={handleBgClick} />

      <div
        ref={avatarRef}
        className={`pet-avatar-wrapper${avatarActive ? " active" : ""}${hasMessages ? " has-message" : ""}`}
        onMouseDown={handleAvatarMouseDown}
        onContextMenu={handleContextMenu}
        title="点击打开对话，拖动可移动位置"
      >
        <ZhurongAvatar avatarActive={avatarActive} />
      </div>

      {showMenu && (
        <ContextMenu
          x={menuPos.x}
          y={menuPos.y}
          onClose={() => setShowMenu(false)}
          onChat={() => { invoke("open_window", { label: "chat" }).catch(() => {}); setShowMenu(false); }}
          onSettings={() => { invoke("open_window", { label: "settings" }).catch(() => {}); setShowMenu(false); }}
        />
      )}

      <SpeechBubble />
      <ReminderToast />
    </div>
  );
}

export default PetWindow;
