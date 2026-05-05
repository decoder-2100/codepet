import type { AppSettings } from "../types";

/** Normalize snake_case fields from Tauri IPC to camelCase for frontend stores */
export function normalizeSettings(s: any): AppSettings {
  if (!s) return s;
  return {
    skin: s.skin ?? "matrix",
    soundEnabled: s.soundEnabled ?? s.sound_enabled ?? true,
    reminderInterval: s.reminderInterval ?? s.reminder_interval ?? 120,
    autoHide: s.autoHide ?? s.auto_hide ?? true,
    llm: {
      provider: s.llm?.provider ?? "deepseek",
      apiKey: s.llm?.apiKey ?? s.llm?.api_key ?? "",
      model: s.llm?.model ?? "deepseek-chat",
      temperature: s.llm?.temperature ?? 0.7,
      maxTokens: s.llm?.maxTokens ?? s.llm?.max_tokens ?? 1000,
      topP: s.llm?.topP ?? s.llm?.top_p ?? 0.9,
      customBaseUrl: s.llm?.customBaseUrl ?? s.llm?.custom_base_url ?? "",
    },
    petConfig: s.petConfig
      ? {
          parts: {
            body: s.petConfig.parts?.body ?? "chubby",
            head: s.petConfig.parts?.head ?? "cat",
            eyes: s.petConfig.parts?.eyes ?? "normal",
            mouth: s.petConfig.parts?.mouth ?? "smile",
            tail: s.petConfig.parts?.tail ?? "cat",
            accessories: s.petConfig.parts?.accessories ?? [],
          },
          colors: {
            primary: s.petConfig.colors?.primary ?? "#F0A070",
            secondary: s.petConfig.colors?.secondary ?? "#FAD0B0",
            eye: s.petConfig.colors?.eye ?? "#3D3835",
            accessory: s.petConfig.colors?.accessory ?? "#8EA0B0",
          },
        }
      : {
          parts: { body: "chubby", head: "cat", eyes: "normal", mouth: "smile", tail: "cat", accessories: [] },
          colors: { primary: "#F0A070", secondary: "#FAD0B0", eye: "#3D3835", accessory: "#8EA0B0" },
        },
    petName: s.petName ?? s.pet_name ?? "橘宝",
    personality: s.personality ?? "humorous",
    soulMd: s.soulMd ?? s.soul_md ?? "",
    skills: s.skills ?? [],
  };
}
