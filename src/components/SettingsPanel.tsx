import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { usePetStore } from "../stores/petStore";
import { SKINS } from "../data/skins";
import { Sound } from "../utils/sound";
import { PERSONALITIES, AVAILABLE_SKILLS } from "../types";
import type { AppSettings, LlmConfig, Personality } from "../types";
import { normalizeSettings } from "../utils/normalizeSettings";
import PetCustomizer from "./PetCustomizer";

interface Props {
  onSaved?: () => void;
}

const PROVIDERS = [
  { value: "deepseek", label: "DeepSeek" },
  { value: "qwen", label: "通义千问 (Qwen)" },
  { value: "zhipu", label: "智谱 GLM" },
  { value: "baidu", label: "百度文心" },
  { value: "openai", label: "OpenAI" },
  { value: "custom", label: "外部模型 (OpenAI兼容)" },
];

const PROVIDER_BASE_URLS: Record<string, string> = {
  deepseek: "https://api.deepseek.com/v1",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  zhipu: "https://open.bigmodel.cn/api/paas/v4",
  baidu: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat",
  openai: "https://api.openai.com/v1",
  custom: "https://api.example.com/v1",
};

function defaultBaseUrl(provider: string): string {
  return PROVIDER_BASE_URLS[provider] ?? "https://api.example.com/v1";
}

function modelPlaceholder(provider: string): string {
  const map: Record<string, string> = {
    deepseek: "deepseek-chat",
    qwen: "qwen-max",
    zhipu: "glm-4-plus",
    baidu: "ernie-4.0",
    openai: "gpt-4o",
    custom: "your-model-name",
  };
  return map[provider] ?? "model-name";
}

function modelHint(provider: string): string {
  const map: Record<string, string> = {
    deepseek: "推荐: deepseek-chat, deepseek-reasoner",
    qwen: "推荐: qwen-max, qwen-plus, qwen-turbo",
    zhipu: "推荐: glm-4-plus, glm-4-air, glm-4-flash",
    openai: "推荐: gpt-4o, gpt-4o-mini, gpt-4.1",
  };
  return map[provider] ?? "";
}

type Tab = "character" | "customizer" | "llm" | "general";

