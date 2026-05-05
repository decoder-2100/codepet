import type { PetColors } from "../../types";

type AccessoryDrawFn = (ctx: CanvasRenderingContext2D, c: PetColors) => void;

export const accessoryVariants: Record<string, AccessoryDrawFn> = {
  glasses: (ctx, c) => {
    ctx.save();
    ctx.strokeStyle = c.accessory;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    // Lenses
    ctx.beginPath();
    ctx.ellipse(-12, -24, 8, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(12, -24, 8, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Bridge
    ctx.beginPath();
    ctx.moveTo(-4, -24);
    ctx.lineTo(4, -24);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  },

  hat: (ctx, c) => {
    ctx.save();
    ctx.fillStyle = c.accessory;
    // Brim
    roundRect(ctx, -22, -44, 44, 6, 3);
    ctx.fill();
    // Top
    roundRect(ctx, -13, -66, 26, 24, 5);
    ctx.fill();
    ctx.restore();
  },

  headphone: (ctx, c) => {
    ctx.save();
    ctx.strokeStyle = c.accessory;
    ctx.lineWidth = 2.5;
    // Band
    ctx.beginPath();
    ctx.arc(0, -30, 26, Math.PI * 0.8, Math.PI * 0.2, true);
    ctx.stroke();
    // Earcups
    ctx.beginPath();
    ctx.ellipse(-26, -22, 5, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = c.accessory;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(26, -22, 5, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = c.accessory;
    ctx.fill();
    ctx.restore();
  },

  bowtie: (ctx, c) => {
    ctx.save();
    ctx.fillStyle = c.accessory;
    // Left triangle
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(-13, 14);
    ctx.lineTo(-13, 26);
    ctx.closePath();
    ctx.fill();
    // Right triangle
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(13, 14);
    ctx.lineTo(13, 26);
    ctx.closePath();
    ctx.fill();
    // Center knot
    ctx.beginPath();
    ctx.arc(0, 20, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = darken(c.accessory, 20);
    ctx.fill();
    ctx.restore();
  },

  scarf: (ctx, c) => {
    ctx.save();
    ctx.fillStyle = c.accessory;
    // Wrap around neck
    roundRect(ctx, -17, 16, 34, 9, 3);
    ctx.fill();
    // Dangling end
    roundRect(ctx, 6, 19, 10, 18, 3);
    ctx.fill();
    // Stripes
    ctx.strokeStyle = lighten(c.accessory, 30);
    ctx.lineWidth = 0.8;
    for (let y = 18; y < 34; y += 5) {
      ctx.beginPath();
      ctx.moveTo(7, y);
      ctx.lineTo(15, y);
      ctx.stroke();
    }
    ctx.restore();
  },

  keyboard: (ctx, c) => {
    ctx.save();
    ctx.fillStyle = c.accessory;
    const kx = 75, ky = 138;
    // Keyboard body
    roundRect(ctx, kx - 30, ky - 12, 60, 24, 3);
    ctx.fill();
    // Keys
    ctx.fillStyle = lighten(c.accessory, 55);
    const keys = [
      [-22, -6], [-12, -6], [-2, -6], [8, -6], [18, -6],
      [-17, 2], [-7, 2], [3, 2], [13, 2],
    ];
    for (const [kx2, ky2] of keys) {
      roundRect(ctx, kx + kx2 - 3, ky + ky2 - 2.5, 6, 5, 1.2);
      ctx.fill();
    }
    // Spacebar
    roundRect(ctx, kx - 14, ky + 6, 28, 4, 1.5);
    ctx.fill();
    ctx.restore();
  },

  coffee: (ctx, c) => {
    ctx.save();
    const cx = 75, cy = 130;
    // Cup
    roundRect(ctx, cx - 10, cy - 12, 20, 22, 3);
    ctx.fillStyle = c.accessory;
    ctx.fill();
    // Handle
    ctx.beginPath();
    ctx.moveTo(cx + 10, cy - 6);
    ctx.arcTo(cx + 18, cy - 1, cx + 10, cy + 3, 7);
    ctx.strokeStyle = c.accessory;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // Steam
    ctx.strokeStyle = lighten(c.accessory, 50);
    ctx.lineWidth = 1.3;
    for (const sx of [-3, 0, 3]) {
      ctx.beginPath();
      ctx.moveTo(cx + sx, cy - 14);
      ctx.quadraticCurveTo(cx + sx - 2, cy - 20, cx + sx, cy - 26);
      ctx.stroke();
    }
    ctx.restore();
  },

  codeBubble: (ctx, c) => {
    ctx.save();
    const bx = 75, by = 40;
    // Bubble — translucent frosted glass look
    ctx.beginPath();
    ctx.ellipse(bx, by, 24, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // Code text
    ctx.fillStyle = c.accessory;
    ctx.font = "9px 'SF Mono', 'Menlo', monospace";
    ctx.textAlign = "center";
    ctx.fillText("</>", bx, by + 3);
    ctx.restore();
  },
};

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
