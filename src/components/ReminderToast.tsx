import { useEffect, useRef } from "react";
import { usePetStore } from "../stores/petStore";
import { Sound } from "../utils/sound";

const ReminderToast = () => {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      usePetStore.getState().tickMinute();
      const state = usePetStore.getState();
      const interval = state.settings?.reminderInterval ?? 120;
      if (state.cumulativeCodingMinutes > 0 && state.cumulativeCodingMinutes % interval === 0) {
        Sound.notification();
        state.showBubble(
          `已经连续编码 ${state.cumulativeCodingMinutes} 分钟了！\n让手指休息一下吧 🧘`,
          6000,
        );
      }
    }, 60000); // Check every minute

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return null; // Uses pet bubble for display
};

export default ReminderToast;
