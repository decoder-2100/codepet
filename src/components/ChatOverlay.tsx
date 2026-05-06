import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useChatStore } from "../stores/chatStore";
import { usePetStore } from "../stores/petStore";
import { useLLMStream } from "../hooks/useLLMStream";
import { AVAILABLE_SKILLS } from "../types";
import { normalizeSettings } from "../utils/normalizeSettings";

// ── Provider definitions ───────────────────────────────────────────────────
export const PROVIDERS = [
  { value: "deepseek", label: "DeepSeek", icon: "🤖", color: "#4F6EF7", models: ["deepseek-chat", "deepseek-reasoner"], url: "https://api.deepseek.com" },
  { value: "qwen", label: "通义千问", icon: "🌐", color: "#FF6B35", models: ["qwen-turbo", "qwen-plus", "qwen-max", "qwen-long"], url: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
  { value: "zhipu", label: "智谱 GLM", icon: "💡", color: "#7C3AED", models: ["glm-4", "glm-4-flash", "glm-4-air"], url: "https://open.bigmodel.cn/api/paas/v4" },
  { value: "openai", label: "OpenAI", icon: "✨", color: "#10A37F", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"], url: "https://api.openai.com/v1" },
  { value: "custom", label: "自定义", icon: "🔧", color: "#6B7280", models: [], url: "" },
] as const;

// ── Welcome suggestions ────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: "🐛", text: "帮我分析这个 Bug", scenario: "bug_analysis" },
  { icon: "🔍", text: "帮我做一次代码审查", scenario: "code_review" },
  { icon: "😂", text: "讲个技术段子", scenario: "mood_booster" },
  { icon: "⏰", text: "提醒我该休息了", scenario: "reminder" },
];

// ── Simple Markdown renderer (bold / inline-code / code block) ─────────────
function renderMarkdown(text: string): ReactNode {
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let codeBlock: string[] = [];
  let inCode = false;
  let codeLang = "";

  const renderInline = (line: string, key: string): ReactNode => {
    const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return (
      <span key={key}>
        {parts.map((p, i) => {
          if (p.startsWith("`") && p.endsWith("`")) {
            return <code key={i} className="md-inline-code">{p.slice(1, -1)}</code>;
          }
          if (p.startsWith("**") && p.endsWith("**")) {
            return <strong key={i}>{p.slice(2, -2)}</strong>;
          }
          return p;
        })}
      </span>
    );
  };

  lines.forEach((line, i) => {
    if (line.startsWith("```")) {
      if (!inCode) {
        inCode = true;
        codeLang = line.slice(3).trim();
        codeBlock = [];
      } else {
        elements.push(
          <div key={`cb-${i}`} className="md-code-block">
            {codeLang && <span className="md-code-lang">{codeLang}</span>}
            <pre><code>{codeBlock.join("\n")}</code></pre>
          </div>
        );
        inCode = false;
        codeBlock = [];
        codeLang = "";
      }
      return;
    }
    if (inCode) {
      codeBlock.push(line);
      return;
    }
    if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className="md-h3">{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className="md-h2">{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className="md-h1">{line.slice(2)}</h1>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(<li key={i} className="md-li">{renderInline(line.slice(2), `il-${i}`)}</li>);
    } else if (/^\d+\. /.test(line)) {
      elements.push(<li key={i} className="md-li md-ol">{renderInline(line.replace(/^\d+\. /, ""), `ol-${i}`)}</li>);
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="md-spacer" />);
    } else {
      elements.push(<p key={i} className="md-p">{renderInline(line, `p-${i}`)}</p>);
    }
  });

  return <div className="md-body">{elements}</div>;
}

interface ChatOverlayProps {
  onClose: () => void;
}

export default function ChatOverlay({ onClose }: ChatOverlayProps) {
  useLLMStream();

  const [input, setInput] = useState("");
  const [showHistory, setShowHistoryLocal] = useState(false);
  const [showSkills, setShowSkillsLocal] = useState(false);

  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const buffer = useChatStore((s) => s.currentBuffer);
  const addMessage = useChatStore((s) => s.addMessage);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const saveCurrentSession = useChatStore((s) => s.saveCurrentSession);
  const loadSession = useChatStore((s) => s.loadSession);
  const newSession = useChatStore((s) => s.newSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const sessions = useChatStore((s) => s.sessions);
  const activeSessionId = useChatStore((s) => s.activeSessionId);

  const settings = usePetStore((s) => s.settings);
  const petName = settings?.petName || "橘宝";
  const provider = settings?.llm?.provider || "deepseek";
  const model = settings?.llm?.model || "deepseek-chat";
  const hasApiKey = !!(settings?.llm?.apiKey);
  const providerInfo = PROVIDERS.find((p) => p.value === provider);
  const providerLabel = providerInfo?.label || provider;
  const providerColor = providerInfo?.color || "#5879FF";
  const providerIcon = providerInfo?.icon || "🤖";

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load settings on mount
  useEffect(() => {
    invoke("get_settings")
      .then((s: any) => {
        const normalized = normalizeSettings(s);
        usePetStore.getState().setSettings(normalized);
        usePetStore.getState().setPetConfig(normalized.petConfig);
      })
      .catch(() => {});
  }, []);

  // Listen for settings-updated events
  useEffect(() => {
    const unlisten = listen("settings-updated", async () => {
      try {
        const s: any = await invoke("get_settings");
        const normalized = normalizeSettings(s);
        usePetStore.getState().setSettings(normalized);
      } catch {
        // ignore
      }
    });
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, buffer]);

  // Focus textarea on panel open
  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  // Save session on unmount
  useEffect(() => {
    return () => { saveCurrentSession(); };
  }, [saveCurrentSession]);

  const handleSend = useCallback(async (text?: string, scenario?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isStreaming) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    addMessage({ role: "user", content: msg });

    const finalScenario = scenario ?? "chat";
    usePetStore.getState().setAnim?.("talking");

    try {
      setStreaming(true);
      const history = useChatStore.getState().messages;
      await invoke("llm_chat_stream", { prompt: msg, scenario: finalScenario, history });
    } catch {
      try {
        const history = useChatStore.getState().messages;
        const reply = await invoke<string>("llm_chat", { prompt: msg, scenario: finalScenario, history });
        addMessage({ role: "pet", content: reply });
      } catch {
        addMessage({
          role: "pet",
          content: hasApiKey
            ? "抱歉，请求失败了。请检查 API Key 和网络连接。"
            : "⚙️ 还没有配置 API Key，请点击右上角齿轮图标进入设置。",
        });
      }
      setStreaming(false);
      usePetStore.getState().setAnim?.("idle");
    }
  }, [input, isStreaming, addMessage, setStreaming, hasApiKey]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  };

  const handleSkillClick = (skill: (typeof AVAILABLE_SKILLS)[number]) => {
    const scenarioMap: Record<string, string> = {
      bug_analysis: "bug_analysis",
      code_review: "code_review",
      tech_chat: "chat",
      mood_booster: "mood_booster",
      roast: "roast",
      reminder: "reminder",
    };
    setShowSkillsLocal(false);
    handleSend(`${skill.label}：请帮我${skill.desc}`, scenarioMap[skill.value] ?? "chat");
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  const isEmpty = messages.length === 0 && !isStreaming && !buffer;

  return (
    <div className="chat-overlay">
      {/* ═══ Header ═══ */}
      <header className="chat-overlay-header">
        <div className="cp-header-brand" style={{ WebkitAppRegion: "drag" } as any}>
          <div className="cp-avatar" style={{ background: providerColor }}>
            <span>{providerIcon}</span>
          </div>
          <div className="cp-brand-info">
            <span className="cp-brand-name">{petName}</span>
            <span className="cp-brand-model">
              <span className="cp-model-dot" style={{ background: hasApiKey ? "#22c55e" : "#ef4444" }} />
              {providerLabel} · {model}
            </span>
          </div>
        </div>
        <div className="chat-overlay-header-actions" style={{ WebkitAppRegion: "no-drag" } as any}>
          <button
            className="cp-icon-btn"
            title="设置"
            onClick={() => invoke("open_window", { label: "settings" })}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            className="cp-icon-btn"
            title="新建对话"
            onClick={() => { saveCurrentSession(); newSession(); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button
            className={`cp-icon-btn ${showHistory ? "active" : ""}`}
            title="历史记录"
            onClick={() => { setShowHistoryLocal(!showHistory); setShowSkillsLocal(false); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
          <div className="cp-header-sep" />
          <button
            className="cp-icon-btn cp-close-btn"
            title="关闭聊天"
            onClick={onClose}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* ═══ History sidebar ═══ */}
      {showHistory && (
        <>
          <div className="cp-overlay" onClick={() => setShowHistoryLocal(false)} />
          <aside className="cp-sidebar">
            <div className="cp-sidebar-head">
              <span>对话历史</span>
              <button className="cp-icon-btn" onClick={() => setShowHistoryLocal(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="cp-sidebar-list">
              {sessions.length === 0 ? (
                <div className="cp-sidebar-empty">
                  <span>📝</span>
                  <span>暂无历史记录</span>
                </div>
              ) : sessions.map((s) => (
                <div
                  key={s.id}
                  className={`cp-session-item ${activeSessionId === s.id ? "active" : ""}`}
                  onClick={() => loadSession(s.id)}
                >
                  <div className="cp-session-title">{s.title}</div>
                  <div className="cp-session-preview">
                    {s.messages.length > 0 ? s.messages[s.messages.length - 1].content.slice(0, 40) : "空对话"}
                  </div>
                  <div className="cp-session-time">{formatTime(s.updatedAt)}</div>
                  <button
                    className="cp-session-del cp-icon-btn"
                    title="删除"
                    onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="cp-sidebar-foot">
              <button className="cp-new-btn" onClick={() => { saveCurrentSession(); newSession(); setShowHistoryLocal(false); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                新建对话
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ═══ Messages area ═══ */}
      <div className="chat-overlay-messages">
        {isEmpty && (
          <div className="cp-welcome">
            <div className="cp-welcome-avatar" style={{ background: providerColor }}>
              <span style={{ fontSize: 32 }}>{providerIcon}</span>
            </div>
            <h2 className="cp-welcome-title">你好，我是 {petName}</h2>
            <p className="cp-welcome-sub">你的 AI 编程助手，支持 {providerLabel} 模型</p>
            {!hasApiKey && (
              <div className="cp-api-notice">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <span>请先点击右上角 ⚙ 配置 API Key，再开始对话</span>
              </div>
            )}
            <div className="cp-suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  className="cp-chip"
                  onClick={() => handleSend(s.text, s.scenario)}
                >
                  <span className="cp-chip-icon">{s.icon}</span>
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`cp-msg ${msg.role}`}>
            {msg.role === "pet" && (
              <div className="cp-msg-avatar" style={{ background: providerColor }}>
                <span style={{ fontSize: 13 }}>{providerIcon}</span>
              </div>
            )}
            <div className={`cp-bubble ${msg.role}`}>
              {msg.role === "pet" ? renderMarkdown(msg.content) : msg.content}
            </div>
            {msg.role === "user" && (
              <div className="cp-msg-avatar user">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>
            )}
          </div>
        ))}

        {isStreaming && (
          <div className="cp-msg pet">
            <div className="cp-msg-avatar" style={{ background: providerColor }}>
              <span style={{ fontSize: 13 }}>{providerIcon}</span>
            </div>
            <div className="cp-bubble pet">
              {buffer
                ? renderMarkdown(buffer + "▌")
                : (
                  <span className="cp-typing">
                    <span /><span /><span />
                  </span>
                )
              }
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ═══ Skills panel ═══ */}
      {showSkills && (
        <div className="cp-skills">
          <div className="cp-skills-head">
            <span>快速技能</span>
            <button className="cp-icon-btn" onClick={() => setShowSkillsLocal(false)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="cp-skills-grid">
            {AVAILABLE_SKILLS.map((sk) => (
              <button key={sk.value} className="cp-skill-btn" onClick={() => handleSkillClick(sk)}>
                <span className="cp-skill-icon">{sk.label.split(" ")[0]}</span>
                <div>
                  <div className="cp-skill-name">{sk.label.split(" ").slice(1).join(" ")}</div>
                  <div className="cp-skill-desc">{sk.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Input area ═══ */}
      <div className="chat-overlay-input">
        <div className="cp-input-box">
          <textarea
            ref={textareaRef}
            className="cp-textarea"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="输入你的问题... (Enter 发送，Shift+Enter 换行)"
            disabled={isStreaming}
            rows={1}
          />
          <button
            className={`cp-send ${input.trim() && !isStreaming ? "ready" : ""}`}
            onClick={() => handleSend()}
            disabled={!input.trim() || isStreaming}
            title="发送"
          >
            {isStreaming ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
        <div className="cp-input-footer">
          <div className="cp-footer-left">
            <button
              className={`cp-foot-btn ${showSkills ? "active" : ""}`}
              onClick={() => { setShowSkillsLocal(!showSkills); setShowHistoryLocal(false); }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              技能
            </button>
          </div>
          <div className="cp-footer-right">
            {hasApiKey ? (
              <span className="cp-status ok">
                <span className="cp-dot green" />
                {providerLabel} 已连接
              </span>
            ) : (
              <span className="cp-status warn">
                <span className="cp-dot red" />
                未配置 API Key
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
