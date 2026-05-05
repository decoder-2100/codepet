export interface PartState {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
}

export type PartName = "body" | "head" | "eyes" | "mouth" | "tail";

export interface Keyframe {
  time: number;
  parts: Record<PartName, PartState>;
}

export interface Animation {
  name: string;
  keyframes: Keyframe[];
  loop: boolean;
  duration: number;
}

export type PetPose = "idle" | "coding" | "collapsed" | "crushing" | "talking" | "happy" | "sad" | "lying";

export interface PetColors {
  primary: string;
  secondary: string;
  eye: string;
  accessory: string;
}

export interface PetPartConfig {
  body: string;
  head: string;
  eyes: string;
  mouth: string;
  tail: string;
  accessories: string[];
}

export interface PetConfig {
  parts: PetPartConfig;
  colors: PetColors;
}

export interface LlmConfig {
  provider: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  customBaseUrl?: string;
}

/** Pet personality traits that shape LLM responses */
export const PERSONALITIES = [
  { value: "humorous", label: "幽默风趣", desc: "爱开玩笑，用段子化解压力" },
  { value: "sarcastic", label: "毒舌吐槽", desc: "犀利吐槽，一针见血" },
  { value: "gentle", label: "温柔治愈", desc: "暖心鼓励，正能量满满" },
  { value: "techgeek", label: "技术极客", desc: "专注技术，给出硬核建议" },
  { value: "zen", label: "佛系禅意", desc: "淡定从容，随缘就好" },
  { value: "tsundere", label: "傲娇", desc: "嘴上嫌弃，实际很关心" },
] as const;

export type Personality = (typeof PERSONALITIES)[number]["value"];

/** Pet skills/abilities */
export const AVAILABLE_SKILLS = [
  { value: "bug_analysis", label: "🐛 Bug 分析", desc: "分析报错并给出修复建议" },
  { value: "code_review", label: "🔍 代码审查", desc: "审查代码并给出改进意见" },
  { value: "tech_chat", label: "💬 技术闲聊", desc: "聊技术话题和行业八卦" },
  { value: "mood_booster", label: "🌈 情绪调节", desc: "在你烦躁时安抚情绪" },
  { value: "roast", label: "😂 吐槽模式", desc: "用技术梗吐槽产品经理" },
  { value: "reminder", label: "⏰ 健康提醒", desc: "提醒休息、喝水、护眼" },
] as const;

export interface AppSettings {
  skin: string;
  soundEnabled: boolean;
  reminderInterval: number;
  autoHide: boolean;
  llm: LlmConfig;
  petConfig: PetConfig;
  // === New character fields ===
  petName: string;
  personality: Personality;
  soulMd: string;
  skills: string[];
}

export interface ChatMessage {
  role: "user" | "pet";
  content: string;
}
