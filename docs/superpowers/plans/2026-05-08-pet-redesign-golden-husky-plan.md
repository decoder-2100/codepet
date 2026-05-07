# Pet Redesign: 金毛 + 哈士奇 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Bug Bot and Meowtrix presets with Golden Retriever (金毛) and Husky (哈士奇) canvas 2D renderings.

**Architecture:** Add 5 new part variant draw functions across the 5 part files (body, head, eyes, mouth, tail), update the 2 preset configs in petPresets.ts, and update the existing test assertions that enumerate variant counts. No animation keyframe changes — new shapes respond naturally to existing transforms.

**Tech Stack:** Canvas 2D rendering, TypeScript, Vitest tests, existing AnimationPlayer system.

---

### Task 1: Add `golden` and `husky` body variants to body.ts

**Files:**
- Modify: `src/canvas/parts/body.ts:138` (add after `robot` variant, before helper functions)

- [ ] **Step 1: Add `golden` body variant**

The golden retriever body is an elongated ellipse with a chest fur highlight:

```typescript
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
```

- [ ] **Step 2: Add `husky` body variant**

The husky body is a slightly more compact ellipse with grey-to-white gradient and a white chest mane:

```typescript
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
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS (no type errors)

- [ ] **Step 4: Commit**

```bash
git add src/canvas/parts/body.ts
git commit -m "feat: add golden and husky body variants"
```

---

### Task 2: Add `golden` and `husky` head variants to head.ts

**Files:**
- Modify: `src/canvas/parts/head.ts:220` (add after `fox` variant, before helper functions)

- [ ] **Step 1: Add `golden` head variant**

Floppy ears (elongated ovals hanging down from the sides), cream muzzle, dark brown nose:

```typescript
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
```

- [ ] **Step 2: Add `husky` head variant**

Pointed upright triangular ears with pink inner ear, white muzzle, black nose, grey mask patches around eyes:

```typescript
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
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/canvas/parts/head.ts
git commit -m "feat: add golden and husky head variants"
```

---

### Task 3: Add `warm` and `blue` eye variants to eyes.ts

**Files:**
- Modify: `src/canvas/parts/eyes.ts:177` (add after `dead` variant)

- [ ] **Step 1: Add `warm` eye variant**

Warm brown eyes, slightly almond-shaped, wider-set for friendly expression:

```typescript
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
```

- [ ] **Step 2: Add `blue` eye variant**

Striking blue husky eyes, almond-shaped with intense gaze:

```typescript
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
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/canvas/parts/eyes.ts
git commit -m "feat: add warm and blue eye variants"
```

---

### Task 4: Add `happy-smile` and `smirk` mouth variants to mouth.ts

**Files:**
- Modify: `src/canvas/parts/mouth.ts:85` (add after `grin` variant)

- [ ] **Step 1: Add `happy-smile` mouth variant**

Wider smile arc with a small pink tongue peeking out:

```typescript
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
```

- [ ] **Step 2: Add `smirk` mouth variant**

Asymmetric arc (wider on the right side) for mischievous husky expression:

```typescript
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
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/canvas/parts/mouth.ts
git commit -m "feat: add happy-smile and smirk mouth variants"
```

---

### Task 5: Add `golden-tail` and `curled-tail` tail variants to tail.ts

**Files:**
- Modify: `src/canvas/parts/tail.ts:157` (add after `fox` variant)

- [ ] **Step 1: Add `golden-tail` variant**

Thick bushy S-curve bezier, wider stroke (9px), golden gradient with lighter tip:

```typescript
"golden-tail": (ctx, s, c) => {
  ctx.save();
  ctx.translate(75 + s.x, 118 + s.y);
  ctx.rotate((s.rotation * Math.PI) / 180);
  ctx.scale(s.scaleX, s.scaleY);
  ctx.globalAlpha = s.opacity;

  // Thick bushy S-curve
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.quadraticCurveTo(-28, -10, -24, -38);
  ctx.quadraticCurveTo(-22, -52, -14, -46);
  ctx.strokeStyle = c.primary;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.stroke();

  // Lighter tip highlight
  ctx.beginPath();
  ctx.moveTo(-20, -36);
  ctx.quadraticCurveTo(-18, -48, -14, -46);
  ctx.strokeStyle = lighten(c.primary, 35);
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.restore();
},
```

- [ ] **Step 2: Add `curled-tail` variant**

Thick bezier arc curling upward over the back, grey-white gradient, bushy:

```typescript
"curled-tail": (ctx, s, c) => {
  ctx.save();
  ctx.translate(75 + s.x, 118 + s.y);
  ctx.rotate((s.rotation * Math.PI) / 180);
  ctx.scale(s.scaleX, s.scaleY);
  ctx.globalAlpha = s.opacity;

  // Curled upward tail (husky characteristic)
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.quadraticCurveTo(-30, -12, -32, -36);
  ctx.quadraticCurveTo(-34, -50, -20, -48);
  ctx.strokeStyle = c.primary;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.stroke();

  // White/light tip
  ctx.beginPath();
  ctx.moveTo(-28, -34);
  ctx.quadraticCurveTo(-26, -48, -20, -48);
  ctx.strokeStyle = c.secondary;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.restore();
},
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/canvas/parts/tail.ts
git commit -m "feat: add golden-tail and curled-tail variants"
```

---

### Task 6: Update pet presets in petPresets.ts

**Files:**
- Modify: `src/data/petPresets.ts:27-32` (replace bug-bot preset)
- Modify: `src/data/petPresets.ts:50-57` (replace meowtrix preset)

- [ ] **Step 1: Replace "bug-bot" preset with "golden"**

Replace the entire bug-bot object (lines 27-32) with:

```typescript
{
  name: "golden",
  label: "金毛 Golden Retriever",
  config: {
    parts: { body: "golden", head: "golden", eyes: "warm", mouth: "happy-smile", tail: "golden-tail", accessories: ["bowtie"] },
    colors: { primary: "#D4A050", secondary: "#E8C880", eye: "#5C3A1E", accessory: "#8B6914" },
  },
},
```

- [ ] **Step 2: Replace "meowtrix" preset with "husky"**

Replace the entire meowtrix object (lines 50-57) with:

```typescript
{
  name: "husky",
  label: "哈士奇 Husky",
  config: {
    parts: { body: "husky", head: "husky", eyes: "blue", mouth: "smirk", tail: "curled-tail", accessories: ["scarf"] },
    colors: { primary: "#B0B8C0", secondary: "#F0F0F4", eye: "#4A90D9", accessory: "#5C6B7A" },
  },
},
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/data/petPresets.ts
git commit -m "feat: replace bug-bot and meowtrix presets with golden and husky"
```

---

### Task 7: Update test assertions for new variant counts

**Files:**
- Modify: `src/__tests__/f1_comprehensive.test.ts:28-30` (body variant count)
- Modify: `src/__tests__/f1_comprehensive.test.ts:40-48` (head variant count)
- Modify: `src/__tests__/f1_comprehensive.test.ts:57-61` (eye variant count)

- [ ] **Step 1: Update body variant assertion (line 29)**

Change:
```typescript
expect(Object.keys(bodyVariants)).toEqual(["chubby", "tall", "round", "robot"]);
```
To:
```typescript
expect(Object.keys(bodyVariants)).toEqual(["chubby", "tall", "round", "robot", "golden", "husky"]);
```

- [ ] **Step 2: Update head variant assertion (lines 40-48)**

Change:
```typescript
const headKeys = Object.keys(headVariants);
expect(headKeys).toContain("cat");
expect(headKeys).toContain("bear");
expect(headKeys).toContain("fox");
expect(headKeys).toContain("robot");
expect(headKeys).toContain("alien");
expect(headKeys.length).toBe(5);
```
To:
```typescript
const headKeys = Object.keys(headVariants);
expect(headKeys).toContain("cat");
expect(headKeys).toContain("bear");
expect(headKeys).toContain("fox");
expect(headKeys).toContain("robot");
expect(headKeys).toContain("alien");
expect(headKeys).toContain("golden");
expect(headKeys).toContain("husky");
expect(headKeys.length).toBe(7);
```

- [ ] **Step 3: Update eye variant assertion (lines 58-61)**

Change:
```typescript
const expected = ["normal", "big", "anime", "dot", "angry", "happy", "closed", "dead"];
expect(Object.keys(eyeVariants)).toEqual(expected);
```
To:
```typescript
const expected = ["normal", "big", "anime", "dot", "angry", "happy", "closed", "dead", "warm", "blue"];
expect(Object.keys(eyeVariants)).toEqual(expected);
```

- [ ] **Step 4: Run all frontend tests**

Run: `npm test`
Expected: ALL PASS (all existing tests pass with updated variant counts)

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/f1_comprehensive.test.ts
git commit -m "test: update variant count assertions for golden and husky"
```

---

### Task 8: Final verification

- [ ] **Step 1: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 2: Run all frontend tests**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 3: Run Rust tests**

Run: `cd src-tauri && cargo test`
Expected: ALL PASS

- [ ] **Step 4: Dev server visual check**

Run: `npm run tauri dev`
Expected: App opens, pet selector shows "金毛 Golden Retriever" and "哈士奇 Husky" instead of BugBot and Meowtrix, rendered pets look correct in the canvas.
