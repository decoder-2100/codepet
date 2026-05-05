import { useState, useRef, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useChatStore } from "../stores/chatStore";
import { usePetStore } from "../stores/petStore";
import { Sound } from "../utils/sound";
import { AVAILABLE_SKILLS } from "../types";
import ZhurongAvatar from "./ZhurongAvatar";

interface Props {}

const QUICK_HINTS = [
  "帮我分析这个 Bug",
  "给我讲个技术段子",
  "今天该休息了",
  "来段代码审查",
];

const ChatPanel = ({}: Props) => {
  const [input, setInput] = useState("");
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const buffer = useChatStore((s) => s.currentBuffer);
  const showHistory = useChatStore((s) => s.showHistory);
  const showSkills = useChatStore((s) => s.showSkills);
  const addMessage = useChatStore((s) => s.addMessage);
  const setStreaming = useChatStore((s) => s.setStreaming);
  const saveCurrentSession = useChatStore((s) => s.saveCurrentSession);
  const loadSession = useChatStore((s) => s.loadSession);
  const newSession = useChatStore((s) => s.newSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const setShowHistory = useChatStore((s) => s.setShowHistory);
  const setShowSkills = useChatStore((s) => s.setShowSkills);
  const sessions = useChatStore((s) => s.sessions);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const petName = usePetStore((s) => s.settings?.petName) || "CodePet";

  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, buffer]);

  useEffect(() => {
    if (!showHistory && !showSkills) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [showHistory, showSkills]);

  // 保存当前会话到历史（关闭时）
  useEffect(() => {
    return () => {
      saveCurrentSession();
    };
  }, []);

  const handleSend = useCallback(async (text?: string, scenario?: string) => {
    const msg = (text || input).trim();
    if (!msg || isStreaming) return;
    const finalScenario = scenario || "chat";
    setInput("");
    addMessage({ role: "user", content: msg });
    Sound.message();

    usePetStore.getState().setPose("talking");
    usePetStore.getState().setAnim("talking");

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
        // 尝试 fallback roasts
        try {
          const roasts = await invoke<string[]>("get_fallback_roasts");
          const roast = roasts[Math.floor(Math.random() * roasts.length)];
          addMessage({ role: "pet", content: roast });
        } catch {
          addMessage({
            role: "pet",
            content: "⚠️ AI 未配置。请先在设置中填写 API Key，然后再来聊天吧！",
          });
        }
      }
      setStreaming(false);
      usePetStore.getState().setPose("idle");
      usePetStore.getState().setAnim("idle");
    }
  }, [input, isStreaming, addMessage, setStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  const handleHintClick = (hint: string) => {
    handleSend(hint);
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
    const scenario = scenarioMap[skill.value] || "chat";
    setInput(skill.label);
    setShowSkills(false);
    handleSend(`${skill.label}：请帮我${skill.desc}`, scenario);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", background: "var(--db-bg)", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="doubao-header">
        <div className="doubao-header-title">
          <span className="doubao-header-title-avatar"><ZhurongAvatar /></span>
          <span>{petName}</span>
        </div>
        <div className="doubao-header-icons">
          <button
            className="doubao-icon-btn"
            title="新建对话"
            onClick={() => { saveCurrentSession(); newSession(); }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
          <button
            className={`doubao-icon-btn ${showHistory ? "active" : ""}`}
            title="历史记录"
            onClick={() => { setShowHistory(!showHistory); setShowSkills(false); }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
        </div>
      </div>

          {/* History Sidebar */}
          {showHistory && (
            <>
              <div className="doubao-history-overlay" onClick={() => setShowHistory(false)} />
              <div className="doubao-history-panel">
                <div className="doubao-history-header">
                  <span className="doubao-history-header-title">对话历史</span>
                  <button className="doubao-icon-btn" onClick={() => setShowHistory(false)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="doubao-history-list">
                  {sessions.length === 0 ? (
                    <div className="doubao-history-empty">
                      <span style={{ fontSize: 24 }}>📝</span>
                      <span>暂无对话记录</span>
                    </div>
                  ) : (
                    sessions.map((s) => (
                      <div
                        key={s.id}
                        className={`doubao-history-item ${activeSessionId === s.id ? "active" : ""}`}
                        style={{ position: "relative" }}
                        onClick={() => loadSession(s.id)}
                      >
                        <div className="doubao-history-item-title">{s.title}</div>
                        <div className="doubao-history-item-preview">
                          {s.messages.length > 0 ? s.messages[s.messages.length - 1].content.slice(0, 40) : "空对话"}
                        </div>
                        <div className="doubao-history-item-time">{formatTime(s.updatedAt)}</div>
                        <button
                          className="doubao-history-item-delete doubao-icon-btn"
                          style={{ position: "absolute", right: 4, top: 8, width: 24, height: 24 }}
                          onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="doubao-history-footer">
                  <button className="doubao-new-chat-btn" onClick={newSession}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    新建对话
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Messages area */}
          <div className="doubao-messages">
            {messages.length === 0 && (
              <div className="doubao-empty">
                <div className="doubao-empty-icon">🐾</div>
                <div className="doubao-empty-text">有什么我可以帮你的？</div>
                <div className="doubao-empty-hints">
                  {QUICK_HINTS.map((h) => (
                    <button key={h} className="doubao-hint-chip" onClick={() => handleHintClick(h)}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`doubao-msg ${msg.role === "user" ? "user" : "pet"}`}>
                {msg.role === "pet" && (
                  <div className="doubao-avatar"><ZhurongAvatar /></div>                )}
                <div className="doubao-bubble">
                  {msg.content}
                </div>
              </div>
            ))}
            {isStreaming && buffer && (
              <div className="doubao-msg pet">
                <div className="doubao-avatar"><ZhurongAvatar /></div>
                <div className="doubao-bubble">
                  {buffer}<span className="cursor-blink">▊</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Skills Panel */}
          {showSkills && (
            <div className="doubao-skills-panel">
              <div className="doubao-skills-grid">
                {AVAILABLE_SKILLS.map((sk) => (
                  <button key={sk.value} className="doubao-skill-card" onClick={() => handleSkillClick(sk)}>
                    <span className="doubao-skill-icon">{sk.label.split(" ")[0]}</span>
                    <div className="doubao-skill-info">
                      <span className="doubao-skill-name">{sk.label.split(" ").slice(1).join(" ")}</span>
                      <span className="doubao-skill-desc">{sk.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="doubao-input-area">
            <div className="doubao-input-box">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder={'发消息或输入"/"选择技能'}
                disabled={isStreaming}
                rows={1}
                className="doubao-textarea"
              />
            </div>
            <div className="doubao-toolbar">
              <div className="doubao-toolbar-left">
                <button
                  className="doubao-tool-btn"
                  title="新建对话"
                  onClick={() => {
                    saveCurrentSession();
                    newSession();
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <button className="doubao-tool-btn" title="技能" onClick={() => setShowSkills(!showSkills)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span>快速</span>
                </button>
                <button className="doubao-tool-btn" title="历史" onClick={() => setShowHistory(!showHistory)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
                  </svg>
                  <span>更多</span>
                </button>
              </div>
              <div className="doubao-toolbar-right">
                <button
                  className={`doubao-send-btn ${input.trim() ? "active" : ""}`}
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isStreaming}
                  title="发送"
                >
                  {input.trim() ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
    </div>
  );
};

export default ChatPanel;
