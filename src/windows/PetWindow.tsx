import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow, PhysicalPosition } from "@tauri-apps/api/window";
import ChatOverlay from "../components/ChatOverlay";
import ContextMenu from "../components/ContextMenu";
import SpeechBubble from "../components/SpeechBubble";
import ReminderToast from "../components/ReminderToast";
import PetCanvas from "../components/PetCanvas";
import BugDropZone from "../components/BugDropZone";
import { useKeyboardActivity } from "../hooks/useKeyboardActivity";
import { useAutoHide } from "../hooks/useAutoHide";
import { useTheme } from "../hooks/useTheme";
import { usePetStore } from "../stores/petStore";
import { normalizeSettings } from "../utils/normalizeSettings";

const COLLAPSED_W = 200;
const COLLAPSED_H = 280;
const EXPANDED_W = 480;
const EXPANDED_H = 680;

function PetWindow() {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [avatarActive, setAvatarActive] = useState(false);
  const chatOpen = usePetStore((s) => s.chatOpen);
  const toggleChat = usePetStore((s) => s.toggleChat);

  const avatarRef = useRef<HTMLDivElement>(null);

  useKeyboardActivity();
  useAutoHide();
  useTheme();

  // Set body class for pet window transparent styling
  useEffect(() => {
    document.body.classList.add("pet-window-body");
    return () => {
      document.body.classList.remove("pet-window-body");
    };
  }, []);

  // Initial window positioning to bottom-right
  useEffect(() => {
    try {
      const win = getCurrentWindow();
      const screenW = window.screen.availWidth;
      const screenH = window.screen.availHeight;
      const x = screenW - COLLAPSED_W - 24;
      const y = screenH - COLLAPSED_H - 48;
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

  // Window resize on chat open/close
  useEffect(() => {
    try {
      const win = getCurrentWindow();
      const screenW = window.screen.availWidth;
      const screenH = window.screen.availHeight;
      const targetW = chatOpen ? EXPANDED_W : COLLAPSED_W;
      const targetH = chatOpen ? EXPANDED_H : COLLAPSED_H;
      // Reposition so the bottom-right corner stays anchored
      const x = screenW - targetW - 24;
      const y = screenH - targetH - 48;
      // Use LogicalSize for setSize - cast to avoid TS issue
      const LogicalSize = (window as any).__TAURI__?.window?.LogicalSize;
      if (LogicalSize) {
        win.setSize(new LogicalSize(targetW, targetH));
      }
      win.setPosition(new PhysicalPosition(x, y));
    } catch {
      // ignore — setSize may not be available in non-Tauri env
    }
  }, [chatOpen]);

  // Dynamic cursor ignore: when chat is closed, make window transparent to clicks
  useEffect(() => {
    if (!chatOpen) {
      invoke("set_window_ignore_cursor_events", { ignore: true }).catch(() => {});
    } else {
      invoke("set_window_ignore_cursor_events", { ignore: false }).catch(() => {});
    }
  }, [chatOpen]);

  // Avatar mousedown: distinguish click from drag
  const handleAvatarMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    let startedDrag = false;

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!startedDrag && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        startedDrag = true;
        window.removeEventListener("mousemove", handleMouseMove);
        getCurrentWindow().startDragging();
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (!startedDrag) {
        setAvatarActive(true);
        setTimeout(() => setAvatarActive(false), 450);
        if (!chatOpen) {
          toggleChat();
        }
        setShowMenu(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }, [chatOpen, toggleChat]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleBgClick = () => {
    setShowMenu(false);
  };

  const hasMessages = usePetStore((s) => s.bubbleVisible);

  const handleChatClose = useCallback(() => {
    toggleChat();
  }, [toggleChat]);

  return (
    <div className="app" onContextMenu={handleContextMenu}>
      <div className="app-bg-hitarea" onClick={handleBgClick} />

      <div
        ref={avatarRef}
        className={`pet-canvas-wrapper${avatarActive ? " active" : ""}${hasMessages ? " has-message" : ""}`}
        onMouseDown={handleAvatarMouseDown}
        onContextMenu={handleContextMenu}
        title="点击打开对话，拖动可移动位置"
      >
        <PetCanvas />
      </div>

      <BugDropZone />

      {chatOpen && <ChatOverlay onClose={handleChatClose} />}

      {showMenu && (
        <ContextMenu
          x={menuPos.x}
          y={menuPos.y}
          onClose={() => setShowMenu(false)}
          onChat={() => { toggleChat(); setShowMenu(false); }}
          onSettings={() => { invoke("open_window", { label: "settings" }).catch((e) => { console.error("open settings window:", e); usePetStore.getState().showBubble("设置窗口打开失败: " + e, 3000); }); setShowMenu(false); }}
          onQuit={() => { setShowMenu(false); invoke("quit_app").catch((e) => { console.error("quit failed:", e); usePetStore.getState().showBubble("退出失败: " + e, 3000); }); }}
        />
      )}

      <SpeechBubble />
      <ReminderToast />
    </div>
  );
}

export default PetWindow;
