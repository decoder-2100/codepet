import { useEffect } from "react";
import { usePetStore } from "../stores/petStore";
import { SKINS } from "../data/skins";

export function useTheme() {
  const settings = usePetStore((s) => s.settings);

  useEffect(() => {
    const skinName = settings?.skin ?? "matrix";
    const skin = SKINS[skinName] ?? SKINS.matrix;
    const root = document.documentElement;

    root.style.setProperty("--skin-bg", skin.bgColor);
    root.style.setProperty("--skin-ui", skin.uiColor);
    root.style.setProperty("--skin-accent", skin.accentColor);
    root.style.setProperty("--skin-text", skin.textColor);
    root.style.setProperty("--skin-bubble-bg", skin.bubbleBg);
  }, [settings?.skin]);
}
