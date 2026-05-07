import type { PartState, PetColors } from "../../types";

type MouthDrawFn = (ctx: CanvasRenderingContext2D, s: PartState, c: PetColors) => void;

export const mouthVariants: Record<string, MouthDrawFn> = {
  smile: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 65 + s.y);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0.15, Math.PI - 0.15);
    ctx.strokeStyle = c.eye;
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  },

  open: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 65 + s.y);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = c.eye;
    ctx.fill();
    ctx.restore();
  },

  straight: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 65 + s.y);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(7, 0);
    ctx.strokeStyle = c.eye;
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  },

  sad: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 65 + s.y);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;
    ctx.beginPath();
    ctx.arc(0, 4, 7, Math.PI + 0.15, -0.15);
    ctx.strokeStyle = c.eye;
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  },

  oShape: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 65 + s.y);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = c.eye;
    ctx.fill();
    ctx.restore();
  },

  grin: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 65 + s.y);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0.1, Math.PI - 0.1);
    ctx.strokeStyle = c.eye;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  },

  "happy-smile": (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 65 + s.y);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;
    // Smile arc
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0.1, Math.PI - 0.1);
    ctx.strokeStyle = c.eye;
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.stroke();
    // Small pink tongue
    ctx.beginPath();
    ctx.arc(0, 5, 3, 0, Math.PI);
    ctx.fillStyle = "#E8A0A0";
    ctx.fill();
    ctx.restore();
  },

  smirk: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 65 + s.y);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;
    // Asymmetric smile — wider on right side
    ctx.beginPath();
    ctx.moveTo(-7, 1);
    ctx.quadraticCurveTo(0, 6, 9, 0);
    ctx.strokeStyle = c.eye;
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  },
};
