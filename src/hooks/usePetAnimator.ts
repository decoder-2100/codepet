import { useEffect, useRef } from "react";
import { usePetStore } from "../stores/petStore";
import { AnimationPlayer } from "../canvas/animationEngine";
import { registerAnimations } from "../canvas/animations";
import { drawFrame } from "../canvas/renderer";

// 宠物随机自言自语短语库
const IDLE_WHISPERS = [
  "今天天气不错呢～",
  "摸鱼 ing... (｡･ω･｡)",
  "该喝水了哦！",
  "好困啊... zzz",
  "代码写完了没？",
  "要加油哦！(ง •_•)ง",
  "我在看着你哦 (¬‿¬)",
  "需要休息一下吗？",
  "今天也要开心～",
  "你可以的！加油！",
  "有没有 bug 要我帮忙？",
  "背部挺直了吗？",
  "记得眨眼睛哦！",
  "(咬着尾巴转圈圈~)",
  "呼噜呼噜... ฅ^•ﻌ•^ฅ",
  "噫，有什么奇怪的味道",
  "肚子饿了呢...",
  "伸个懒腰！",
];

// idle 子行为：动画名 + 持续后回到 idle 的延迟
const IDLE_SUB_BEHAVIORS: { anim: string; duration: number; whisper?: boolean }[] = [
  { anim: "look-around", duration: 2500 },
  { anim: "stretch",     duration: 3000, whisper: true },
  { anim: "paw-tap",     duration: 1800, whisper: true },
  { anim: "happy",       duration: 900 },
];

export function usePetAnimator(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const playerRef = useRef<AnimationPlayer | null>(null);
  const rafRef = useRef<number>(0);
  const idleActionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const logicalW = canvas.width / dpr;
    const logicalH = canvas.height / dpr;

    const player = new AnimationPlayer();
    registerAnimations(player);
    player.play(usePetStore.getState().currentAnim);
    playerRef.current = player;

    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;

      const state = usePetStore.getState();
      drawFrame(ctx, player, state.petConfig.parts, state.petConfig.colors, dt, logicalW, logicalH);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    // Subscribe to animation triggers
    const unsub = usePetStore.subscribe((state, prev) => {
      if (state.currentAnim !== prev.currentAnim) {
        player.play(state.currentAnim);
      }
    });

    // 随机 idle 子行为调度，8～20 秒触发一次
    function scheduleNextIdleAction() {
      const delay = 8000 + Math.random() * 12000;
      idleActionTimerRef.current = setTimeout(() => {
        const state = usePetStore.getState();

        if (state.pose === "idle") {
          // 随机选择一个子行为
          const behavior = IDLE_SUB_BEHAVIORS[Math.floor(Math.random() * IDLE_SUB_BEHAVIORS.length)];

          state.setAnim(behavior.anim);

          // 如果该行为触发自言自语（30% 概率额外随机）
          if (behavior.whisper || Math.random() < 0.3) {
            const whisper = IDLE_WHISPERS[Math.floor(Math.random() * IDLE_WHISPERS.length)];
            setTimeout(() => state.showBubble(whisper, 2200), 300);
          }

          // 子行为结束后回到 idle
          setTimeout(() => {
            const cur = usePetStore.getState();
            if (cur.currentAnim === behavior.anim) {
              cur.setAnim("idle");
              cur.setPose("idle");
            }
          }, behavior.duration);

        } else if (state.pose === "lying") {
          // 趴着时偶尔用尾巴甩一甩（动画内部已有，这里只触发自言自语）
          if (Math.random() < 0.4) {
            const whisper = IDLE_WHISPERS[Math.floor(Math.random() * IDLE_WHISPERS.length)];
            state.showBubble(whisper, 2000);
          }
        }

        scheduleNextIdleAction();
      }, delay);
    }

    scheduleNextIdleAction();

    return () => {
      cancelAnimationFrame(rafRef.current);
      unsub();
      if (idleActionTimerRef.current) clearTimeout(idleActionTimerRef.current);
    };
  }, [canvasRef]);
}