const SettingsPanel = ({ onSaved }: Props) => {
  const storeSettings = usePetStore((s) => s.settings);
  const [local, setLocal] = useState<AppSettings | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [saveResult, setSaveResult] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("character");

  useEffect(() => {
    if (storeSettings) setLocal(normalizeSettings(storeSettings));
  }, [storeSettings]);

  const loadSettings = async () => {
    try {
      const s = await invoke<AppSettings>("get_settings");
      const normalized = normalizeSettings(s);
      setLocal(normalized);
      usePetStore.getState().setSettings(normalized);
    } catch { /* use defaults */ }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (!local) return null;

  const save = async () => {
    setSaveResult(null);
    try {
      await invoke("save_settings", { settings: local });
      usePetStore.getState().setSettings(local);
      setSaveResult("✅ 保存成功");
      Sound.click();
      onSaved?.();
    } catch (e) {
      setSaveResult(`❌ 保存失败: ${e}`);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await invoke<string>("test_llm_connection");
      setTestResult(`✅ ${result}`);
    } catch (e) {
      setTestResult(`❌ 连接失败: ${e}`);
    }
    setTesting(false);
  };

  const updateLlm = (partial: Partial<LlmConfig>) => {
    setLocal((prev) => prev ? { ...prev, llm: { ...prev.llm, ...partial } } : prev);
  };

  const toggleSkill = (skill: string) => {
    setLocal((prev) => {
      if (!prev) return prev;
      const skills = prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];
      return { ...prev, skills };
    });
  };

  return (
    <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ color: "#222", fontSize: 16, fontWeight: 600 }}>⚙️ 设置</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {([
          { key: "character" as Tab, label: "🧬 宠物角色" },
          { key: "customizer" as Tab, label: "🎨 外观定制" },
          { key: "llm" as Tab, label: "🤖 AI 模型" },
          { key: "general" as Tab, label: "⚙️ 通用" },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${tab === t.key ? "active" : ""}`}
            onClick={() => setTab(t.key)}
            style={{ flex: 1, fontSize: 12, padding: "7px 4px" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ========== TAB: CHARACTER ========== */}
      {tab === "character" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={labelStyle}>🏷️ 宠物名字</label>
          <input
            type="text"
            value={local.petName}
            onChange={(e) => setLocal((prev) => prev ? { ...prev, petName: e.target.value } : prev)}
            placeholder="橘宝"
            style={inputStyle}
          />

          <label style={labelStyle}>🎭 性格</label>
          <select
            value={local.personality}
            onChange={(e) => setLocal((prev) => prev ? { ...prev, personality: e.target.value as Personality } : prev)}
            style={selectStyle}
          >
            {PERSONALITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label} — {p.desc}</option>
            ))}
          </select>

          <label style={labelStyle}>🛠️ 能力 (可多选)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {AVAILABLE_SKILLS.map((sk) => (
              <button
                key={sk.value}
                className={`part-btn ${local.skills.includes(sk.value) ? "active" : ""}`}
                onClick={() => toggleSkill(sk.value)}
                title={sk.desc}
              >
                {sk.label}
              </button>
            ))}
          </div>

          <label style={labelStyle}>📜 灵魂档案 (soul.md)</label>
          <label style={{ ...labelStyle, fontSize: 11, color: "#888", marginTop: -4 }}>
            这份档案定义了宠物的身份、个性和行为规则
          </label>
          <textarea
            value={local.soulMd}
            onChange={(e) => setLocal((prev) => prev ? { ...prev, soulMd: e.target.value } : prev)}
            style={{
              ...inputStyle,
              minHeight: 140,
              resize: "vertical",
              fontFamily: "monospace",
              fontSize: 11,
              lineHeight: 1.5,
            }}
          />

          <button onClick={save} style={btnStyle}>💾 保存角色设置</button>
          {saveResult && (
            <div style={{
              padding: 8, borderRadius: 8, fontSize: 12,
              background: saveResult.startsWith("✅") ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
              color: saveResult.startsWith("✅") ? "#16a34a" : "#dc2626",
            }}>{saveResult}</div>
          )}
        </div>
      )}

      {/* ========== TAB: CUSTOMIZER ========== */}
      {tab === "customizer" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <PetCustomizer embedded onConfigChange={(config) => {
            setLocal((prev) => prev ? { ...prev, petConfig: config } : prev);
          }} />
          <button onClick={save} style={btnStyle}>💾 保存外观设置</button>
          {saveResult && (
            <div style={{
              padding: 8, borderRadius: 8, fontSize: 12,
              background: saveResult.startsWith("✅") ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
              color: saveResult.startsWith("✅") ? "#16a34a" : "#dc2626",
            }}>{saveResult}</div>
          )}
        </div>
      )}

      {/* ========== TAB: LLM ========== */}
      {tab === "llm" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Provider selection */}
          <label style={labelStyle}>🤖 AI Provider</label>
          <select
            value={local.llm.provider}
            onChange={(e) => updateLlm({ provider: e.target.value })}
            style={selectStyle}
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          {/* Provider model hints */}
          {local.llm.provider !== "custom" && local.llm.provider !== "baidu" && (
            <span style={{ fontSize: 11, color: "#888", marginTop: -8 }}>
              {modelHint(local.llm.provider)}
            </span>
          )}

          {/* API Key */}
          <label style={labelStyle}>🔑 API Key</label>
          <input
            type="password"
            value={local.llm.apiKey}
            onChange={(e) => updateLlm({ apiKey: e.target.value })}
            placeholder="sk-..."
            style={inputStyle}
          />

          {/* Base URL — always visible, with provider-specific defaults */}
          <label style={labelStyle}>🌐 Base URL</label>
          <input
            type="text"
            value={local.llm.customBaseUrl ?? ""}
            onChange={(e) => updateLlm({ customBaseUrl: e.target.value })}
            placeholder={defaultBaseUrl(local.llm.provider)}
            style={inputStyle}
          />
          <span style={{ fontSize: 11, color: "#888", marginTop: -8 }}>
            {local.llm.provider === "custom"
              ? "填写你的外部模型 API 地址（需 OpenAI 兼容）"
              : "留空使用默认地址，可覆盖为自定义端点"}
          </span>

          {/* Model name */}
          <label style={labelStyle}>📦 Model</label>
          <input
            type="text"
            value={local.llm.model}
            onChange={(e) => updateLlm({ model: e.target.value })}
            placeholder={modelPlaceholder(local.llm.provider)}
            style={inputStyle}
          />

          {/* Advanced parameters — collapsible */}
          <details style={{ marginTop: 4 }}>
            <summary style={{ color: "#666", fontSize: 12, cursor: "pointer", userSelect: "none" }}>
              ⚙️ 高级参数
            </summary>
            <div style={{ padding: "12px 0 4px 0", display: "flex", flexDirection: "column", gap: 12 }}>

              <label style={labelStyle}>
                Max Tokens: <strong>{local.llm.maxTokens ?? 1000}</strong>
              </label>
              <input
                type="range"
                min={256}
                max={4096}
                step={128}
                value={local.llm.maxTokens ?? 1000}
                onChange={(e) => updateLlm({ maxTokens: parseInt(e.target.value) })}
                style={{ width: "100%" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#999", marginTop: -8 }}>
                <span>256</span>
                <span>4096</span>
              </div>

              <label style={labelStyle}>
                Temperature: <strong>{local.llm.temperature.toFixed(1)}</strong>
              </label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={local.llm.temperature}
                onChange={(e) => updateLlm({ temperature: parseFloat(e.target.value) })}
                style={{ width: "100%" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#999", marginTop: -8 }}>
                <span>精确 (0)</span>
                <span>创造 (2)</span>
              </div>

              <label style={labelStyle}>
                Top P: <strong>{(local.llm.topP ?? 0.9).toFixed(1)}</strong>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={local.llm.topP ?? 0.9}
                onChange={(e) => updateLlm({ topP: parseFloat(e.target.value) })}
                style={{ width: "100%" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#999", marginTop: -8 }}>
                <span>0</span>
                <span>1</span>
              </div>

            </div>
          </details>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button onClick={save} style={btnStyle}>💾 保存</button>
            <button onClick={testConnection} disabled={testing} style={secondaryBtnStyle}>
              {testing ? "测试中..." : "🔌 测试连接"}
            </button>
          </div>

          {saveResult && (
            <div style={{
              padding: 10, borderRadius: 8, fontSize: 12,
              background: saveResult.startsWith("✅") ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
              color: saveResult.startsWith("✅") ? "#16a34a" : "#dc2626",
            }}>{saveResult}</div>
          )}

          {testResult && (
            <div style={{
              marginTop: 4, padding: 10, borderRadius: 8,
              background: testResult.startsWith("✅") ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
              color: testResult.startsWith("✅") ? "#16a34a" : "#dc2626",
              fontSize: 12,
            }}>
              {testResult}
            </div>
          )}
        </div>
      )}

      {/* ========== TAB: GENERAL ========== */}
      {tab === "general" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={labelStyle}>🎨 UI 主题</label>
          <select
            value={local.skin}
            onChange={(e) => setLocal((prev) => prev ? { ...prev, skin: e.target.value } : prev)}
            style={selectStyle}
          >
            {Object.values(SKINS).map((s) => (
              <option key={s.name} value={s.name}>{s.label}</option>
            ))}
          </select>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}>
            <label style={{ ...labelStyle, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={local.soundEnabled}
                onChange={(e) => setLocal((prev) => prev ? { ...prev, soundEnabled: e.target.checked } : prev)}
                style={{ marginRight: 8 }}
              />
              🔊 音效
            </label>
            <label style={{ ...labelStyle, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={local.autoHide}
                onChange={(e) => setLocal((prev) => prev ? { ...prev, autoHide: e.target.checked } : prev)}
                style={{ marginRight: 8 }}
              />
              👻 自动隐藏
            </label>
          </div>

          <label style={labelStyle}>⏰ 休息提醒间隔</label>
          <input
            type="range"
            min={30}
            max={180}
            step={15}
            value={local.reminderInterval}
            onChange={(e) => setLocal((prev) => prev ? { ...prev, reminderInterval: parseInt(e.target.value) } : prev)}
            style={{ width: "100%" }}
          />
          <span style={{ color: "#888", fontSize: 12 }}>{local.reminderInterval} 分钟</span>

          <button onClick={save} style={btnStyle}>💾 保存通用设置</button>
          {saveResult && (
            <div style={{
              padding: 8, borderRadius: 8, fontSize: 12,
              background: saveResult.startsWith("✅") ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
              color: saveResult.startsWith("✅") ? "#16a34a" : "#dc2626",
            }}>{saveResult}</div>
          )}
        </div>
      )}
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  color: "#555",
  fontSize: 12,
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  background: "#f4f4f5",
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: 8,
  color: "#222",
  fontSize: 13,
  outline: "none",
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  background: "#f4f4f5",
  border: "1px solid rgba(0,0,0,0.06)",
  borderRadius: 8,
  color: "#222",
  fontSize: 13,
  outline: "none",
};

const btnStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  border: "none",
  borderRadius: 10,
  color: "#fff",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  transition: "transform 0.15s, box-shadow 0.15s",
};

const secondaryBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "#f4f4f5",
  border: "none",
  borderRadius: 10,
  color: "#555",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

export default SettingsPanel;
