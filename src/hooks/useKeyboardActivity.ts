import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { usePetStore } from "../stores/petStore";
import { Sound } from "../utils/sound";

export function useKeyboardActivity() {
  const updateKpm = usePetStore((s) => s.updateKpm);
  const setPose = usePetStore((s) => s.setPose);
  const setAnim = usePetStore((s) => s.setAnim);
  const kpm = usePetStore((s) => s.kpm);
  const idleRef = useRef(0);
  const codingMinutesRef = useRef(0);

  useEffect(() => {
    const unlisten = listen<number>("keyboard-activity", (event) => {
      const newKpm = event.payload;
      updateKpm(newKpm);

      if (newKpm > 20) {
        Sound.typing();
        idleRef.current = 0;
        codingMinutesRef.current += 1;
        // Events come every ~5s, so 1440 events = 7200s = 2 hours
        if (codingMinutesRef.current >= 1440) {
          setPose("collapsed");
          setAnim("collapsed");
          usePetStore.getState().showBubble(
            "你已经连续编码 2 小时了！让手指休息一下吧 💀",
            5000,
          );
          codingMinutesRef.current = 0;
        } else {
          setPose("coding");
          setAnim("typing");
        }
      } else {
        idleRef.current += 1; // each event is ~5s
        if (idleRef.current >= 6) {
          // ~30s idle
          setPose("idle");
          setAnim("idle");
          codingMinutesRef.current = 0;
        }
      }
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);
}
