use crate::llm::LlmClient;
use crate::llm::HistoryMessage;
use crate::settings::AppSettings;
use std::path::PathBuf;
use std::sync::OnceLock;
use tauri::Emitter;

fn sessions_path() -> PathBuf {
    let mut path = std::env::current_exe()
        .unwrap_or_default()
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_default();
    path.push("coderpet_sessions.json");
    path
}

#[tauri::command]
pub fn save_chat_sessions(sessions_json: String) -> Result<(), String> {
    let path = sessions_path();
    std::fs::write(&path, &sessions_json).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_chat_sessions() -> Result<String, String> {
    let path = sessions_path();
    if path.exists() {
        std::fs::read_to_string(&path).map_err(|e| e.to_string())
    } else {
        Ok("[]".into())
    }
}

static STOP_STREAM: OnceLock<std::sync::atomic::AtomicBool> = OnceLock::new();

fn get_stop_flag() -> &'static std::sync::atomic::AtomicBool {
    STOP_STREAM.get_or_init(|| std::sync::atomic::AtomicBool::new(false))
}

#[tauri::command]
pub fn get_settings() -> AppSettings {
    crate::settings::load()
}

#[tauri::command]
pub fn save_settings(settings: AppSettings) -> Result<(), String> {
    crate::settings::save(&settings)
}

#[tauri::command]
pub async fn llm_chat(prompt: String, scenario: String, history: Vec<HistoryMessage>) -> Result<String, String> {
    let settings = crate::settings::load();
    if settings.llm.api_key.is_empty() {
        return Err("API key not configured".into());
    }
    let client = LlmClient::new(settings);
    client.chat(&prompt, &scenario, &history).await
}

#[tauri::command]
pub async fn llm_chat_stream(
    app: tauri::AppHandle,
    prompt: String,
    scenario: String,
    history: Vec<HistoryMessage>,
) -> Result<(), String> {
    let settings = crate::settings::load();
    if settings.llm.api_key.is_empty() {
        let _ = app.emit("llm-error", "API key not configured");
        return Ok(());
    }
    let client = LlmClient::new(settings);
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<String>();
    let stop_flag = get_stop_flag();
    stop_flag.store(false, std::sync::atomic::Ordering::SeqCst);

    let app_clone = app.clone();
    tokio::spawn(async move {
        if let Err(e) = client.chat_stream(&prompt, &scenario, &history, tx).await {
            let _ = app_clone.emit("llm-error", e);
        }
        let _ = app_clone.emit("llm-done", ());
    });

    let app_clone = app.clone();
    tokio::spawn(async move {
        while let Some(token) = rx.recv().await {
            if stop_flag.load(std::sync::atomic::Ordering::SeqCst) {
                break;
            }
            let _ = app_clone.emit("llm-token", token);
        }
    });

    Ok(())
}

#[tauri::command]
pub fn llm_stop_stream() {
    let stop_flag = get_stop_flag();
    stop_flag.store(true, std::sync::atomic::Ordering::SeqCst);
}

#[tauri::command]
pub async fn test_llm_connection() -> Result<String, String> {
    let settings = crate::settings::load();
    if settings.llm.api_key.is_empty() {
        return Err("请先在设置中填写 API Key".into());
    }
    let client = LlmClient::new(settings);
    client.test_connection().await
}

#[tauri::command]
pub async fn crush_bug(error_text: String) -> Result<String, String> {
    let settings = crate::settings::load();
    if settings.llm.api_key.is_empty() {
        Ok(get_fallback_crush_response(&error_text))
    } else {
        let client = LlmClient::new(settings);
        let analysis = client.chat(&error_text, "bug_analysis", &[]).await?;
        Ok(analysis)
    }
}

#[tauri::command]
pub async fn random_roast() -> Result<String, String> {
    let settings = crate::settings::load();
    if settings.llm.api_key.is_empty() {
        Ok(get_random_fallback_roast())
    } else {
        let client = LlmClient::new(settings);
        client.chat("给我随机来一句新鲜的技术吐槽！", "roast", &[]).await
    }
}

#[tauri::command]
pub async fn random_compliment() -> Result<String, String> {
    let settings = crate::settings::load();
    if settings.llm.api_key.is_empty() {
        Ok(get_random_fallback_compliment())
    } else {
        let client = LlmClient::new(settings);
        client.chat("给我来一句真诚的程序员夸奖！", "compliment", &[]).await
    }
}

#[tauri::command]
pub async fn get_clipboard_text() -> Result<String, String> {
    Ok(String::new())
}

#[tauri::command]
pub fn get_fallback_roasts() -> Vec<String> {
    get_all_roasts()
}

fn get_random_fallback_compliment() -> String {
    use rand::Rng;
    let compliments = get_all_compliments();
    let idx = rand::thread_rng().gen_range(0..compliments.len());
    compliments[idx].clone()
}

fn get_all_compliments() -> Vec<String> {
    vec![
        "你的代码写得真优雅，像诗一样！".into(),
        "这逻辑思维能力，绝了！".into(),
        "Bug见了你都绕道走，真的！".into(),
        "你就是传说中的十倍程序员吧？".into(),
        "这重构思路，教科书级别的！".into(),
        "你的注释写得比文档还好！".into(),
        "跟你结对编程简直是享受。".into(),
        "这命名功底，一看就是老手！".into(),
        "你的PR我都看得赏心悦目。".into(),
        "能写出这种代码的人，一定很帅！".into(),
    ]
}

