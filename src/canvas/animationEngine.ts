import type { Animation, Keyframe, PartName, PartState } from "../types";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpPartState(a: PartState, b: PartState, t: number): PartState {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    rotation: lerp(a.rotation, b.rotation, t),
    scaleX: lerp(a.scaleX, b.scaleX, t),
    scaleY: lerp(a.scaleY, b.scaleY, t),
    opacity: lerp(a.opacity, b.opacity, t),
  };
}

const DEFAULT_STATE: PartState = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1 };

function getKeyframeParts(kf: Keyframe): Record<PartName, PartState> {
  const all: Record<string, PartState> = {};
  for (const name of ["body", "head", "eyes", "mouth", "tail"] as PartName[]) {
    all[name] = kf.parts[name] ?? DEFAULT_STATE;
  }
  return all as Record<PartName, PartState>;
}

export class AnimationPlayer {
  private animations: Map<string, Animation> = new Map();
  private currentAnim: Animation | null = null;
  private elapsed: number = 0;
  private transitioning: boolean = false;
  private fromStates: Record<PartName, PartState> | null = null;
  private transitionDuration: number = 200;
  private transitionElapsed: number = 0;
  paused: boolean = false;

  // Blink state
  private blinkState: "open" | "closing" | "opening" = "open";
  private blinkPhaseTimer: number = 1000 + Math.random() * 2000;
  /** Multiplier for eye scaleY: 1 = open, ~0.05 = closed */
  blinkScale: number = 1;

  register(anim: Animation) {
    this.animations.set(anim.name, anim);
  }

  play(name: string) {
    const anim = this.animations.get(name);
    if (!anim || anim === this.currentAnim) return;
    if (this.currentAnim && this.fromStates === null) {
      this.fromStates = this.getCurrentPartStates();
      this.transitioning = true;
      this.transitionElapsed = 0;
    }
    this.currentAnim = anim;
    this.elapsed = 0;
  }

  private updateBlink(dt: number) {
    switch (this.blinkState) {
      case "open": {
        this.blinkPhaseTimer -= dt;
        if (this.blinkPhaseTimer <= 0) {
          this.blinkState = "closing";
          this.blinkPhaseTimer = 40;
        }
        break;
      }
      case "closing": {
        this.blinkPhaseTimer -= dt;
        this.blinkScale = Math.max(0.05, this.blinkPhaseTimer / 40);
        if (this.blinkPhaseTimer <= 0) {
          this.blinkState = "opening";
          this.blinkPhaseTimer = 60;
        }
        break;
      }
      case "opening": {
        this.blinkPhaseTimer -= dt;
        this.blinkScale = 1 - (this.blinkPhaseTimer / 60) * 0.95;
        if (this.blinkPhaseTimer <= 0) {
          this.blinkState = "open";
          this.blinkScale = 1;
          this.blinkPhaseTimer = 2000 + Math.random() * 3000;
        }
        break;
      }
    }
  }

  getCurrentPartStates(): Record<PartName, PartState> {
    if (!this.currentAnim) {
      const result = {} as Record<PartName, PartState>;
      for (const name of ["body", "head", "eyes", "mouth", "tail"] as PartName[]) {
        result[name] = { ...DEFAULT_STATE };
      }
      return result;
    }

    const t = this.currentAnim.loop
      ? (this.elapsed % this.currentAnim.duration) / this.currentAnim.duration
      : Math.min(this.elapsed / this.currentAnim.duration, 1);

    return this.interpolate(t);
  }

  private interpolate(t: number): Record<PartName, PartState> {
    if (!this.currentAnim || this.currentAnim.keyframes.length === 0) {
      return {} as Record<PartName, PartState>;
    }

    const kfs = this.currentAnim.keyframes;
    if (kfs.length === 1) return getKeyframeParts(kfs[0]);

    const totalTime = this.currentAnim.duration;
    const scaledT = t * totalTime;

    let aKf = kfs[0];
    let bKf = kfs[kfs.length - 1];
    for (let i = 0; i < kfs.length - 1; i++) {
      if (scaledT >= kfs[i].time && scaledT < kfs[i + 1].time) {
        aKf = kfs[i];
        bKf = kfs[i + 1];
        break;
      }
    }

    const range = bKf.time - aKf.time;
    const localT = range > 0 ? (scaledT - aKf.time) / range : 0;

    const aParts = getKeyframeParts(aKf);
    const bParts = getKeyframeParts(bKf);

    const result = {} as Record<PartName, PartState>;
    for (const name of ["body", "head", "eyes", "mouth", "tail"] as PartName[]) {
      result[name] = lerpPartState(aParts[name], bParts[name], localT);
    }
    return result;
  }

  advance(dt: number): Record<PartName, PartState> | null {
    if (this.paused || !this.currentAnim) return null;

    // Update blink timer
    this.updateBlink(dt);

    // Handle transition — advance elapsed so there's no 200ms freeze
    if (this.transitioning && this.fromStates) {
      this.transitionElapsed += dt;
      this.elapsed += dt; // <-- fix: advance elapsed during transition
      const t = Math.min(this.transitionElapsed / this.transitionDuration, 1);
      const targetStates = this.getCurrentPartStates();

      if (t >= 1) {
        this.transitioning = false;
        this.fromStates = null;
        return targetStates;
      }

      const result = {} as Record<PartName, PartState>;
      for (const name of ["body", "head", "eyes", "mouth", "tail"] as PartName[]) {
        result[name] = lerpPartState(this.fromStates[name], targetStates[name], t);
      }
      return result;
    }

    this.elapsed += dt;
    return this.getCurrentPartStates();
  }

  reset() {
    this.currentAnim = null;
    this.elapsed = 0;
    this.transitioning = false;
    this.fromStates = null;
  }
}
