import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import SettingsPanel from "../components/SettingsPanel";
import { usePetStore } from "../stores/petStore";
import { normalizeSettings } from "../utils/normalizeSettings";

function SettingsWindow() {
  const [loadError, setLoadError] = useState<string | null>(null);

  // Add settings-window-body class for solid background
  useEffect(() => {
    document.body.classList.add("settings-window-body");
    return () => {
      document.body.classList.remove("settings-window-body");
    };
  }, []);

  // Load settings on mount
  useEffect(() => {
    invoke("get_settings")
      .then((s: any) => {
        console.log("[SettingsWindow] Loaded settings:", JSON.stringify(s).slice(0, 200));
        const normalized = normalizeSettings(s);
        usePetStore.getState().setSettings(normalized);
        usePetStore.getState().setPetConfig(normalized.petConfig);
      })
      .catch((e) => {
        console.error("[SettingsWindow] Failed to load settings:", e);
        setLoadError(String(e));
      });
  }, []);

  const handleSaved = () => {
    // Broadcast settings update to other windows
    emit("settings-updated", {}).catch(() => {});
  };

  if (loadError) {
    return (
      <div className="settings-window-root" style={{ padding: 20 }}>
        <div style={{ color: "#dc2626", fontWeight: 600, marginBottom: 8 }}>设置加载失败</div>
        <pre style={{ fontSize: 12, color: "#666", overflow: "auto" }}>{loadError}</pre>
      </div>
    );
  }

  return (
    <div className="settings-window-root">
      <SettingsPanel onSaved={handleSaved} />
    </div>
  );
}

export default SettingsWindow;
