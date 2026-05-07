import type { PartState, PetColors } from "../../types";

type EyesDrawFn = (ctx: CanvasRenderingContext2D, s: PartState, c: PetColors) => void;

export const eyeVariants: Record<string, EyesDrawFn> = {
  normal: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 55 + s.y);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;
    for (const x of [-10, 10]) {
      // White
      ctx.beginPath();
      ctx.ellipse(x, 0, 4.5, 5.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      // Pupil
      ctx.beginPath();
      ctx.arc(x, 0.5, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = c.eye;
      ctx.fill();
      // Main highlight
      ctx.beginPath();
      ctx.arc(x - 1.2, -2.2, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fill();
    }
    ctx.restore();
  },

  big: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 55 + s.y);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;
    for (const x of [-12, 12]) {
      ctx.beginPath();
      ctx.ellipse(x, 0, 7, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, 0.5, 4.2, 0, Math.PI * 2);
      ctx.fillStyle = c.eye;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - 1.8, -3, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();
    }
    ctx.restore();
  },

  anime: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 55 + s.y);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;
    for (const x of [-12, 12]) {
      ctx.beginPath();
      ctx.ellipse(x, 0, 8, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = c.eye;
      ctx.fill();
      // Big sparkle top-left
      ctx.beginPath();
      ctx.arc(x - 2.5, -3.5, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fill();
      // Small sparkle bottom-right
      ctx.beginPath();
      ctx.arc(x + 3, 3, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fill();
    }
    ctx.restore();
  },

  dot: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 55 + s.y);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;
    for (const x of [-10, 10]) {
      ctx.beginPath();
      ctx.arc(x, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = c.eye;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - 0.8, -0.8, 1, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fill();
    }
    ctx.restore();
  },

  angry: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 55 + s.y);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;
    ctx.strokeStyle = c.eye;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-18, -7);
    ctx.lineTo(-5, -2);
    ctx.moveTo(18, -7);
    ctx.lineTo(5, -2);
    ctx.stroke();
    for (const x of [-10, 10]) {
      ctx.beginPath();
      ctx.ellipse(x, 0, 5, 4.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, 0.5, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = c.eye;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - 0.8, -1.5, 1.1, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();
    }
    ctx.restore();
  },

  happy: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 55 + s.y);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;
    ctx.strokeStyle = c.eye;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    for (const x of [-10, 10]) {
      ctx.beginPath();
      ctx.arc(x, 1, 5, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
    ctx.restore();
  },

  closed: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 55 + s.y);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;
    ctx.strokeStyle = c.eye;
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.quadraticCurveTo(-10, -4, -4, 0);
    ctx.moveTo(16, 0);
    ctx.quadraticCurveTo(10, -4, 4, 0);
    ctx.stroke();
    ctx.restore();
  },

  dead: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 55 + s.y);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;
    ctx.strokeStyle = c.eye;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    for (const x of [-10, 10]) {
      const o = 5;
      ctx.beginPath();
      ctx.moveTo(x - o, -o);
      ctx.lineTo(x + o, o);
      ctx.moveTo(x + o, -o);
      ctx.lineTo(x - o, o);
      ctx.stroke();
    }
    ctx.restore();
  },

  warm: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 55 + s.y);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;
    for (const x of [-11, 11]) {
      // White
      ctx.beginPath();
      ctx.ellipse(x, 0, 5, 5.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      // Warm brown pupil (almond shape via scaleY)
      ctx.beginPath();
      ctx.ellipse(x, 0.5, 3, 3.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = c.eye;
      ctx.fill();
      // Highlight
      ctx.beginPath();
      ctx.arc(x - 1.2, -2, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fill();
    }
    ctx.restore();
  },

  blue: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 55 + s.y);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;
    for (const x of [-11, 11]) {
      // White
      ctx.beginPath();
      ctx.ellipse(x, 0, 5, 5.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      // Blue pupil with glow effect
      ctx.beginPath();
      ctx.ellipse(x, 0.5, 3, 3.2, 0, 0, Math.PI * 2);
      const pupilGrad = ctx.createRadialGradient(x, 0, 0, x, 0.5, 3.2);
      pupilGrad.addColorStop(0, lighten(c.eye, 30));
      pupilGrad.addColorStop(0.7, c.eye);
      pupilGrad.addColorStop(1, darken(c.eye, 20));
      ctx.fillStyle = pupilGrad;
      ctx.fill();
      // Highlight
      ctx.beginPath();
      ctx.arc(x - 1, -1.8, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fill();
      // Secondary small highlight
      ctx.beginPath();
      ctx.arc(x + 1.2, 1.5, 0.8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fill();
    }
    ctx.restore();
  },
};

function lighten(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  if (isNaN(num)) return hex;
  const r = Math.min(255, ((num >> 16) & 0xff) + percent);
  const g = Math.min(255, ((num >> 8) & 0xff) + percent);
  const b = Math.min(255, (num & 0xff) + percent);
  return `rgb(${r},${g},${b})`;
}

function darken(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  if (isNaN(num)) return hex;
  const r = Math.max(0, ((num >> 16) & 0xff) - percent);
  const g = Math.max(0, ((num >> 8) & 0xff) - percent);
  const b = Math.max(0, (num & 0xff) - percent);
  return `rgb(${r},${g},${b})`;
}
