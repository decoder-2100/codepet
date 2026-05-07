import { useState, useRef, useEffect } from "react";
import { usePetStore } from "../stores/petStore";
import { bodyVariants } from "../canvas/parts/body";
import { headVariants } from "../canvas/parts/head";
import { eyeVariants } from "../canvas/parts/eyes";
import { mouthVariants } from "../canvas/parts/mouth";
import { accessoryVariants } from "../canvas/parts/accessories";
import { tailVariants } from "../canvas/parts/tail";
import { PET_PRESETS } from "../data/petPresets";
import { AnimationPlayer } from "../canvas/animationEngine";
import { registerAnimations } from "../canvas/animations";
import { drawFrame } from "../canvas/renderer";
import { Sound } from "../utils/sound";
import type { PetConfig } from "../types";

interface Props {
  onClose?: () => void;
  embedded?: boolean;
  onConfigChange?: (config: PetConfig) => void;
}

type Tab = "body" | "head" | "eyes" | "mouth" | "tail" | "accessories" | "presets";

const TABS: { key: Tab; label: string }[] = [
  { key: "body", label: "身体" },
  { key: "head", label: "头部" },
  { key: "eyes", label: "眼睛" },
  { key: "mouth", label: "嘴巴" },
  { key: "tail", label: "尾巴" },
  { key: "accessories", label: "装饰" },
  { key: "presets", label: "预设" },
];

const ALL_ACCESSORIES = Object.keys(accessoryVariants);

const PetCustomizer = ({ onClose, embedded, onConfigChange }: Props) => {
  const currentConfig = usePetStore((s) => s.petConfig);
  const [config, setConfig] = useState<PetConfig>(currentConfig);
  const [tab, setTab] = useState<Tab>("presets");
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const playerRef = useRef<AnimationPlayer | null>(null);

  // Live preview
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const player = new AnimationPlayer();
    registerAnimations(player);
    player.play("idle");
    playerRef.current = player;

    // Handle HiDPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 180 * dpr;
    canvas.height = 240 * dpr;
    ctx.scale(dpr, dpr);
    const cw = 180;
    const ch = 240;

    let raf = requestAnimationFrame(function loop(now) {
      drawFrame(ctx, player, config.parts, config.colors, 16, cw, ch);
      raf = requestAnimationFrame(loop);
    });

    return () => cancelAnimationFrame(raf);
  }, [config]);

  const updatePart = (key: keyof PetConfig["parts"], value: string) => {
    Sound.click();
    const newConfig = { ...config, parts: { ...config.parts, [key]: value } };
    setConfig(newConfig);
    if (embedded && onConfigChange) onConfigChange(newConfig);
  };

  const toggleAccessory = (acc: string) => {
    Sound.click();
    const newAccessories = config.parts.accessories.includes(acc)
      ? config.parts.accessories.filter((a) => a !== acc)
      : [...config.parts.accessories, acc];
    const newConfig = { ...config, parts: { ...config.parts, accessories: newAccessories } };
    setConfig(newConfig);
    if (embedded && onConfigChange) onConfigChange(newConfig);
  };

  const updateColor = (key: keyof PetConfig["colors"], value: string) => {
    const newConfig = { ...config, colors: { ...config.colors, [key]: value } };
    setConfig(newConfig);
    if (embedded && onConfigChange) onConfigChange(newConfig);
  };

  const applyConfig = () => {
    usePetStore.getState().setPetConfig(config);
    Sound.click();
    onClose?.();
  };

  const loadPreset = (preset: typeof PET_PRESETS[0]) => {
    Sound.click();
    setConfig(preset.config);
    if (embedded && onConfigChange) onConfigChange(preset.config);
  };

  const renderTab = () => {
    if (tab === "body") {
      return Object.keys(bodyVariants).map((v) => (
        <button key={v} className={`part-btn ${config.parts.body === v ? "active" : ""}`} onClick={() => updatePart("body", v)}>
          {v}
        </button>
      ));
    }
    if (tab === "head") {
      return Object.keys(headVariants).map((v) => (
        <button key={v} className={`part-btn ${config.parts.head === v ? "active" : ""}`} onClick={() => updatePart("head", v)}>
          {v}
        </button>
      ));
    }
    if (tab === "eyes") {
      return Object.keys(eyeVariants).map((v) => (
        <button key={v} className={`part-btn ${config.parts.eyes === v ? "active" : ""}`} onClick={() => updatePart("eyes", v)}>
          {v}
        </button>
      ));
    }
    if (tab === "mouth") {
      return Object.keys(mouthVariants).map((v) => (
        <button key={v} className={`part-btn ${config.parts.mouth === v ? "active" : ""}`} onClick={() => updatePart("mouth", v)}>
          {v}
        </button>
      ));
    }
    if (tab === "tail") {
      return Object.keys(tailVariants).map((v) => (
        <button key={v} className={`part-btn ${config.parts.tail === v ? "active" : ""}`} onClick={() => updatePart("tail", v)}>
          {v}
        </button>
      ));
    }
    if (tab === "accessories") {
      return ALL_ACCESSORIES.map((v) => (
        <button
          key={v}
          className={`part-btn ${config.parts.accessories.includes(v) ? "active" : ""}`}
          onClick={() => toggleAccessory(v)}
        >
          {v} {config.parts.accessories.includes(v) ? "✓" : ""}
        </button>
      ));
    }
    if (tab === "presets") {
      return PET_PRESETS.map((p) => (
        <button key={p.name} className="preset-btn" onClick={() => loadPreset(p)}>
          {p.label}
        </button>
      ));
    }
    return null;
  };

  return (
    <div className={embedded ? "pet-customizer-embedded" : "pet-customizer"} onClick={(e) => e.stopPropagation()}>
      {!embedded && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ color: "#222", fontSize: 16, fontWeight: 600 }}>🎨 自定义宠物</span>
          {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
        </div>
      )}

      {/* Preview */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <canvas
          ref={previewRef}
          style={{ width: 180, height: 240, borderRadius: 12, background: "#f4f4f5" }}
        />
      </div>

      {/* Color pickers */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 16 }}>
        {(["primary", "secondary", "eye", "accessory"] as const).map((k) => (
          <div key={k} style={{ textAlign: "center" }}>
            <div style={{ color: "#888", fontSize: 10, marginBottom: 4 }}>{k}</div>
            <input
              type="color"
              value={config.colors[k]}
              onChange={(e) => updateColor(k, e.target.value)}
              style={{ width: 32, height: 32, border: "none", borderRadius: 6, cursor: "pointer" }}
            />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Options */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
        {renderTab()}
      </div>

      {/* Apply */}
      {!embedded && (
        <button onClick={applyConfig} style={{
          width: "100%",
          padding: "10px",
          background: "linear-gradient(135deg, #5879FF 0%, #6C5CE7 100%)",
          border: "none",
          borderRadius: 10,
          color: "#fff",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
        }}>
          ✅ 应用
        </button>
      )}
    </div>
  );
};

export default PetCustomizer;
