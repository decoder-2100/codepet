import { useEffect, useRef } from "react";
import { usePetStore } from "../stores/petStore";

export function useAutoHide() {
  const idleRef = useRef(0);
  const hiddenRef = useRef(false);

  function isPanelOpen(): boolean {
    return !!(
      document.querySelector(".context-menu") ||
      document.querySelector(".speech-bubble")
    );
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const state = usePetStore.getState();
      const appEl = document.querySelector(".app") as HTMLElement;
      if (!appEl) return;

      // Don't auto-hide if any overlay panel is open
      if (isPanelOpen()) {
        idleRef.current = 0;
        if (hiddenRef.current) {
          hiddenRef.current = false;
          appEl.style.opacity = "1";
          appEl.style.pointerEvents = "auto";
        }
        return;
      }

      if (!state.settings?.autoHide) {
        if (hiddenRef.current) {
          hiddenRef.current = false;
          appEl.style.opacity = "1";
          appEl.style.pointerEvents = "auto";
        }
        return;
      }

      if (state.kpm > 0) {
        idleRef.current = 0;
        if (hiddenRef.current) {
          hiddenRef.current = false;
          appEl.style.opacity = "1";
          appEl.style.pointerEvents = "auto";
        }
      } else {
        idleRef.current += 1;
        if (idleRef.current >= 12 && !hiddenRef.current) {
          hiddenRef.current = true;
          appEl.style.opacity = "0.08";
          setTimeout(() => {
            if (hiddenRef.current) appEl.style.pointerEvents = "none";
          }, 700);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);
}
