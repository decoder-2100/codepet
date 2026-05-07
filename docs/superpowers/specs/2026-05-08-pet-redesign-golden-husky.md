# Pet Redesign: 金毛 + 哈士奇

## Overview

Replace the Bug Bot and Meowtrix pet presets with a Golden Retriever (金毛) and a Husky (哈士奇), using a semi-realistic art style consistent with existing canvas 2D rendering constraints.

## Goals

- Bug Bot → Golden Retriever: warm golden color, floppy ears, bushy tail, friendly expression
- Meowtrix → Husky: grey-white color, pointed ears, curled tail, striking blue eyes
- All other 4 presets (橘宝, Code Bear, Fox Coder, Alien Hacker) remain unchanged
- Style: semi-realistic proportions (not Q版), but still within the simplified canvas aesthetic

## Part Variant Changes

### Body (src/canvas/parts/body.ts)

| Variant | Shape | Colors | Details |
|---------|-------|--------|---------|
| `golden` | Ellipse rx=30, ry=36 | Primary `#D4A050`, Secondary `#E8C880` | Radial gradient shading, chest fur highlight patch (lighter cream on lower chest) |
| `husky` | Ellipse rx=28, ry=34 | Primary `#B0B8C0`, Secondary `#F0F0F4` | Grey-to-white gradient, white chest "mane" patch extending from neck to mid-chest |

### Head (src/canvas/parts/head.ts)

| Variant | Shape | Colors | Details |
|---------|-------|--------|---------|
| `golden` | Ellipse rx=28, ry=26 | Primary `#D4A050` | Two floppy ears (elongated ovals hanging down), cream muzzle oval (rx=14, ry=10) in `#F0DCC0`, dark brown nose ellipse |
| `husky` | Ellipse rx=26, ry=24 | Primary `#B0B8C0` | Two pointed upright triangular ears with pink inner ear (`#F0C0C0`), white muzzle (`#F0F0F4`), black nose, grey "mask" patches around eyes |

### Eyes (src/canvas/parts/eyes.ts)

| Variant | Shape | Colors | Details |
|---------|-------|--------|---------|
| `warm` | Ellipse rx=5, ry=5.5 | Eye color `#5C3A1E` | Warm brown, slightly almond-shaped, white highlight dot, wider-set eyes for friendly expression |
| `blue` | Ellipse rx=5, ry=5.5 | Eye color `#4A90D9` | Striking blue, almond-shaped, white highlight dot, narrow-able for "cool" expression |

### Mouth (src/canvas/parts/mouth.ts)

| Variant | Shape | Style |
|---------|-------|-------|
| `happy-smile` | Arc r=8, from 0.1 to PI-0.1 | Stroke `#5C3A1E`, line-width 1.8, small pink tongue arc below |
| `smirk` | Asymmetric arc (wider on one side) | Stroke `#5C6B7A`, line-width 1.6, subtle mischievous expression |

### Tail (src/canvas/parts/tail.ts)

| Variant | Shape | Style |
|---------|-------|-------|
| `golden-tail` | Thick bushy S-curve bezier, wider stroke (width 9) | Golden gradient with lighter tip highlight, gentle upward sweep |
| `curled-tail` | Thick bezier arc curling upward over the back | Grey-white gradient, bushy fill, characteristic husky curl |

## Color Palette

| Preset | Primary | Secondary | Eye | Accessory |
|--------|---------|-----------|-----|-----------|
| golden (was bug-bot) | `#D4A050` (warm golden) | `#E8C880` (light cream) | `#5C3A1E` (warm brown) | `#8B6914` (dark gold) |
| husky (was meowtrix) | `#B0B8C0` (grey) | `#F0F0F4` (white) | `#4A90D9` (blue) | `#5C6B7A` (dark grey) |

## Preset Config Updates (src/data/petPresets.ts)

### "golden" preset
```
parts: { body: 'golden', head: 'golden', eyes: 'warm', mouth: 'happy-smile', tail: 'golden-tail', accessories: ['bowtie'] }
colors: { primary: '#D4A050', secondary: '#E8C880', eye: '#5C3A1E', accessory: '#8B6914' }
```

### "husky" preset
```
parts: { body: 'husky', head: 'husky', eyes: 'blue', mouth: 'smirk', tail: 'curled-tail', accessories: ['scarf'] }
colors: { primary: '#B0B8C0', secondary: '#F0F0F4', eye: '#4A90D9', accessory: '#5C6B7A' }
```

## Animation Compatibility

- All existing 11 animation keyframes use scaleX/Y, rotation, and x/y offsets — the new body shapes will respond naturally to these transforms
- The `collapsed` pose (rotated body, reduced scaleY) will still work with the new ellipse shapes
- The `happy` bounce animation will look natural with the floppy/curled tail variants
- No keyframe changes needed

## Files Modified

1. `src/canvas/parts/body.ts` — Add `golden` and `husky` body variants
2. `src/canvas/parts/head.ts` — Add `golden` and `husky` head variants with new ear shapes
3. `src/canvas/parts/eyes.ts` — Add `warm` and `blue` eye variants
4. `src/canvas/parts/mouth.ts` — Add `happy-smile` and `smirk` mouth variants
5. `src/canvas/parts/tail.ts` — Add `golden-tail` and `curled-tail` tail variants
6. `src/data/petPresets.ts` — Replace "bug-bot" and "meowtrix" presets with "golden" and "husky"

## No Changes Required

- `src/canvas/animations.ts` — Keyframes unchanged
- `src/canvas/renderer.ts` — Compositing order unchanged
- `src/canvas/animationEngine.ts` — Animation system unchanged
- `src/types/index.ts` — Type definitions unchanged
- All other presets, stores, hooks, components, and backend code

## Constraints

- All drawing uses Canvas 2D primitives (ellipses, quadratic curves, rounded rects, radial gradients)
- No WebGL, no sprite sheets, no external image assets
- Canvas size remains 150×180 logical pixels
- 4-color palette per pet (primary, secondary, eye, accessory)
