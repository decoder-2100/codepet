import type { PartState, PetColors } from "../../types";

type TailDrawFn = (ctx: CanvasRenderingContext2D, s: PartState, c: PetColors) => void;

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

export const tailVariants: Record<string, TailDrawFn> = {
  cat: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 118 + s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;

    // Cat tail: smooth S-curve
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.quadraticCurveTo(-32, -8, -28, -38);
    ctx.quadraticCurveTo(-26, -52, -18, -48);
    ctx.strokeStyle = c.primary;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.stroke();

    // Tail tip gradient (seamless blend)
    const tipGrad = ctx.createLinearGradient(-24, -38, -18, -50);
    tipGrad.addColorStop(0, "rgba(255,255,255,0)");
    tipGrad.addColorStop(0.3, "rgba(255,255,255,0)");
    tipGrad.addColorStop(1, lighten(c.primary, 30));
    ctx.beginPath();
    ctx.moveTo(-24, -38);
    ctx.quadraticCurveTo(-22, -50, -18, -48);
    ctx.strokeStyle = tipGrad;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.restore();
  },

  bear: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 118 + s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;

    ctx.beginPath();
    ctx.ellipse(-22, -4, 6, 5, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = darken(c.primary, 6);
    ctx.fill();

    ctx.restore();
  },

  robot: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 118 + s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;

    const segs = 4;
    for (let i = 0; i < segs; i++) {
      const tx = -10 - i * 7;
      const ty = i * 3;
      ctx.beginPath();
      ctx.arc(tx, ty, 4 - i * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? c.primary : lighten(c.secondary, 15);
      ctx.fill();
    }

    // Glowing tip
    ctx.beginPath();
    ctx.arc(-36, 12, 3, 0, Math.PI * 2);
    const tipGrad = ctx.createRadialGradient(-37, 11, 0, -36, 12, 3);
    tipGrad.addColorStop(0, lighten(c.eye, 65));
    tipGrad.addColorStop(1, c.eye);
    ctx.fillStyle = tipGrad;
    ctx.fill();

    ctx.restore();
  },

  alien: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 118 + s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;

    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.quadraticCurveTo(-30, -15, -28, -40);
    ctx.strokeStyle = lighten(c.secondary, 10);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();

    // Glowing bulb
    ctx.beginPath();
    ctx.arc(-28, -42, 4.5, 0, Math.PI * 2);
    const bulbGrad = ctx.createRadialGradient(-29, -43, 0, -28, -42, 4.5);
    bulbGrad.addColorStop(0, lighten(c.accessory, 55));
    bulbGrad.addColorStop(1, c.accessory);
    ctx.fillStyle = bulbGrad;
    ctx.fill();

    ctx.restore();
  },

  fox: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 118 + s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;

    // Bushy tail layers
    ctx.beginPath();
    ctx.ellipse(-26, -18, 14, 8, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = c.primary;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(-34, -34, 12, 7, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = c.primary;
    ctx.fill();

    // White tip with soft gradient
    ctx.beginPath();
    ctx.ellipse(-38, -44, 8, 6, -0.2, 0, Math.PI * 2);
    const tipGrad = ctx.createRadialGradient(-36, -46, 2, -38, -44, 8);
    tipGrad.addColorStop(0, "rgba(255,255,255,0.9)");
    tipGrad.addColorStop(0.5, lighten(c.primary, 55));
    tipGrad.addColorStop(1, c.primary);
    ctx.fillStyle = tipGrad;
    ctx.fill();

    ctx.restore();
  },
};
