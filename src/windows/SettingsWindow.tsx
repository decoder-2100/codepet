import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import SettingsPanel from "../components/SettingsPanel";
import { usePetStore } from "../stores/petStore";
import { normalizeSettings } from "../utils/normalizeSettings";

function SettingsWindow() {
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

  const handleSaved = () => {
    // Broadcast settings update to other windows
    emit("settings-updated", {}).catch(() => {});
  };

  return (
    <div className="settings-window-root">
      <SettingsPanel onSaved={handleSaved} />
    </div>
  );
}

export default SettingsWindow;
