import { AnimationPlayer } from "./animationEngine";
import { bodyVariants } from "./parts/body";
import { headVariants } from "./parts/head";
import { eyeVariants } from "./parts/eyes";
import { mouthVariants } from "./parts/mouth";
import { tailVariants } from "./parts/tail";
import { accessoryVariants } from "./parts/accessories";
import type { PetColors, PetPartConfig, PartState } from "../types";

const DEFAULT_STATE: PartState = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 };

// ── 粒子类型 ──
type ParticleShape = "diamond" | "heart" | "star" | "circle";

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: ParticleShape;
  rotation: number;
  rotSpeed: number;
}

let sparkles: Sparkle[] = [];
let sparkleTimer = 0;

const PARTICLE_COLORS = [
  "rgba(255,182,193,0.6)",   // 浅粉
  "rgba(255,215,0,0.55)",    // 金黄
  "rgba(180,220,255,0.5)",   // 天蓝
  "rgba(255,255,255,0.4)",   // 白
  "rgba(200,160,255,0.5)",   // 紫
  "rgba(160,230,160,0.45)",  // 绿
];

const PARTICLE_SHAPES: ParticleShape[] = ["diamond", "heart", "star", "circle"];

function spawnSparkle(canvasW: number, canvasH: number) {
  const shape = PARTICLE_SHAPES[Math.floor(Math.random() * PARTICLE_SHAPES.length)];
  sparkles.push({
    x: canvasW * 0.25 + Math.random() * canvasW * 0.5,
    y: canvasH * 0.45 + Math.random() * canvasH * 0.45,
    vx: (Math.random() - 0.5) * 0.18,
    vy: -0.08 - Math.random() * 0.18,
    life: 0,
    maxLife: 2200 + Math.random() * 1800,
    size: 1.2 + Math.random() * 1.8,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    shape,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.004,
  });
}

function updateSparkles(dt: number, canvasW: number, canvasH: number) {
  sparkleTimer -= dt;
  if (sparkleTimer <= 0) {
    spawnSparkle(canvasW, canvasH);
    // 偶尔一次生两个，让效果更活泼
    if (Math.random() < 0.25) spawnSparkle(canvasW, canvasH);
    sparkleTimer = 500 + Math.random() * 800;
  }

  for (const s of sparkles) {
    s.x += s.vx;
    s.y += s.vy;
    s.vy -= 0.0006;
    s.rotation += s.rotSpeed;
    s.life += dt;
  }
  sparkles = sparkles.filter((s) => s.life < s.maxLife);
}

function drawHeart(ctx: CanvasRenderingContext2D, size: number) {
  const s = size * 1.2;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.3);
  ctx.bezierCurveTo(s * 0.5, -s, s * 1.1, -s * 0.1, 0, s * 0.9);
  ctx.bezierCurveTo(-s * 1.1, -s * 0.1, -s * 0.5, -s, 0, -s * 0.3);
  ctx.closePath();
}

function drawStar(ctx: CanvasRenderingContext2D, size: number) {
  const spikes = 5;
  const outer = size;
  const inner = size * 0.45;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawSparkles(ctx: CanvasRenderingContext2D) {
  for (const s of sparkles) {
    const progress = s.life / s.maxLife;
    // 前10%淡入，后30%淡出
    const alpha = progress < 0.1
      ? (progress / 0.1) * 0.5
      : progress > 0.7
      ? ((1 - progress) / 0.3) * 0.5
      : 0.5;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);

    const sz = s.size;

    switch (s.shape) {
      case "heart":
        drawHeart(ctx, sz);
        ctx.fillStyle = s.color;
        ctx.fill();
        break;
      case "star":
        drawStar(ctx, sz * 1.2);
        ctx.fillStyle = s.color;
        ctx.fill();
        break;
      case "circle":
        ctx.beginPath();
        ctx.arc(0, 0, sz, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
        break;
      case "diamond":
      default:
        ctx.beginPath();
        ctx.moveTo(0, -sz * 1.2);
        ctx.lineTo(sz * 0.6, 0);
        ctx.lineTo(0, sz * 1.2);
        ctx.lineTo(-sz * 0.6, 0);
        ctx.closePath();
        ctx.fillStyle = s.color;
        ctx.fill();
        break;
    }

    ctx.restore();
  }
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  player: AnimationPlayer,
  parts: PetPartConfig,
  colors: PetColors,
  dt: number,
  canvasW: number = 150,
  canvasH: number = 180,
) {
  ctx.clearRect(0, 0, canvasW, canvasH);

  const states = player.advance(dt);
  if (!states) return;

  // 0. Tail (behind body)
  const tailFn = tailVariants[parts.tail] ?? tailVariants.cat;
  tailFn(ctx, states.tail ?? DEFAULT_STATE, colors);

  // 1. Body
  const bodyFn = bodyVariants[parts.body] ?? bodyVariants.chubby;
  bodyFn(ctx, states.body ?? DEFAULT_STATE, colors);

  // 2. Body-level accessories (keyboard, coffee)
  for (const acc of parts.accessories) {
    if (["keyboard", "coffee"].includes(acc)) {
      accessoryVariants[acc]?.(ctx, colors);
    }
  }

  // 3. Head
  const headFn = headVariants[parts.head] ?? headVariants.cat;
  headFn(ctx, states.head ?? DEFAULT_STATE, colors);

  // 4. Eyes (with blink applied)
  const eyeFn = eyeVariants[parts.eyes] ?? eyeVariants.normal;
  const eyeState = states.eyes ?? DEFAULT_STATE;
  const blinkScale = player.blinkScale ?? 1;
  const finalEyeState = { ...eyeState, scaleY: eyeState.scaleY * blinkScale };
  eyeFn(ctx, finalEyeState, colors);

  // 5. Mouth
  const mouthFn = mouthVariants[parts.mouth] ?? mouthVariants.smile;
  mouthFn(ctx, states.mouth ?? DEFAULT_STATE, colors);

  // 6. Head-level accessories
  for (const acc of parts.accessories) {
    if (["glasses", "hat", "headphone", "bowtie", "scarf", "codeBubble"].includes(acc)) {
      accessoryVariants[acc]?.(ctx, colors);
    }
  }

  // 7. Sparkle particles
  updateSparkles(dt, canvasW, canvasH);
  drawSparkles(ctx);
}
