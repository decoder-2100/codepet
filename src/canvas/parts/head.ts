import type { PartState, PetColors } from "../../types";

type HeadDrawFn = (ctx: CanvasRenderingContext2D, s: PartState, c: PetColors) => void;

export const headVariants: Record<string, HeadDrawFn> = {
  cat: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 60 + s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;

    // Rounded ears — wider base, shorter, less pointed tip
    drawRoundedEar(ctx, -22, -10, -28, -34, -10, -22, 6, c);
    drawRoundedEar(ctx, 22, -10, 28, -34, 10, -22, 6, c);

    // Inner ears
    drawRoundedEar(ctx, -20, -12, -24, -28, -12, -21, 4,
      { primary: lighten(c.primary, 50), secondary: lighten(c.primary, 50), eye: c.eye, accessory: c.accessory });
    drawRoundedEar(ctx, 20, -12, 24, -28, 12, -21, 4,
      { primary: lighten(c.primary, 50), secondary: lighten(c.primary, 50), eye: c.eye, accessory: c.accessory });

    // Head with refined gradient
    const grad = ctx.createRadialGradient(-4, -5, 3, 0, 1, 27);
    grad.addColorStop(0, lighten(c.primary, 35));
    grad.addColorStop(0.4, lighten(c.primary, 12));
    grad.addColorStop(0.75, c.primary);
    grad.addColorStop(1, darken(c.primary, 8));
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();
  },

  bear: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 60 + s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;

    // Round ears
    for (const dx of [-20, 20]) {
      ctx.beginPath();
      ctx.arc(dx, -18, 10, 0, Math.PI * 2);
      ctx.fillStyle = c.primary;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dx, -18, 5, 0, Math.PI * 2);
      ctx.fillStyle = lighten(c.primary, 42);
      ctx.fill();
    }

    // Head
    const grad = ctx.createRadialGradient(-4, -5, 3, 0, 1, 27);
    grad.addColorStop(0, lighten(c.primary, 35));
    grad.addColorStop(0.4, lighten(c.primary, 12));
    grad.addColorStop(0.75, c.primary);
    grad.addColorStop(1, darken(c.primary, 8));
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Muzzle — refined oval
    ctx.beginPath();
    ctx.ellipse(0, 6, 12, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = lighten(c.primary, 45);
    ctx.fill();

    // Nose
    ctx.beginPath();
    ctx.ellipse(0, 2, 3.5, 2.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = c.eye;
    ctx.fill();

    ctx.restore();
  },

  robot: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 60 + s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;

    // Antenna
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(0, -38);
    ctx.strokeStyle = c.secondary;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -40, 3, 0, Math.PI * 2);
    const antGrad = ctx.createRadialGradient(0, -41, 0, 0, -40, 3);
    antGrad.addColorStop(0, lighten(c.accessory, 50));
    antGrad.addColorStop(1, c.accessory);
    ctx.fillStyle = antGrad;
    ctx.fill();

    // Square head with softer corners
    roundRect(ctx, -25, -24, 50, 48, 8);
    const grad = ctx.createLinearGradient(0, -24, 0, 24);
    grad.addColorStop(0, lighten(c.primary, 25));
    grad.addColorStop(0.45, c.primary);
    grad.addColorStop(1, darken(c.primary, 8));
    ctx.fillStyle = grad;
    ctx.fill();

    // Visor
    roundRect(ctx, -20, -6, 40, 14, 4);
    const visorGrad = ctx.createLinearGradient(0, -6, 0, 8);
    visorGrad.addColorStop(0, lighten(c.eye, 35));
    visorGrad.addColorStop(1, c.eye);
    ctx.fillStyle = visorGrad;
    ctx.fill();

    // Visor reflection
    roundRect(ctx, -16, -3, 32, 6, 2);
    ctx.fillStyle = lighten(c.eye, 55);
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = s.opacity;

    // Side indicators — refined
    for (const dx of [-18, 18]) {
      ctx.beginPath();
      ctx.arc(dx, 12, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = c.accessory;
      ctx.globalAlpha = 0.4;
      ctx.fill();
    }
    ctx.globalAlpha = s.opacity;

    ctx.restore();
  },

  alien: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 60 + s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;

    // Teardrop head with refined gradient
    const grad = ctx.createRadialGradient(-4, -8, 4, 0, 1, 31);
    grad.addColorStop(0, lighten(c.primary, 38));
    grad.addColorStop(0.4, lighten(c.primary, 10));
    grad.addColorStop(0.75, c.primary);
    grad.addColorStop(1, darken(c.primary, 10));
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 32, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Antennae — refined curves
    for (const dx of [-10, 10]) {
      ctx.beginPath();
      ctx.moveTo(dx, -28);
      ctx.quadraticCurveTo(dx * 1.5, -46, dx * 2, -38);
      ctx.strokeStyle = c.secondary;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(dx * 2, -38, 2.8, 0, Math.PI * 2);
      const bulbGrad = ctx.createRadialGradient(dx * 2 - 1, -39, 0, dx * 2, -38, 2.8);
      bulbGrad.addColorStop(0, lighten(c.accessory, 55));
      bulbGrad.addColorStop(1, c.accessory);
      ctx.fillStyle = bulbGrad;
      ctx.fill();
    }

    ctx.restore();
  },

  fox: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 60 + s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;

    // Triangular ears — refined
    drawRoundedEar(ctx, -20, -10, -34, -40, -8, -22, 5, c);
    drawRoundedEar(ctx, 20, -10, 34, -40, 8, -22, 5, c);

    // Inner ears
    drawRoundedEar(ctx, -18, -12, -28, -34, -10, -22, 3,
      { primary: lighten(c.primary, 50), secondary: lighten(c.primary, 50), eye: c.eye, accessory: c.accessory });
    drawRoundedEar(ctx, 18, -12, 28, -34, 10, -22, 3,
      { primary: lighten(c.primary, 50), secondary: lighten(c.primary, 50), eye: c.eye, accessory: c.accessory });

    // Head ellipse
    const grad = ctx.createRadialGradient(-3, -4, 3, 0, 1, 26);
    grad.addColorStop(0, lighten(c.primary, 35));
    grad.addColorStop(0.4, lighten(c.primary, 12));
    grad.addColorStop(0.75, c.primary);
    grad.addColorStop(1, darken(c.primary, 8));
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 24, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Muzzle
    ctx.beginPath();
    ctx.ellipse(0, 7, 12, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = lighten(c.primary, 52);
    ctx.fill();

    // Nose
    ctx.beginPath();
    ctx.ellipse(0, 3, 3.2, 2.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = c.eye;
    ctx.fill();

    ctx.restore();
  },

  golden: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 60 + s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;

    // Floppy ears (elongated ovals hanging down from sides)
    for (const dx of [-22, 22]) {
      ctx.beginPath();
      ctx.ellipse(dx, 6, 7, 16, dx > 0 ? 0.2 : -0.2, 0, Math.PI * 2);
      ctx.fillStyle = darken(c.primary, 8);
      ctx.fill();
      // Inner ear highlight
      ctx.beginPath();
      ctx.ellipse(dx, 8, 4, 10, dx > 0 ? 0.2 : -0.2, 0, Math.PI * 2);
      ctx.fillStyle = lighten(c.primary, 30);
      ctx.fill();
    }

    // Head with radial gradient
    const grad = ctx.createRadialGradient(-4, -5, 3, 0, 1, 27);
    grad.addColorStop(0, lighten(c.primary, 35));
    grad.addColorStop(0.4, lighten(c.primary, 12));
    grad.addColorStop(0.75, c.primary);
    grad.addColorStop(1, darken(c.primary, 8));
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 26, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Cream muzzle oval
    ctx.beginPath();
    ctx.ellipse(0, 8, 14, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#F0DCC0";
    ctx.fill();

    // Dark brown nose
    ctx.beginPath();
    ctx.ellipse(0, 3, 4, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#3D2B1F";
    ctx.fill();

    ctx.restore();
  },

  husky: (ctx, s, c) => {
    ctx.save();
    ctx.translate(75 + s.x, 60 + s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha = s.opacity;

    // Pointed upright triangular ears
    drawRoundedEar(ctx, -20, -10, -32, -40, -8, -20, 5, c);
    drawRoundedEar(ctx, 20, -10, 32, -40, 8, -20, 5, c);

    // Inner ears (pink)
    drawRoundedEar(ctx, -18, -12, -26, -34, -10, -20, 3,
      { primary: "#F0C0C0", secondary: "#F0C0C0", eye: c.eye, accessory: c.accessory });
    drawRoundedEar(ctx, 18, -12, 26, -34, 10, -20, 3,
      { primary: "#F0C0C0", secondary: "#F0C0C0", eye: c.eye, accessory: c.accessory });

    // Head
    const grad = ctx.createRadialGradient(-4, -5, 3, 0, 1, 27);
    grad.addColorStop(0, lighten(c.primary, 35));
    grad.addColorStop(0.4, lighten(c.primary, 12));
    grad.addColorStop(0.75, c.primary);
    grad.addColorStop(1, darken(c.primary, 8));
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 24, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Grey mask patches around eyes
    for (const dx of [-10, 10]) {
      ctx.beginPath();
      ctx.ellipse(dx, -2, 8, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = darken(c.primary, 15);
      ctx.globalAlpha = 0.25;
      ctx.fill();
    }
    ctx.globalAlpha = s.opacity;

    // White muzzle
    ctx.beginPath();
    ctx.ellipse(0, 8, 12, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#F0F0F4";
    ctx.fill();

    // Black nose
    ctx.beginPath();
    ctx.ellipse(0, 4, 3.5, 2.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#1A1A1A";
    ctx.fill();

    ctx.restore();
  },
};

function drawRoundedEar(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  radius: number,
  c: PetColors
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 + radius * 0.5, y2 + radius * 0.3);
  ctx.quadraticCurveTo(x2, y2, x2 - radius * 0.3, y2 - radius * 0.5);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fillStyle = c.primary;
  ctx.fill();
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
