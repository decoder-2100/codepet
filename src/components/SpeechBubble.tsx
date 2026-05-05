import { useState, useEffect, useRef } from "react";
import { usePetStore } from "../stores/petStore";

const SpeechBubble = () => {
  const text = usePetStore((s) => s.bubbleText);
  const visible = usePetStore((s) => s.bubbleVisible);
  const animClass = usePetStore((s) => s.bubbleAnimClass);

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
  const hasBurstAnim = animClass && (animClass === "roast-burst" || animClass === "roast-wobble" || animClass === "compliment-burst");

  const style: React.CSSProperties = hasBurstAnim
    ? { pointerEvents: "none" }
    : {
        pointerEvents: "none",
        opacity: isEntering || isLeaving ? 0 : 1,
        transform: `translateX(-50%) translateY(${isEntering || isLeaving ? "6px" : "0px"})`,
        transition: isEntering
          ? "opacity 0.22s ease, transform 0.22s ease"
          : isLeaving
          ? "opacity 0.32s ease, transform 0.32s ease"
          : undefined,
      };

  const className = ["speech-bubble", animClass].filter(Boolean).join(" ");

  return (
    <div className={className} style={style}>
      {text}
      <div className="speech-bubble-tail" />
    </div>
  );
};

export default SpeechBubble;
