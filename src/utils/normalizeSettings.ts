import type { AppSettings } from "../types";

/** Normalize snake_case fields from Tauri IPC to camelCase for frontend stores */
export function normalizeSettings(s: any): AppSettings {
  if (!s) {
    // Return full defaults for null/undefined input
    return {
      skin: "matrix",
      soundEnabled: true,
      reminderInterval: 120,
      autoHide: true,
      llm: { provider: "deepseek", apiKey: "", model: "deepseek-chat", temperature: 0.7, maxTokens: 1000, topP: 0.9, customBaseUrl: "" },
      petConfig: {
        parts: { body: "chubby", head: "cat", eyes: "normal", mouth: "smile", tail: "cat", accessories: [] },
        colors: { primary: "#F0A070", secondary: "#FAD0B0", eye: "#3D3835", accessory: "#8EA0B0" },
      },
      petName: "橘宝",
      personality: "humorous",
      soulMd: "",
      skills: [],
    };
  }

  // Support both camelCase and snake_case at the top level for llm/petConfig
  const llmSrc = s.llm ?? s.llm_config ?? {};
  const petSrc = s.petConfig ?? s.pet_config ?? {};

  return {
    skin: s.skin ?? "matrix",
    soundEnabled: s.soundEnabled ?? s.sound_enabled ?? true,
    reminderInterval: s.reminderInterval ?? s.reminder_interval ?? 120,
    autoHide: s.autoHide ?? s.auto_hide ?? true,
    llm: {
      provider: llmSrc.provider ?? "deepseek",
      apiKey: llmSrc.apiKey ?? llmSrc.api_key ?? "",
      model: llmSrc.model ?? "deepseek-chat",
      temperature: llmSrc.temperature ?? 0.7,
      maxTokens: llmSrc.maxTokens ?? llmSrc.max_tokens ?? 1000,
      topP: llmSrc.topP ?? llmSrc.top_p ?? 0.9,
      customBaseUrl: llmSrc.customBaseUrl ?? llmSrc.custom_base_url ?? "",
    },
    petConfig: petSrc
      ? {
          parts: {
            body: petSrc.parts?.body ?? "chubby",
            head: petSrc.parts?.head ?? "cat",
            eyes: petSrc.parts?.eyes ?? "normal",
            mouth: petSrc.parts?.mouth ?? "smile",
            tail: petSrc.parts?.tail ?? "cat",
            accessories: petSrc.parts?.accessories ?? [],
          },
          colors: {
            primary: petSrc.colors?.primary ?? "#F0A070",
            secondary: petSrc.colors?.secondary ?? "#FAD0B0",
            eye: petSrc.colors?.eye ?? "#3D3835",
            accessory: petSrc.colors?.accessory ?? "#8EA0B0",
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
    // Preserve unknown fields for forward compatibility
    ...(Object.fromEntries(
      Object.entries(s).filter(([k]) =>
        ![
          "skin", "soundEnabled", "sound_enabled",
          "reminderInterval", "reminder_interval",
          "autoHide", "auto_hide",
          "llm", "llm_config", "petConfig", "pet_config",
          "petName", "pet_name",
          "personality", "soulMd", "soul_md",
          "skills",
        ].includes(k)
      )
    ) as any),
  };
}
