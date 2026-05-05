import type { Animation } from "../types";
import { AnimationPlayer } from "./animationEngine";

export function registerAnimations(player: AnimationPlayer) {
  // ── Idle: 自然呼吸 + 细腻头部起伏 + 尾巴悠闲摆动 ──
  const idle: Animation = {
    name: "idle",
    loop: true,
    duration: 3600,
    keyframes: [
      // 起始：平静站立
      { time: 0,    parts: { body: { x: 0, y: 0,  rotation: 0,  scaleX: 1,    scaleY: 1,    opacity: 1 }, head: { x: 0, y: 0,  rotation: 0,  scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, tail: { x: -18, y: 0, rotation: -22, scaleX: 1, scaleY: 1,    opacity: 1 } } },
      // 吸气：身体略拉伸，头微抬，尾巴轻扬
      { time: 900,  parts: { body: { x: 0, y: -7, rotation: 0,  scaleX: 0.95, scaleY: 1.08, opacity: 1 }, head: { x: 0, y: -3, rotation: -4, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, tail: { x: -18, y: -2, rotation: -14, scaleX: 1, scaleY: 1.1,  opacity: 1 } } },
      // 屏息：微停，头轻偏
      { time: 1500, parts: { body: { x: 0, y: -5, rotation: 0,  scaleX: 0.97, scaleY: 1.05, opacity: 1 }, head: { x: 1, y: -2, rotation: 3,  scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, tail: { x: -18, y: -2, rotation: -30, scaleX: 1, scaleY: 1.04, opacity: 1 } } },
      // 呼气：身体放松下沉，头偏另一边
      { time: 2400, parts: { body: { x: 0, y: -2, rotation: 0,  scaleX: 0.99, scaleY: 1.02, opacity: 1 }, head: { x: -1, y: -1, rotation: -2, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, tail: { x: -18, y: -1, rotation: -18, scaleX: 1, scaleY: 1.02, opacity: 1 } } },
      // 回到静止
      { time: 3600, parts: { body: { x: 0, y: 0,  rotation: 0,  scaleX: 1,    scaleY: 1,    opacity: 1 }, head: { x: 0, y: 0,  rotation: 0,  scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, tail: { x: -18, y: 0, rotation: -22, scaleX: 1, scaleY: 1,    opacity: 1 } } },
    ],
  };

  // ── Look-around: 好奇地左右张望 ──
  const lookAround: Animation = {
    name: "look-around",
    loop: false,
    duration: 2400,
    keyframes: [
      { time: 0,    parts: { body: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, head: { x: 0, y: 0, rotation: 0,   scaleX: 1,    scaleY: 1,    opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, tail: { x: -18, y: 0, rotation: -22, scaleX: 1, scaleY: 1, opacity: 1 } } },
      // 头向左转，眼睛微缩（好奇看）
      { time: 500,  parts: { body: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, head: { x: -3, y: -2, rotation: -12, scaleX: 1.02, scaleY: 1.02, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 0.9, scaleY: 1.1,  opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, tail: { x: -18, y: -1, rotation: -16, scaleX: 1, scaleY: 1.05, opacity: 1 } } },
      // 停顿看看
      { time: 1000, parts: { body: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, head: { x: -3, y: -2, rotation: -10, scaleX: 1.02, scaleY: 1.02, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 0.9, scaleY: 1.1,  opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, tail: { x: -18, y: -1, rotation: -28, scaleX: 1, scaleY: 1.05, opacity: 1 } } },
      // 转向右边
      { time: 1500, parts: { body: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, head: { x: 3, y: -2, rotation: 10,  scaleX: 1.02, scaleY: 1.02, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 0.9, scaleY: 1.1,  opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, tail: { x: -18, y: -1, rotation: -20, scaleX: 1, scaleY: 1.05, opacity: 1 } } },
      // 回正
      { time: 2400, parts: { body: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, head: { x: 0, y: 0,  rotation: 0,   scaleX: 1,    scaleY: 1,    opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, tail: { x: -18, y: 0, rotation: -22, scaleX: 1, scaleY: 1, opacity: 1 } } },
    ],
  };

  // ── Stretch: 伸懒腰，打哈欠 ──
  const stretch: Animation = {
    name: "stretch",
    loop: false,
    duration: 2800,
    keyframes: [
      { time: 0,    parts: { body: { x: 0, y: 0,   rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, head: { x: 0, y: 0,   rotation: 0,  scaleX: 1,    scaleY: 1,    opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1,   scaleY: 1,   opacity: 1 }, tail: { x: -18, y: 0,  rotation: -22, scaleX: 1, scaleY: 1,    opacity: 1 } } },
      // 开始伸展：身体拉长，头向后仰
      { time: 500,  parts: { body: { x: 0, y: -6,  rotation: 0, scaleX: 0.88, scaleY: 1.14, opacity: 1 }, head: { x: 0, y: -4,  rotation: -8, scaleX: 1,    scaleY: 1,    opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 0.3,  opacity: 1 }, mouth: { x: 0, y: 2, rotation: 0, scaleX: 1.5, scaleY: 1.5, opacity: 1 }, tail: { x: -18, y: -3, rotation: -8,  scaleX: 1, scaleY: 1.15, opacity: 1 } } },
      // 充分伸展：嘴大张（哈欠）
      { time: 1000, parts: { body: { x: 0, y: -8,  rotation: 0, scaleX: 0.85, scaleY: 1.18, opacity: 1 }, head: { x: 0, y: -5,  rotation: -10, scaleX: 1,   scaleY: 1,    opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 0.1,  opacity: 1 }, mouth: { x: 0, y: 3, rotation: 0, scaleX: 1.8, scaleY: 1.8, opacity: 1 }, tail: { x: -18, y: -5, rotation: -5,  scaleX: 1, scaleY: 1.2,  opacity: 1 } } },
      // 开始回落，嘴慢慢合上
      { time: 1800, parts: { body: { x: 0, y: -3,  rotation: 0, scaleX: 0.96, scaleY: 1.05, opacity: 1 }, head: { x: 0, y: -2,  rotation: -3, scaleX: 1,    scaleY: 1,    opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 0.7,  opacity: 1 }, mouth: { x: 0, y: 1, rotation: 0, scaleX: 1.1, scaleY: 1.1, opacity: 1 }, tail: { x: -18, y: -2, rotation: -16, scaleX: 1, scaleY: 1.08, opacity: 1 } } },
      // 舒适地回正，微微满足
      { time: 2800, parts: { body: { x: 0, y: 0,   rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, head: { x: 0, y: 0,   rotation: 2,  scaleX: 1,    scaleY: 1,    opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1,   scaleY: 1,   opacity: 1 }, tail: { x: -18, y: 0,  rotation: -22, scaleX: 1, scaleY: 1,    opacity: 1 } } },
    ],
  };

  // ── Paw-tap: 原地踏步 + 开心摇尾 ──
  const pawTap: Animation = {
    name: "paw-tap",
    loop: false,
    duration: 1600,
    keyframes: [
      { time: 0,    parts: { body: { x: 0, y: 0,  rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, head: { x: 0, y: 0,  rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1,   scaleY: 1,   opacity: 1 }, tail: { x: -18, y: 0,  rotation: -22, scaleX: 1, scaleY: 1,    opacity: 1 } } },
      { time: 200,  parts: { body: { x: 2, y: -3, rotation: 2, scaleX: 0.98, scaleY: 1.04, opacity: 1 }, head: { x: 2, y: -1, rotation: 3, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1.1, scaleY: 1.1, opacity: 1 }, tail: { x: -18, y: -3, rotation: -8,  scaleX: 1, scaleY: 1.12, opacity: 1 } } },
      { time: 400,  parts: { body: { x: -2, y: 0, rotation: -2, scaleX: 1.02, scaleY: 0.97, opacity: 1 }, head: { x: -2, y: 0, rotation: -3, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1.1, scaleY: 1.1, opacity: 1 }, tail: { x: -18, y: -1, rotation: -36, scaleX: 1, scaleY: 1,    opacity: 1 } } },
      { time: 700,  parts: { body: { x: 2, y: -3, rotation: 2, scaleX: 0.97, scaleY: 1.05, opacity: 1 }, head: { x: 2, y: -1, rotation: 3, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1.1, scaleY: 1.1, opacity: 1 }, tail: { x: -18, y: -3, rotation: -8,  scaleX: 1, scaleY: 1.12, opacity: 1 } } },
      { time: 900,  parts: { body: { x: -2, y: 0, rotation: -2, scaleX: 1.02, scaleY: 0.97, opacity: 1 }, head: { x: -2, y: 0, rotation: -3, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1.1, scaleY: 1.1, opacity: 1 }, tail: { x: -18, y: -1, rotation: -36, scaleX: 1, scaleY: 1,    opacity: 1 } } },
      { time: 1600, parts: { body: { x: 0, y: 0,  rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, head: { x: 0, y: 0,  rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1,   scaleY: 1,   opacity: 1 }, tail: { x: -18, y: 0,  rotation: -22, scaleX: 1, scaleY: 1,    opacity: 1 } } },
    ],
  };

  // ── Typing: 专注打字，节奏感更强，尾巴随节拍摆动 ──
  const typing: Animation = {
    name: "typing",
    loop: true,
    duration: 500,
    keyframes: [
      { time: 0,   parts: { body: { x: 0, y: -1, rotation: -1, scaleX: 1,    scaleY: 1,    opacity: 1 }, head: { x: 0, y: 0,  rotation: -6, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 0.85, scaleY: 0.92, opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, tail: { x: -18, y: 0, rotation: -18, scaleX: 1, scaleY: 1,   opacity: 1 } } },
      { time: 125, parts: { body: { x: 0, y: 2,  rotation: 1,  scaleX: 1,    scaleY: 1,    opacity: 1 }, head: { x: 0, y: 1,  rotation: -3, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 0.8,  scaleY: 0.9,  opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, tail: { x: -18, y: 0, rotation: -32, scaleX: 1, scaleY: 1,   opacity: 1 } } },
      { time: 250, parts: { body: { x: 0, y: -2, rotation: -1, scaleX: 1,    scaleY: 1,    opacity: 1 }, head: { x: 0, y: -1, rotation: -7, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 0.88, scaleY: 0.93, opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, tail: { x: -18, y: 0, rotation: -18, scaleX: 1, scaleY: 1,   opacity: 1 } } },
      { time: 375, parts: { body: { x: 0, y: 1,  rotation: 1,  scaleX: 1,    scaleY: 1,    opacity: 1 }, head: { x: 0, y: 0,  rotation: -4, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 0.8,  scaleY: 0.9,  opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, tail: { x: -18, y: 0, rotation: -32, scaleX: 1, scaleY: 1,   opacity: 1 } } },
      { time: 500, parts: { body: { x: 0, y: -1, rotation: -1, scaleX: 1,    scaleY: 1,    opacity: 1 }, head: { x: 0, y: 0,  rotation: -6, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 0.85, scaleY: 0.92, opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, tail: { x: -18, y: 0, rotation: -18, scaleX: 1, scaleY: 1,   opacity: 1 } } },
    ],
  };

  // ── Talking: 说话时更生动，全身参与 ──
  const talking: Animation = {
    name: "talking",
    loop: true,
    duration: 420,
    keyframes: [
      { time: 0,   parts: { body: { x: 0, y: 0,  rotation: 0,  scaleX: 1,    scaleY: 1,    opacity: 1 }, head: { x: 1, y: -1, rotation: 7,  scaleX: 1,    scaleY: 1,    opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1.05, opacity: 1 }, mouth: { x: 0, y: 2, rotation: 0, scaleX: 1, scaleY: 1.7, opacity: 1 }, tail: { x: -18, y: -1, rotation: -14, scaleX: 1, scaleY: 1.06, opacity: 1 } } },
      { time: 105, parts: { body: { x: 0, y: 0,  rotation: 0,  scaleX: 1,    scaleY: 1,    opacity: 1 }, head: { x: -1, y: 0, rotation: -5, scaleX: 1,    scaleY: 1,    opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 0.6, opacity: 1 }, tail: { x: -18, y: -1, rotation: -30, scaleX: 1, scaleY: 1.06, opacity: 1 } } },
      { time: 210, parts: { body: { x: 0, y: -1, rotation: 0,  scaleX: 0.99, scaleY: 1.02, opacity: 1 }, head: { x: 1, y: -1, rotation: 8,  scaleX: 1,    scaleY: 1,    opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1.05, opacity: 1 }, mouth: { x: 0, y: 2, rotation: 0, scaleX: 1, scaleY: 1.7, opacity: 1 }, tail: { x: -18, y: -1, rotation: -14, scaleX: 1, scaleY: 1.06, opacity: 1 } } },
      { time: 315, parts: { body: { x: 0, y: 0,  rotation: 0,  scaleX: 1,    scaleY: 1,    opacity: 1 }, head: { x: -1, y: 0, rotation: -4, scaleX: 1,    scaleY: 1,    opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 0.6, opacity: 1 }, tail: { x: -18, y: -1, rotation: -30, scaleX: 1, scaleY: 1.06, opacity: 1 } } },
      { time: 420, parts: { body: { x: 0, y: 0,  rotation: 0,  scaleX: 1,    scaleY: 1,    opacity: 1 }, head: { x: 1, y: -1, rotation: 7,  scaleX: 1,    scaleY: 1,    opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1.05, opacity: 1 }, mouth: { x: 0, y: 2, rotation: 0, scaleX: 1, scaleY: 1.7, opacity: 1 }, tail: { x: -18, y: -1, rotation: -14, scaleX: 1, scaleY: 1.06, opacity: 1 } } },
    ],
  };

  // ── Happy: 欢快弹跳 + 尾巴疯狂摇摆 + 全身扭动 ──
  const happy: Animation = {
    name: "happy",
    loop: true,
    duration: 700,
    keyframes: [
      // 落地：压缩蓄力
      { time: 0,   parts: { body: { x: 0, y: 2,   rotation: 0,  scaleX: 1.1,  scaleY: 0.88, opacity: 1 }, head: { x: 0, y: 1,   rotation: 0,  scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1.3, scaleY: 1.3, opacity: 1 }, tail: { x: -18, y: 1,  rotation: -40, scaleX: 1, scaleY: 0.95, opacity: 1 } } },
      // 起跳：身体拉伸腾空
      { time: 175, parts: { body: { x: 0, y: -22, rotation: -5, scaleX: 0.88, scaleY: 1.14, opacity: 1 }, head: { x: 0, y: -6,  rotation: 6,  scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: -2, rotation: 0, scaleX: 1.1, scaleY: 1.2,  opacity: 1 }, mouth: { x: 0, y: -2, rotation: 0, scaleX: 1.5, scaleY: 1.5, opacity: 1 }, tail: { x: -18, y: -8, rotation: -4,  scaleX: 1, scaleY: 1.2,  opacity: 1 } } },
      // 最高点：自由感
      { time: 350, parts: { body: { x: 0, y: -18, rotation: 4,  scaleX: 0.92, scaleY: 1.1,  opacity: 1 }, head: { x: 0, y: -5,  rotation: -5, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: -1, rotation: 0, scaleX: 1.05, scaleY: 1.15, opacity: 1 }, mouth: { x: 0, y: -1, rotation: 0, scaleX: 1.4, scaleY: 1.4, opacity: 1 }, tail: { x: -18, y: -5, rotation: -48, scaleX: 1, scaleY: 1.1,  opacity: 1 } } },
      // 下落：身体略偏
      { time: 525, parts: { body: { x: 0, y: -8,  rotation: -3, scaleX: 0.97, scaleY: 1.04, opacity: 1 }, head: { x: 0, y: -3,  rotation: 4,  scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1.05, opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1.3, scaleY: 1.3, opacity: 1 }, tail: { x: -18, y: -3, rotation: -12, scaleX: 1, scaleY: 1.06, opacity: 1 } } },
      // 再次压缩落地
      { time: 700, parts: { body: { x: 0, y: 2,   rotation: 0,  scaleX: 1.1,  scaleY: 0.88, opacity: 1 }, head: { x: 0, y: 1,   rotation: 0,  scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1.3, scaleY: 1.3, opacity: 1 }, tail: { x: -18, y: 1,  rotation: -40, scaleX: 1, scaleY: 0.95, opacity: 1 } } },
    ],
  };

  // ── Pet-click: 被点击，撒娇弹起 ──
  const petClick: Animation = {
    name: "pet-click",
    loop: false,
    duration: 900,
    keyframes: [
      { time: 0,   parts: { body: { x: 0, y: 0,   rotation: 0,  scaleX: 1,    scaleY: 1,    opacity: 1 }, head: { x: 0, y: 0,   rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1,   scaleY: 1,   opacity: 1 }, tail: { x: -18, y: 0,  rotation: -22, scaleX: 1, scaleY: 1,    opacity: 1 } } },
      // 惊喜：压缩
      { time: 80,  parts: { body: { x: 0, y: 4,   rotation: 0,  scaleX: 1.15, scaleY: 0.82, opacity: 1 }, head: { x: 0, y: 2,   rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1.2,  scaleY: 1.3,  opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1.2, scaleY: 1.2, opacity: 1 }, tail: { x: -18, y: 2,  rotation: -50, scaleX: 1, scaleY: 0.9,  opacity: 1 } } },
      // 弹起
      { time: 250, parts: { body: { x: 0, y: -18, rotation: -4, scaleX: 0.9,  scaleY: 1.12, opacity: 1 }, head: { x: 0, y: -5,  rotation: 6, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: -2, rotation: 0, scaleX: 1.15, scaleY: 1.2,  opacity: 1 }, mouth: { x: 0, y: -2, rotation: 0, scaleX: 1.5, scaleY: 1.5, opacity: 1 }, tail: { x: -18, y: -7, rotation: -2,  scaleX: 1, scaleY: 1.22, opacity: 1 } } },
      // 下落
      { time: 550, parts: { body: { x: 0, y: -5,  rotation: 3,  scaleX: 0.96, scaleY: 1.05, opacity: 1 }, head: { x: 0, y: -2,  rotation: -3, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1.1,  opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1.2, scaleY: 1.2, opacity: 1 }, tail: { x: -18, y: -2, rotation: -36, scaleX: 1, scaleY: 1.08, opacity: 1 } } },
      // 落地回弹
      { time: 750, parts: { body: { x: 0, y: 2,   rotation: 0,  scaleX: 1.08, scaleY: 0.9,  opacity: 1 }, head: { x: 0, y: 1,   rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1.1, scaleY: 1.1, opacity: 1 }, tail: { x: -18, y: 1,  rotation: -48, scaleX: 1, scaleY: 0.92, opacity: 1 } } },
      { time: 900, parts: { body: { x: 0, y: 0,   rotation: 0,  scaleX: 1,    scaleY: 1,    opacity: 1 }, head: { x: 0, y: 0,   rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,    scaleY: 1,    opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1,   scaleY: 1,   opacity: 1 }, tail: { x: -18, y: 0,  rotation: -22, scaleX: 1, scaleY: 1,    opacity: 1 } } },
    ],
  };

  // ── Crushing: 激烈摇晃 → 被压扁 ──
  const crushing: Animation = {
    name: "crushing",
    loop: false,
    duration: 1000,
    keyframes: [
      { time: 0,    parts: { body: { x: 0, y: 0, rotation: 0,   scaleX: 1,   scaleY: 1,    opacity: 1 }, head: { x: 0, y: 0,  rotation: 0,   scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,   scaleY: 1,    opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1,   scaleY: 1,   opacity: 1 }, tail: { x: -18, y: 0, rotation: -25, scaleX: 1, scaleY: 1, opacity: 1 } } },
      { time: 70,   parts: { body: { x: 9, y: 0, rotation: 9,   scaleX: 1,   scaleY: 1,    opacity: 1 }, head: { x: 11, y: 0, rotation: 14,  scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1.6, scaleY: 0.5,  opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1,   scaleY: 1,   opacity: 1 }, tail: { x: -18, y: 0, rotation: -25, scaleX: 1, scaleY: 1, opacity: 1 } } },
      { time: 140,  parts: { body: { x: -9, y: 0, rotation: -9, scaleX: 1,   scaleY: 1,    opacity: 1 }, head: { x: -11, y: 0, rotation: -14, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1.6, scaleY: 0.5,  opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1,   scaleY: 1,   opacity: 1 }, tail: { x: -18, y: 0, rotation: -25, scaleX: 1, scaleY: 1, opacity: 1 } } },
      { time: 210,  parts: { body: { x: 8, y: 0, rotation: 7,   scaleX: 1,   scaleY: 1,    opacity: 1 }, head: { x: 9, y: 0,  rotation: 11,  scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1.6, scaleY: 0.5,  opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1,   scaleY: 1,   opacity: 1 }, tail: { x: -18, y: 0, rotation: -25, scaleX: 1, scaleY: 1, opacity: 1 } } },
      { time: 280,  parts: { body: { x: -8, y: 0, rotation: -7, scaleX: 1,   scaleY: 1,    opacity: 1 }, head: { x: -9, y: 0, rotation: -11, scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1.6, scaleY: 0.5,  opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1,   scaleY: 1,   opacity: 1 }, tail: { x: -18, y: 0, rotation: -25, scaleX: 1, scaleY: 1, opacity: 1 } } },
      { time: 350,  parts: { body: { x: 5, y: 0, rotation: 5,   scaleX: 1,   scaleY: 1,    opacity: 1 }, head: { x: 6, y: 0,  rotation: 7,   scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1.5, scaleY: 0.5,  opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1,   scaleY: 1,   opacity: 1 }, tail: { x: -18, y: 0, rotation: -25, scaleX: 1, scaleY: 1, opacity: 1 } } },
      { time: 500,  parts: { body: { x: 0, y: 5, rotation: 0,   scaleX: 1.2, scaleY: 0.7,  opacity: 1 }, head: { x: 0, y: 3,  rotation: 0,   scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 0.1, scaleY: 0.1,  opacity: 0.5 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 0.3, scaleY: 0.3, opacity: 0.5 }, tail: { x: -16, y: 3, rotation: -15, scaleX: 0.9, scaleY: 0.8, opacity: 0.8 } } },
      { time: 800,  parts: { body: { x: 0, y: 3, rotation: 0,   scaleX: 1.1, scaleY: 0.85, opacity: 1 }, head: { x: 0, y: 2,  rotation: 0,   scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 0.5, scaleY: 0.5,  opacity: 0.7 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 0.7, scaleY: 0.7, opacity: 0.7 }, tail: { x: -17, y: 2, rotation: -20, scaleX: 0.95, scaleY: 0.9, opacity: 0.9 } } },
      { time: 1000, parts: { body: { x: 0, y: 0, rotation: 0,   scaleX: 1,   scaleY: 1,    opacity: 1 }, head: { x: 0, y: 0,  rotation: 0,   scaleX: 1, scaleY: 1, opacity: 1 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 1,   scaleY: 1,    opacity: 1 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 1,   scaleY: 1,   opacity: 1 }, tail: { x: -18, y: 0, rotation: -25, scaleX: 1, scaleY: 1, opacity: 1 } } },
    ],
  };

  // ── Collapsed: 精疲力竭，趴倒，缓慢微喘 ──
  const collapsed: Animation = {
    name: "collapsed",
    loop: true,
    duration: 4000,
    keyframes: [
      { time: 0,    parts: { body: { x: 0, y: 5, rotation: 90, scaleX: 1,    scaleY: 0.5,  opacity: 0.7 }, head: { x: 0, y: 8, rotation: 90, scaleX: 1, scaleY: 0.6, opacity: 0.7 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 0.3, scaleY: 0.3, opacity: 0.5 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 0.3, scaleY: 0.2, opacity: 0.5 }, tail: { x: -14, y: 4, rotation: -10, scaleX: 0.8, scaleY: 0.6, opacity: 0.5 } } },
      { time: 2000, parts: { body: { x: 0, y: 4, rotation: 92, scaleX: 1.05, scaleY: 0.55, opacity: 0.75 }, head: { x: 0, y: 7, rotation: 92, scaleX: 1, scaleY: 0.65, opacity: 0.75 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 0.3, scaleY: 0.3, opacity: 0.5 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 0.3, scaleY: 0.2, opacity: 0.5 }, tail: { x: -14, y: 3, rotation: -8, scaleX: 0.85, scaleY: 0.65, opacity: 0.55 } } },
      { time: 4000, parts: { body: { x: 0, y: 5, rotation: 90, scaleX: 1,    scaleY: 0.5,  opacity: 0.7 }, head: { x: 0, y: 8, rotation: 90, scaleX: 1, scaleY: 0.6, opacity: 0.7 }, eyes: { x: 0, y: 0, rotation: 0, scaleX: 0.3, scaleY: 0.3, opacity: 0.5 }, mouth: { x: 0, y: 0, rotation: 0, scaleX: 0.3, scaleY: 0.2, opacity: 0.5 }, tail: { x: -14, y: 4, rotation: -10, scaleX: 0.8, scaleY: 0.6, opacity: 0.5 } } },
    ],
  };

  // ── Lying: 慵懒趴卧，做梦般微晃 ──
  const lying: Animation = {
    name: "lying",
    loop: true,
    duration: 5000,
    keyframes: [
      { time: 0,    parts: { body: { x: 0, y: 25, rotation: 0, scaleX: 1,    scaleY: 0.65, opacity: 1 }, head: { x: 18, y: 15, rotation: -28, scaleX: 0.9, scaleY: 0.9, opacity: 1 }, eyes: { x: 20, y: 15, rotation: -28, scaleX: 0.85, scaleY: 0.85, opacity: 1 }, mouth: { x: 18, y: 18, rotation: -28, scaleX: 0.85, scaleY: 0.85, opacity: 1 }, tail: { x: -26, y: 2, rotation: -45, scaleX: 1, scaleY: 1,    opacity: 1 } } },
      // 微微呼吸起伏
      { time: 1500, parts: { body: { x: 0, y: 24, rotation: 0, scaleX: 1.01, scaleY: 0.67, opacity: 1 }, head: { x: 18, y: 15, rotation: -27, scaleX: 0.9, scaleY: 0.9, opacity: 1 }, eyes: { x: 20, y: 15, rotation: -27, scaleX: 0.85, scaleY: 0.85, opacity: 1 }, mouth: { x: 18, y: 18, rotation: -27, scaleX: 0.85, scaleY: 0.85, opacity: 1 }, tail: { x: -26, y: 1, rotation: -42, scaleX: 1, scaleY: 1.06, opacity: 1 } } },
      // 尾巴轻轻一甩（做梦反应）
      { time: 3000, parts: { body: { x: 0, y: 25, rotation: 0, scaleX: 1,    scaleY: 0.65, opacity: 1 }, head: { x: 18, y: 15, rotation: -28, scaleX: 0.9, scaleY: 0.9, opacity: 1 }, eyes: { x: 20, y: 15, rotation: -28, scaleX: 0.85, scaleY: 0.85, opacity: 1 }, mouth: { x: 18, y: 18, rotation: -28, scaleX: 0.85, scaleY: 0.85, opacity: 1 }, tail: { x: -26, y: 2, rotation: -55, scaleX: 1, scaleY: 1.1,  opacity: 1 } } },
      { time: 3800, parts: { body: { x: 0, y: 25, rotation: 0, scaleX: 1,    scaleY: 0.65, opacity: 1 }, head: { x: 18, y: 15, rotation: -28, scaleX: 0.9, scaleY: 0.9, opacity: 1 }, eyes: { x: 20, y: 15, rotation: -28, scaleX: 0.85, scaleY: 0.85, opacity: 1 }, mouth: { x: 18, y: 18, rotation: -28, scaleX: 0.85, scaleY: 0.85, opacity: 1 }, tail: { x: -26, y: 2, rotation: -38, scaleX: 1, scaleY: 1,    opacity: 1 } } },
      { time: 5000, parts: { body: { x: 0, y: 25, rotation: 0, scaleX: 1,    scaleY: 0.65, opacity: 1 }, head: { x: 18, y: 15, rotation: -28, scaleX: 0.9, scaleY: 0.9, opacity: 1 }, eyes: { x: 20, y: 15, rotation: -28, scaleX: 0.85, scaleY: 0.85, opacity: 1 }, mouth: { x: 18, y: 18, rotation: -28, scaleX: 0.85, scaleY: 0.85, opacity: 1 }, tail: { x: -26, y: 2, rotation: -45, scaleX: 1, scaleY: 1,    opacity: 1 } } },
    ],
  };

  player.register(idle);
  player.register(lookAround);
  player.register(stretch);
  player.register(pawTap);
  player.register(typing);
  player.register(talking);
  player.register(happy);
  player.register(petClick);
  player.register(crushing);
  player.register(collapsed);
  player.register(lying);
}
