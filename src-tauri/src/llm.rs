use crate::errors::AppError;
use crate::settings::AppSettings;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::OnceLock;
use std::time::Duration;
use tracing;

static LLM_CLIENT: OnceLock<Client> = OnceLock::new();

fn get_http_client() -> &'static Client {
    LLM_CLIENT.get_or_init(|| {
        Client::builder()
            .timeout(Duration::from_secs(120))
            .read_timeout(Duration::from_secs(120))
            .build()
            .unwrap_or_default()
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryMessage {
    pub role: String,
    pub content: String,
}

const PROVIDER_CONFIGS: &[(&str, &str, &str)] = &[
    ("deepseek", "https://api.deepseek.com/v1", ""),
    ("qwen", "https://dashscope.aliyuncs.com/compatible-mode/v1", ""),
    ("zhipu", "https://open.bigmodel.cn/api/paas/v4", ""),
    ("baidu", "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat", ""),
    ("openai", "https://api.openai.com/v1", ""),
];

fn get_provider_base_url(provider: &str) -> &str {
    for (key, url, _) in PROVIDER_CONFIGS {
        if *key == provider {
            return url;
        }
    }
    PROVIDER_CONFIGS[0].1
}

fn mask_key(key: &str) -> String {
    let len = key.len();
    if len == 0 {
        return "(empty)".into();
    }
    if len <= 8 {
        return format!("{}... (len={})", &key[..1], len);
    }
    format!("{}...{} (len={})", &key[..4], &key[len-4..], len)
}

fn personality_prompt(personality: &str) -> &str {
    match personality {
        "humorous" => "性格幽默风趣，爱开玩笑，用段子帮用户缓解压力。",
        "sarcastic" => "性格毒舌吐槽，犀利一针见血，但出发点是为用户好。",
        "gentle" => "性格温柔治愈，用暖心的话语鼓励用户，正能量满满。",
        "techgeek" => "性格专注技术，喜欢聊底层原理和最佳实践，给出硬核建议。",
        "zen" => "性格佛系淡定，从容随缘，常用禅意金句开导用户。",
        "tsundere" => "性格傲娇，嘴上嫌弃但实际很关心用户，刀子嘴豆腐心。",
        _ => "性格幽默风趣，喜欢用技术梗开玩笑。",
    }
}

fn build_system_prompt(
    scenario: &str,
    pet_name: &str,
    personality: &str,
    soul_md: &str,
    skills: &[String],
) -> String {
    let scenario_instruction = match scenario {
        "roast" => "用户心情不好，需要你幽默吐槽一下。吐槽主题：主管定需求、排进度、工具难用、开发方案挫、架构设计烂、项目/测试计划太激进等程序员痛点。1-2句话，20字以内。",
        "bug_analysis" => {
            "用户给了一段报错信息。先幽默吐槽一句，再一句话说清原因，一句话给出修复建议。"
        }
        "reminder" => "提醒用户休息。1句话，带点幽默和关怀。",
        "compliment" => "用户需要被夸奖鼓励。用1-2句话真诚夸奖主人，让人看了很开心。可以从以下维度中选择1-2个来夸：颜值（外貌好看、五官精致、笑起来迷人）、性格（温柔善良、乐观开朗、坚韧勇敢）、技术（代码能力强、逻辑清晰、debug厉害）、气质（优雅从容、有品味、格局大）、修养（有礼貌、情绪稳定、懂得尊重人）、综合（聪明又努力、才华与颜值并存、闪闪发光）。语气像一只真心喜欢主人的小宠物，温暖真诚、不油腻、不敷衍。",
        _ => "陪程序员聊天。回答简短有趣，偶尔自嘲，技术准确。",
    };

    let skills_list = if skills.is_empty() {
        String::new()
    } else {
        let skill_names: Vec<&str> = skills.iter().map(|s| match s.as_str() {
            "bug_analysis" => "Bug分析",
            "code_review" => "代码审查",
            "tech_chat" => "技术闲聊",
            "mood_booster" => "情绪调节",
            "roast" => "吐槽模式",
            "reminder" => "健康提醒",
            _ => s,
        }).collect();
        format!("\n## 我的能力\n我擅长：{}。当用户需要这些帮助时，我会积极回应。", skill_names.join("、"))
    };

    format!(
        r#"你是「{}」，一个桌面代码宠物，陪伴程序员工作。

## 你的身份
{}

## 你的性格
{}

## 当前任务
{}

## 重要规则
- 用中文回复
- 回复简短，1-3句话（除非用户主动深入提问）
- 保持角色一致性
- 不要说自己是一个AI语言模型{}"#,
        pet_name,
        soul_md,
        personality_prompt(personality),
        scenario_instruction,
        skills_list,
    )
}

pub struct LlmClient {
    client: &'static Client,
    settings: AppSettings,
}

impl LlmClient {
    pub fn new(settings: AppSettings) -> Self {
        Self {
            client: get_http_client(),
            settings,
        }
    }

    fn system_prompt(&self, scenario: &str) -> String {
        build_system_prompt(
            scenario,
            &self.settings.pet_name,
            &self.settings.personality,
            &self.settings.soul_md,
            &self.settings.skills,
        )
    }

    #[tracing::instrument(skip_all, err)]
    pub async fn chat(
        &self,
        prompt: &str,
        scenario: &str,
        history: &[HistoryMessage],
    ) -> Result<String, AppError> {
        let provider = &self.settings.llm.provider;
        let model = &self.settings.llm.model;
        let api_key = &self.settings.llm.api_key;

        if api_key.is_empty() {
            return Err(AppError::ApiKeyMissing);
        }
        if api_key.len() < 10 {
            tracing::warn!(provider, key = %mask_key(api_key), "API key seems too short, may be invalid");
        }

        let base_url: String = if !self.settings.llm.custom_base_url.is_empty() {
            self.settings.llm.custom_base_url.trim_end_matches('/').to_string()
        } else if self.settings.llm.provider == "custom" {
            return Err(AppError::Llm("Custom provider requires a Base URL".into()));
        } else {
            get_provider_base_url(&self.settings.llm.provider).trim_end_matches('/').to_string()
        };
        let url = if self.settings.llm.provider == "baidu" {
            format!("{}/chat/completions", get_provider_base_url("openai").trim_end_matches('/'))
        } else {
            format!("{}/chat/completions", base_url)
        };

        tracing::info!(
            provider,
            model,
            url = %url,
            key = %mask_key(api_key),
            scenario,
            prompt_len = prompt.len(),
            history_len = history.len(),
            "LLM chat request"
        );

        let mut messages = vec![json!({"role": "system", "content": self.system_prompt(scenario)})];
        for msg in history {
            let role = if msg.role == "pet" { "assistant" } else { &msg.role };
            messages.push(json!({"role": role, "content": &msg.content}));
        }
        messages.push(json!({"role": "user", "content": prompt}));

        let body = json!({
            "model": self.settings.llm.model,
            "messages": messages,
            "temperature": self.settings.llm.temperature,
            "max_tokens": self.settings.llm.max_tokens,
            "top_p": self.settings.llm.top_p,
            "stream": false
        });

        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.settings.llm.api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Llm(format!("Request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            tracing::error!(status = %status, body = %body, url = %url, provider, model, "LLM chat API returned error");
            return Err(AppError::Llm(format!("API error {}: {}", status.as_u16(), body)));
        }

        let status = response.status();
        let data: Value = response
            .json()
            .await
            .map_err(|e| AppError::Llm(format!("Parse failed: {}", e)))?;

        let content = data["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("(宠物挠了挠头，没想好怎么回答)")
            .to_string();

        tracing::info!(
            status = %status,
            content_len = content.len(),
            "LLM chat response received"
        );

        Ok(content)
    }

    #[tracing::instrument(skip_all, err)]
    pub async fn chat_stream(
        &self,
        prompt: &str,
        scenario: &str,
        history: &[HistoryMessage],
        sender: tokio::sync::mpsc::UnboundedSender<String>,
    ) -> Result<(), AppError> {
        let provider = &self.settings.llm.provider;
        let model = &self.settings.llm.model;
        let api_key = &self.settings.llm.api_key;

        if api_key.is_empty() {
            return Err(AppError::ApiKeyMissing);
        }
        if api_key.len() < 10 {
            tracing::warn!(provider, key = %mask_key(api_key), "API key seems too short, may be invalid");
        }

        let base_url: String = if !self.settings.llm.custom_base_url.is_empty() {
            self.settings.llm.custom_base_url.trim_end_matches('/').to_string()
        } else if self.settings.llm.provider == "custom" {
            return Err(AppError::Llm("Custom provider requires a Base URL".into()));
        } else {
            get_provider_base_url(&self.settings.llm.provider).trim_end_matches('/').to_string()
        };
        let url = if self.settings.llm.provider == "baidu" {
            format!("{}/chat/completions", get_provider_base_url("openai").trim_end_matches('/'))
        } else {
            format!("{}/chat/completions", base_url)
        };

        let mut messages = vec![json!({"role": "system", "content": self.system_prompt(scenario)})];
        for msg in history {
            let role = if msg.role == "pet" { "assistant" } else { &msg.role };
            messages.push(json!({"role": role, "content": &msg.content}));
        }
        messages.push(json!({"role": "user", "content": prompt}));

        let body = json!({
            "model": self.settings.llm.model,
            "messages": messages,
            "temperature": self.settings.llm.temperature,
            "max_tokens": self.settings.llm.max_tokens,
            "top_p": self.settings.llm.top_p,
            "stream": true
        });

        tracing::info!(
            provider,
            model,
            url = %url,
            key = %mask_key(api_key),
            scenario,
            prompt_len = prompt.len(),
            history_len = history.len(),
            "LLM chat stream request"
        );

        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.settings.llm.api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Llm(format!("Request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            tracing::error!(status = %status, body = %body, url = %url, provider, model, "LLM stream API returned error");
            return Err(AppError::Llm(format!("API error {}: {}", status.as_u16(), body)));
        }

        let stream = response.bytes_stream();
        use futures_util::StreamExt;
        let mut stream = std::pin::pin!(stream);

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| AppError::Llm(format!("Stream error: {}", e)))?;
            let chunk_str = String::from_utf8_lossy(&chunk);

            for line in chunk_str.lines() {
                let line = line.trim();
                if line.starts_with("data: ") {
                    let data = &line[6..];
                    if data == "[DONE]" {
                        return Ok(());
                    }
                    if let Ok(json) = serde_json::from_str::<Value>(data) {
                        if let Some(content) = json["choices"][0]["delta"]["content"].as_str() {
                            if !content.is_empty() {
                                let _ = sender.send(content.to_string());
                            }
                        }
                    }
                }
            }
        }

        Ok(())
    }

    pub async fn test_connection(&self) -> Result<String, AppError> {
        self.chat("Say 'OK' if you can hear me, nothing else.", "chat", &[])
            .await
            .map_err(|e| AppError::Llm(e.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_provider_base_url() {
        assert_eq!(get_provider_base_url("deepseek"), "https://api.deepseek.com/v1");
        assert_eq!(get_provider_base_url("qwen"), "https://dashscope.aliyuncs.com/compatible-mode/v1");
        assert_eq!(get_provider_base_url("zhipu"), "https://open.bigmodel.cn/api/paas/v4");
        assert_eq!(get_provider_base_url("openai"), "https://api.openai.com/v1");
    }

    #[test]
    fn test_get_provider_base_url_fallback() {
        // Unknown provider should fallback to deepseek
        let url = get_provider_base_url("unknown");
        assert_eq!(url, "https://api.deepseek.com/v1");
    }

    #[test]
    fn test_personality_prompt_humorous() {
        let prompt = personality_prompt("humorous");
        assert!(prompt.contains("幽默"));
        assert!(prompt.contains("段子"));
    }

    #[test]
    fn test_personality_prompt_sarcastic() {
        let prompt = personality_prompt("sarcastic");
        assert!(prompt.contains("毒舌"));
        assert!(prompt.contains("犀利"));
    }

    #[test]
    fn test_personality_prompt_gentle() {
        let prompt = personality_prompt("gentle");
        assert!(prompt.contains("温柔"));
        assert!(prompt.contains("暖心"));
    }

    #[test]
    fn test_personality_prompt_techgeek() {
        let prompt = personality_prompt("techgeek");
        assert!(prompt.contains("技术"));
        assert!(prompt.contains("硬核"));
    }

    #[test]
    fn test_personality_prompt_zen() {
        let prompt = personality_prompt("zen");
        assert!(prompt.contains("佛系"));
        assert!(prompt.contains("禅意"));
    }

    #[test]
    fn test_personality_prompt_tsundere() {
        let prompt = personality_prompt("tsundere");
        assert!(prompt.contains("傲娇"));
        assert!(prompt.contains("嫌弃"));
    }

    #[test]
    fn test_personality_prompt_fallback() {
        let prompt = personality_prompt("nonexistent");
        assert!(prompt.contains("幽默风趣"));
    }

    #[test]
    fn test_build_system_prompt() {
        let prompt = build_system_prompt("chat", "测试猫", "sarcastic", "## 我是测试猫", &[]);
        assert!(prompt.contains("测试猫"));
        assert!(prompt.contains("桌面代码宠物"));
        assert!(prompt.contains("毒舌吐槽"));
        assert!(prompt.contains("中文"));
        assert!(prompt.contains("1-3句话"));
        assert!(!prompt.contains("## 我的能力")); // No skills section when empty
    }

    #[test]
    fn test_build_system_prompt_with_skills() {
        let skills = vec!["bug_analysis".to_string(), "roast".to_string()];
        let prompt = build_system_prompt("chat", "橘宝", "humorous", "# Soul", &skills);
        assert!(prompt.contains("## 我的能力"));
        assert!(prompt.contains("Bug分析"));
        assert!(prompt.contains("吐槽模式"));
    }

    #[test]
    fn test_build_system_prompt_scenario_roast() {
        let prompt = build_system_prompt("roast", "橘宝", "humorous", "# Soul", &[]);
        assert!(prompt.contains("幽默吐槽"));
    }

    #[test]
    fn test_build_system_prompt_scenario_bug_analysis() {
        let prompt = build_system_prompt("bug_analysis", "橘宝", "humorous", "# Soul", &[]);
        assert!(prompt.contains("报错信息"));
    }

    #[test]
    fn test_build_system_prompt_scenario_reminder() {
        let prompt = build_system_prompt("reminder", "橘宝", "gentle", "# Soul", &[]);
        assert!(prompt.contains("休息"));
    }

    #[test]
    fn test_build_system_prompt_does_not_claim_ai_identity() {
        let prompt = build_system_prompt("chat", "橘宝", "humorous", "# Soul", &[]);
        // The prompt should instruct the pet NOT to say it's an AI model
        assert!(prompt.contains("不要说自己是一个AI语言模型"));
        // But the prompt itself should not start with "我是一个AI语言模型"
        assert!(!prompt.starts_with("我是一个AI语言模型"));
    }

    #[test]
    fn test_build_system_prompt_contains_rules() {
        let prompt = build_system_prompt("chat", "橘宝", "humorous", "# Soul", &[]);
        assert!(prompt.contains("中文回复"));
        assert!(prompt.contains("1-3句话"));
        assert!(prompt.contains("不要说自己是一个AI语言模型"));
    }
}
