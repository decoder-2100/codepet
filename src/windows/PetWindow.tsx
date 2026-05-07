import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
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

  // NOTE: Window positioning is handled by Rust side (position_bottom_right in window_manage.rs).
  // Do NOT set position from React — window.screen.availWidth/Height are unreliable in WebView context.

  // Load settings on mount
  useEffect(() => {
    invoke("get_settings")
      .then((s: any) => {
        const normalized = normalizeSettings(s);
        usePetStore.getState().setSettings(normalized);
        usePetStore.getState().setPetConfig(normalized.petConfig);
      })
      .catch((e) => { console.warn("[PetWindow] Failed to load settings:", e); });
  }, []);

  // Listen for "open-settings" from tray menu
  useEffect(() => {
    const unlisten = listen("open-settings", () => {
      invoke("open_window", { label: "settings" }).catch((e) => {
        console.warn("[PetWindow] Failed to open settings window:", e);
        usePetStore.getState().showBubble("设置窗口打开失败", 3000);
      });
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  // Listen for crash-recovery event from Rust (previous session crashed)
  useEffect(() => {
    const unlisten = listen("crash-recovery", () => {
      console.warn("[crash-recovery] Previous session crash detected");
      usePetStore.getState().showBubble("宠物刚才睡着了，现在回来了", 5000);
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

  // Window resize on chat open/close — reposition handled by Rust to stay anchored at bottom-right
  // Skip initial mount: Rust sets the initial size (200x280) via the builder
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const targetW = chatOpen ? EXPANDED_W : COLLAPSED_W;
    const targetH = chatOpen ? EXPANDED_H : COLLAPSED_H;
    invoke("resize_pet_window", { width: targetW, height: targetH }).catch((e) => {
      // Fallback: only resize if Rust command unavailable
      try {
        const win = getCurrentWindow();
        win.setSize(new LogicalSize(targetW, targetH));
      } catch {
        // ignore
      }
    });
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
