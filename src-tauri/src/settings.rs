use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmConfig {
    pub provider: String,
    #[serde(alias = "apiKey")]
    pub api_key: String,
    pub model: String,
    pub temperature: f64,
    #[serde(default = "default_max_tokens", alias = "maxTokens")]
    pub max_tokens: u32,
    #[serde(default = "default_top_p", alias = "topP")]
    pub top_p: f64,
    #[serde(default, alias = "customBaseUrl")]
    pub custom_base_url: String,
}

fn default_max_tokens() -> u32 {
    1000
}

fn default_top_p() -> f64 {
    0.9
}

impl Default for LlmConfig {
    fn default() -> Self {
        Self {
            provider: "deepseek".into(),
            api_key: String::new(),
            model: "deepseek-chat".into(),
            temperature: 0.7,
            max_tokens: default_max_tokens(),
            top_p: default_top_p(),
            custom_base_url: String::new(),
        }
    }
}

fn default_tail() -> String {
    "cat".into()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PetPartConfig {
    pub body: String,
    pub head: String,
    pub eyes: String,
    pub mouth: String,
    #[serde(default = "default_tail")]
    pub tail: String,
    pub accessories: Vec<String>,
}

impl Default for PetPartConfig {
    fn default() -> Self {
        Self {
            body: "chubby".into(),
            head: "cat".into(),
            eyes: "normal".into(),
            mouth: "smile".into(),
            tail: default_tail(),
            accessories: vec![],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PetColors {
    pub primary: String,
    pub secondary: String,
    pub eye: String,
    pub accessory: String,
}

impl Default for PetColors {
    fn default() -> Self {
        Self {
            primary: "#F0A070".into(),
            secondary: "#FAD0B0".into(),
            eye: "#3D3835".into(),
            accessory: "#8EA0B0".into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PetConfig {
    pub parts: PetPartConfig,
    pub colors: PetColors,
}

impl Default for PetConfig {
    fn default() -> Self {
        Self {
            parts: PetPartConfig::default(),
            colors: PetColors::default(),
        }
    }
}

fn default_pet_name() -> String {
    "橘宝".into()
}

fn default_personality() -> String {
    "humorous".into()
}

fn default_soul_md() -> String {
    include_str!("../default_soul.md").to_string()
}

fn default_skills() -> Vec<String> {
    vec!["bug_analysis".into(), "roast".into(), "tech_chat".into(), "reminder".into()]
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub skin: String,
    #[serde(alias = "soundEnabled")]
    pub sound_enabled: bool,
    #[serde(alias = "reminderInterval")]
    pub reminder_interval: u32,
    #[serde(alias = "autoHide")]
    pub auto_hide: bool,
    pub llm: LlmConfig,
    #[serde(alias = "petConfig")]
    pub pet_config: PetConfig,
    // === Pet character fields ===
    #[serde(default = "default_pet_name", alias = "petName")]
    pub pet_name: String,
    #[serde(default = "default_personality")]
    pub personality: String,
    #[serde(default = "default_soul_md", alias = "soulMd")]
    pub soul_md: String,
    #[serde(default = "default_skills")]
    pub skills: Vec<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            skin: "matrix".into(),
            sound_enabled: true,
            reminder_interval: 120,
            auto_hide: true,
            llm: LlmConfig::default(),
            pet_config: PetConfig::default(),
            pet_name: default_pet_name(),
            personality: default_personality(),
            soul_md: default_soul_md(),
            skills: default_skills(),
        }
    }
}

fn settings_path() -> PathBuf {
    let mut path = std::env::current_exe()
        .unwrap_or_default()
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_default();
    path.push("coderpet_settings.json");
    path
}

pub fn load() -> AppSettings {
    let path = settings_path();
    if path.exists() {
        std::fs::read_to_string(&path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default()
    } else {
        AppSettings::default()
    }
}

pub fn save(settings: &AppSettings) -> Result<(), String> {
    let path = settings_path();
    let json = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    std::fs::write(&path, json).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_settings() {
        let s = AppSettings::default();
        assert_eq!(s.skin, "matrix");
        assert!(s.sound_enabled);
        assert_eq!(s.reminder_interval, 120);
        assert!(s.auto_hide);
        assert_eq!(s.pet_name, "橘宝");
        assert_eq!(s.personality, "humorous");
        assert!(s.soul_md.contains("CoderPet Soul"));
        assert!(s.skills.contains(&"bug_analysis".to_string()));
    }

    #[test]
    fn test_default_llm_config() {
        let llm = LlmConfig::default();
        assert_eq!(llm.provider, "deepseek");
        assert_eq!(llm.model, "deepseek-chat");
        assert_eq!(llm.temperature, 0.7);
        assert_eq!(llm.max_tokens, 1000);
        assert_eq!(llm.top_p, 0.9);
        assert!(llm.api_key.is_empty());
        assert!(llm.custom_base_url.is_empty());
    }

    #[test]
    fn test_default_pet_config() {
        let pc = PetConfig::default();
        assert_eq!(pc.parts.body, "chubby");
        assert_eq!(pc.parts.head, "cat");
        assert_eq!(pc.parts.eyes, "normal");
        assert_eq!(pc.parts.mouth, "smile");
        assert_eq!(pc.parts.tail, "cat");
        assert!(pc.parts.accessories.is_empty());
        assert_eq!(pc.colors.primary, "#F0A070");
        assert_eq!(pc.colors.secondary, "#FAD0B0");
        assert_eq!(pc.colors.eye, "#3D3835");
        assert_eq!(pc.colors.accessory, "#8EA0B0");
    }

    #[test]
    fn test_settings_serialization_roundtrip() {
        let s = AppSettings::default();
        let json = serde_json::to_string(&s).expect("serialize");
        let deserialized: AppSettings = serde_json::from_str(&json).expect("deserialize");
        assert_eq!(deserialized.skin, s.skin);
        assert_eq!(deserialized.pet_name, s.pet_name);
        assert_eq!(deserialized.llm.provider, s.llm.provider);
        assert_eq!(deserialized.pet_config.parts.body, s.pet_config.parts.body);
        assert_eq!(deserialized.pet_config.parts.tail, s.pet_config.parts.tail);
    }

    #[test]
    fn test_settings_serde_backward_compat() {
        // Simulate old settings JSON missing the `pet_name` field
        let old_json = r##"{
            "skin": "matrix",
            "sound_enabled": true,
            "reminder_interval": 120,
            "auto_hide": true,
            "llm": {
                "provider": "deepseek",
                "api_key": "",
                "model": "deepseek-chat",
                "temperature": 0.7
            },
            "pet_config": {
                "parts": {
                    "body": "chubby",
                    "head": "cat",
                    "eyes": "normal",
                    "mouth": "smile",
                    "accessories": []
                },
                "colors": {
                    "primary": "#FF8C42",
                    "secondary": "#FFB347",
                    "eye": "#2C3E50",
                    "accessory": "#8E44AD"
                }
            }
        }"##;
        let s: AppSettings = serde_json::from_str(old_json).expect("backward compat");
        assert_eq!(s.pet_name, "橘宝"); // default value
        assert_eq!(s.personality, "humorous"); // default value
        assert!(s.soul_md.contains("CoderPet Soul")); // default value from include_str!
        assert!(s.skills.contains(&"bug_analysis".to_string()));
        assert_eq!(s.pet_config.parts.tail, "cat"); // default tail
    }

    #[test]
    fn test_skills_default() {
        let skills = default_skills();
        assert!(skills.contains(&"bug_analysis".to_string()));
        assert!(skills.contains(&"roast".to_string()));
        assert!(skills.contains(&"tech_chat".to_string()));
        assert!(skills.contains(&"reminder".to_string()));
        assert_eq!(skills.len(), 4);
    }
}
