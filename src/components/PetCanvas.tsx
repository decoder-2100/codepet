import { useRef, useEffect } from "react";
import { usePetAnimator } from "../hooks/usePetAnimator";

const CANVAS_W = 150;
const CANVAS_H = 180;

const PetCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  usePetAnimator(canvasRef);

  // Handle HiDPI displays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="pet-canvas"
      style={{ width: CANVAS_W, height: CANVAS_H, display: "block" }}
    />
  );
};

export default PetCanvas;
