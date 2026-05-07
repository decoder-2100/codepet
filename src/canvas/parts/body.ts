import type { PartState, PetColors } from "../../types";

type BodyDrawFn = (ctx: CanvasRenderingContext2D, s: PartState, c: PetColors) => void;

export const bodyVariants: Record<string, BodyDrawFn> = {
  chubby: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 118 + s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;

    // Main body with refined radial gradient
    const grad = ctx.createRadialGradient(-4, -6, 4, 0, 2, 35);
    grad.addColorStop(0, lighten(c.primary, 40));
    grad.addColorStop(0.35, lighten(c.primary, 15));
    grad.addColorStop(0.7, c.primary);
    grad.addColorStop(1, darken(c.primary, 10));
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 38, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle belly highlight
    ctx.beginPath();
    ctx.ellipse(0, 6, 18, 22, 0, 0, Math.PI * 2);
    const bellyGrad = ctx.createRadialGradient(-2, 2, 2, 0, 8, 20);
    bellyGrad.addColorStop(0, lighten(c.primary, 55));
    bellyGrad.addColorStop(1, "rgba(255,255,255,0.05)");
    ctx.fillStyle = bellyGrad;
    ctx.fill();

    ctx.restore();
  },

  tall: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 116 + s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;

    const grad = ctx.createRadialGradient(-3, -7, 3, 0, 2, 28);
    grad.addColorStop(0, lighten(c.primary, 40));
    grad.addColorStop(0.35, lighten(c.primary, 15));
    grad.addColorStop(0.7, c.primary);
    grad.addColorStop(1, darken(c.primary, 10));
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 40, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, 5, 14, 26, 0, 0, Math.PI * 2);
    const bellyGrad = ctx.createRadialGradient(-1, 2, 2, 0, 7, 18);
    bellyGrad.addColorStop(0, lighten(c.primary, 55));
    bellyGrad.addColorStop(1, "rgba(255,255,255,0.05)");
    ctx.fillStyle = bellyGrad;
    ctx.fill();

    ctx.restore();
  },

  round: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 114 + s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;

    const grad = ctx.createRadialGradient(-4, -5, 4, 0, 1, 34);
    grad.addColorStop(0, lighten(c.primary, 40));
    grad.addColorStop(0.35, lighten(c.primary, 15));
    grad.addColorStop(0.7, c.primary);
    grad.addColorStop(1, darken(c.primary, 10));
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 4, 16, 0, Math.PI * 2);
    const bellyGrad = ctx.createRadialGradient(-2, 1, 2, 0, 6, 16);
    bellyGrad.addColorStop(0, lighten(c.primary, 55));
    bellyGrad.addColorStop(1, "rgba(255,255,255,0.05)");
    ctx.fillStyle = bellyGrad;
    ctx.fill();

    ctx.restore();
  },

  robot: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 116 + s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;

    roundRect(ctx, -30, -35, 58, 62, 10);
    const grad = ctx.createLinearGradient(0, -35, 0, 27);
    grad.addColorStop(0, lighten(c.primary, 30));
    grad.addColorStop(0.4, lighten(c.primary, 10));
    grad.addColorStop(0.6, c.primary);
    grad.addColorStop(1, darken(c.primary, 8));
    ctx.fillStyle = grad;
    ctx.fill();

    // Refined panel lines
    ctx.strokeStyle = lighten(c.secondary, 20);
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(-14, -12);
    ctx.lineTo(14, -12);
    ctx.moveTo(-14, 2);
    ctx.lineTo(14, 2);
    ctx.moveTo(-14, 16);
    ctx.lineTo(14, 16);
    ctx.stroke();
    ctx.globalAlpha = s.opacity;

    // Center indicator light
    ctx.beginPath();
    ctx.arc(0, -23, 6, 0, Math.PI * 2);
    const lightGrad = ctx.createRadialGradient(-1, -1, 1, 0, -23, 6);
    lightGrad.addColorStop(0, lighten(c.eye, 60));
    lightGrad.addColorStop(0.6, c.eye);
    lightGrad.addColorStop(1, darken(c.eye, 30));
    ctx.fillStyle = lightGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(-2, -25, 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fill();

    ctx.restore();
  },

  golden: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 116 + s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;

    const grad = ctx.createRadialGradient(-4, -6, 4, 0, 2, 38);
    grad.addColorStop(0, lighten(c.primary, 40));
    grad.addColorStop(0.35, lighten(c.primary, 15));
    grad.addColorStop(0.7, c.primary);
    grad.addColorStop(1, darken(c.primary, 10));
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 36, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Chest fur highlight (lighter cream patch on lower chest)
    ctx.beginPath();
    ctx.ellipse(0, 10, 16, 20, 0, 0, Math.PI * 2);
    const chestGrad = ctx.createRadialGradient(-2, 6, 2, 0, 10, 18);
    chestGrad.addColorStop(0, lighten(c.secondary, 30));
    chestGrad.addColorStop(1, "rgba(255,255,255,0.05)");
    ctx.fillStyle = chestGrad;
    ctx.fill();

    ctx.restore();
  },

  husky: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 116 + s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;

    const grad = ctx.createRadialGradient(-4, -6, 4, 0, 2, 36);
    grad.addColorStop(0, lighten(c.primary, 40));
    grad.addColorStop(0.35, lighten(c.primary, 15));
    grad.addColorStop(0.7, c.primary);
    grad.addColorStop(1, darken(c.primary, 10));
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 34, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // White chest mane (extends from neck down to mid-chest)
    ctx.beginPath();
    ctx.ellipse(0, 8, 14, 18, 0, 0, Math.PI * 2);
    const maneGrad = ctx.createRadialGradient(-2, 4, 2, 0, 8, 16);
    maneGrad.addColorStop(0, c.secondary);
    maneGrad.addColorStop(1, "rgba(255,255,255,0.05)");
    ctx.fillStyle = maneGrad;
    ctx.fill();

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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
