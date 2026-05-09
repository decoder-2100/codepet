import { useState, useEffect, useRef } from "react";
import { usePetStore } from "../stores/petStore";

const SpeechBubble = () => {
  const text = usePetStore((s) => s.bubbleText);
  const visible = usePetStore((s) => s.bubbleVisible);

  const [phase, setPhase] = useState<"hidden" | "entering" | "visible" | "leaving">("hidden");
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && text) {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      setPhase("entering");
      const t = setTimeout(() => setPhase("visible"), 20);
      return () => clearTimeout(t);
    } else if (!visible && phaseRef.current !== "hidden") {
      setPhase("leaving");
      leaveTimerRef.current = setTimeout(() => setPhase("hidden"), 350);
    }
  }, [visible, text]);

  if (!visible && phase === "hidden") return null;
  if (!text) return null;

  const isEntering = phase === "entering";
  const isLeaving = phase === "leaving";

  let animClass = "speech-bubble";
  if (isEntering) animClass += " speech-bubble--entering";
  if (isLeaving) animClass += " speech-bubble--leaving";

  return (
    <div className="speech-bubble-anchor">
      <div className={animClass}>
        {text}
        <div className="speech-bubble-tail" />
      </div>
    </div>
  );
};

export default SpeechBubble;