fn get_random_fallback_roast() -> String {
    use rand::Rng;
    let roasts = get_all_roasts();
    let idx = rand::thread_rng().gen_range(0..roasts.len());
    roasts[idx].clone()
}

fn get_all_roasts() -> Vec<String> {
    vec![
        "这个需求的复杂度，相当于用CSS画3D地球——能实现，但没必要。".into(),
        "这个bug不是你的问题，是电脑觉得你太累了，故意给你找点乐子。".into(),
        "产品经理的需求文档，大概是用《圣经》的篇幅写了篇《三体》的复杂度。".into(),
        "你的代码缩进，比我的周末计划还混乱。".into(),
        "这个NullPointerException，已经被我回收了！".into(),
        "你管这叫hotfix？这明明是nuclear option。".into(),
        "项目经理说'加个小功能'，相当于说'在珠峰顶上加个避暑山庄'。".into(),
        "编译不过？不，是你的代码在抗议。".into(),
        "这个bug的年龄，比公司里一半实习生的工龄还长。".into(),
        "你的代码不是有bug，是有feature在叛逆期。".into(),
        "这个PR的commit数量，比你这周的咖啡摄入量还多。".into(),
        "你的代码只有机器能看懂——毕竟它是一堆乱码。".into(),
        "这个需求不是需求，是需求经理的幻觉。".into(),
        "你把代码写成这样，编译器都要工伤了。".into(),
        "这个bug的根因是：你上周没写测试。".into(),
        "CTRL+C和CTRL+V是你用得最熟的快捷键吧？".into(),
        "你的log打得比你的commit message还有感情。".into(),
        "这个函数太长了，它应该有自己的邮政编码。".into(),
        "你的TODO注释，比你的实际代码还多。".into(),
        "代码能跑就别动——你的座右铭是吧？".into(),
        "这个注释比代码还老，是上个世纪留下来的吧？".into(),
        "合并冲突不是冲突，是代码在吵架。".into(),
        "你写的不是代码，是给接盘侠的谜题。".into(),
        "这个API设计得很优雅——和你的代码形成鲜明对比。".into(),
        "你管这叫架构？这明明是意大利面条。".into(),
        "这个变量名取得好，没人能猜到它是干什么的。".into(),
        "你的代码质量：能跑、但别问怎么跑的。".into(),
        "这个class的职责太多了，它需要看心理医生。".into(),
        "你的正则表达式让我想起了古代咒语。".into(),
        "删代码比写代码快乐，所以你一直在删需求对吗？".into(),
    ]
}

fn get_fallback_crush_response(error: &str) -> String {
    let lines: Vec<&str> = error.lines().filter(|l| !l.is_empty()).collect();
    let keyword = lines.first().unwrap_or(&"未知错误");
    format!(
        "╔══════════════════════╗\n\
         ║   Bug 粉碎报告        ║\n\
         ╠══════════════════════╣\n\
         ║ 目标: {}  ║\n\
         ║ 状态: ✅ 已粉碎       ║\n\
         ║ 建议: 重启试试        ║\n\
         ╚══════════════════════╝\n\
         (这个错误已经被宠物吞掉了，安心吧)",
        if keyword.len() > 14 {
            format!("{}...", &keyword[..14])
        } else {
            keyword.to_string()
        }
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_all_roasts_count() {
        let roasts = get_all_roasts();
        assert!(roasts.len() >= 30);
    }

    #[test]
    fn test_get_all_roasts_are_chinese() {
        let roasts = get_all_roasts();
        for r in &roasts {
            assert!(r.chars().any(|c| c >= '\u{4e00}'), "Roast '{}' contains no Chinese characters", r);
        }
    }

    #[test]
    fn test_get_fallback_roasts_returns_all_roasts() {
        let roasts = get_fallback_roasts();
        assert_eq!(roasts.len(), get_all_roasts().len());
    }

    #[test]
    fn test_get_random_fallback_roast_returns_valid() {
        let roast = get_random_fallback_roast();
        assert!(roast.len() > 0);
        let all = get_all_roasts();
        assert!(all.contains(&roast));
    }

    #[test]
    fn test_fallback_crush_response_contains_error() {
        let result = get_fallback_crush_response("NullPointerException: object is null");
        assert!(result.contains("NullPointerExc"));
        assert!(result.contains("已粉碎"));
        assert!(result.contains("重启试试"));
    }

    #[test]
    fn test_fallback_crush_response_truncates_long_errors() {
        let long = "ThisErrorNameIsWayTooLongAndShouldBeTruncated";
        let result = get_fallback_crush_response(long);
        assert!(result.contains("ThisErrorNameI..."));
        assert!(!result.contains("ShouldBeTruncated"));
    }

    #[test]
    fn test_fallback_crush_response_handles_empty() {
        let result = get_fallback_crush_response("");
        assert!(result.contains("未知错误"));
        assert!(result.contains("已粉碎"));
    }

    #[test]
    fn test_fallback_crush_response_handles_multiline() {
        let multiline = "SyntaxError\n  at file.js:10\n  at another.js:20";
        let result = get_fallback_crush_response(multiline);
        assert!(result.contains("SyntaxError"));
        assert!(!result.contains("another.js"));
    }
}
