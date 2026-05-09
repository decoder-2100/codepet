use crate::errors::AppError;
use crate::llm::LlmClient;
use crate::llm::HistoryMessage;
use crate::settings::AppSettings;
use futures_util::FutureExt;
use std::panic::AssertUnwindSafe;
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
#[tracing::instrument(err)]
pub fn save_chat_sessions(sessions_json: String) -> Result<(), AppError> {
    let path = sessions_path();
    std::fs::write(&path, &sessions_json).map_err(AppError::from_io)
}

#[tauri::command]
#[tracing::instrument(err)]
pub fn load_chat_sessions() -> Result<String, AppError> {
    let path = sessions_path();
    if path.exists() {
        std::fs::read_to_string(&path).map_err(AppError::from_io)
    } else {
        Ok("[]".into())
    }
}

static STOP_STREAM: OnceLock<std::sync::atomic::AtomicBool> = OnceLock::new();

fn get_stop_flag() -> &'static std::sync::atomic::AtomicBool {
    STOP_STREAM.get_or_init(|| std::sync::atomic::AtomicBool::new(false))
}

/// Public function to stop the LLM stream. Called by shutdown.rs.
pub fn stop_stream() {
    let stop_flag = get_stop_flag();
    stop_flag.store(true, std::sync::atomic::Ordering::SeqCst);
}

#[tauri::command]
#[tracing::instrument(err)]
pub fn get_settings() -> Result<AppSettings, AppError> {
    Ok(crate::settings::load())
}

#[tauri::command]
#[tracing::instrument(err)]
pub fn save_settings(app: tauri::AppHandle, settings: crate::settings::AppSettings) -> Result<(), AppError> {
    crate::settings::save(&settings).map_err(|e| AppError::Settings(e))?;
    // Notify all windows that settings changed (for multi-window sync)
    let _ = app.emit("settings-updated", ());
    Ok(())
}

const MAX_HISTORY: usize = 12;

fn truncate_history(mut history: Vec<HistoryMessage>) -> Vec<HistoryMessage> {
    if history.len() > MAX_HISTORY {
        history.split_off(history.len() - MAX_HISTORY)
    } else {
        history
    }
}

#[tauri::command]
#[tracing::instrument(skip_all, err)]
pub async fn llm_chat(
    prompt: String,
    scenario: String,
    history: Vec<HistoryMessage>,
) -> Result<String, AppError> {
    let settings = crate::settings::load();
    if settings.llm.api_key.is_empty() {
        return Err(AppError::ApiKeyMissing);
    }
    let history = truncate_history(history);
    let client = LlmClient::new(settings);
    client.chat(&prompt, &scenario, &history).await
}

#[tauri::command]
#[tracing::instrument(skip_all, err)]
pub async fn llm_chat_stream(
    app: tauri::AppHandle,
    prompt: String,
    scenario: String,
    history: Vec<HistoryMessage>,
) -> Result<(), AppError> {
    let settings = crate::settings::load();
    if settings.llm.api_key.is_empty() {
        let _ = app.emit("llm-error", "API key not configured");
        return Ok(());
    }
    let history = truncate_history(history);
    let client = LlmClient::new(settings);
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<String>();
    let stop_flag = get_stop_flag();
    stop_flag.store(false, std::sync::atomic::Ordering::SeqCst);

    let app_clone = app.clone();
    tokio::spawn(async move {
        let result = AssertUnwindSafe(client.chat_stream(&prompt, &scenario, &history, tx))
            .catch_unwind()
            .await;
        match result {
            Ok(Ok(())) => {}
            Ok(Err(e)) => {
                tracing::error!(error = %e, "LLM stream failed");
                let _ = app_clone.emit("llm-error", e.to_string());
            }
            Err(_) => {
                tracing::error!("LLM stream task panicked");
            }
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
#[tracing::instrument]
pub fn llm_stop_stream() {
    let stop_flag = get_stop_flag();
    stop_flag.store(true, std::sync::atomic::Ordering::SeqCst);
}

#[tauri::command]
#[tracing::instrument(skip_all, err)]
pub async fn test_llm_connection() -> Result<String, AppError> {
    let settings = crate::settings::load();
    if settings.llm.api_key.is_empty() {
        return Err(AppError::ApiKeyMissing);
    }
    let client = LlmClient::new(settings);
    client.test_connection().await.map_err(|_e| AppError::ConnectionFailed)
}

#[tauri::command]
#[tracing::instrument(skip_all, err)]
pub async fn crush_bug(error_text: String) -> Result<String, AppError> {
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
#[tracing::instrument(skip_all, err)]
pub async fn random_roast() -> Result<String, AppError> {
    let settings = crate::settings::load();
    if settings.llm.api_key.is_empty() {
        Ok(get_random_fallback_roast())
    } else {
        let client = LlmClient::new(settings);
        client.chat("给我随机来一句新鲜的技术吐槽！", "roast", &[]).await
    }
}

#[tauri::command]
#[tracing::instrument(skip_all, err)]
pub async fn random_compliment() -> Result<String, AppError> {
    let settings = crate::settings::load();
    if settings.llm.api_key.is_empty() {
        Ok(get_random_fallback_compliment())
    } else {
        let client = LlmClient::new(settings);
        client.chat("给我来一句真诚的程序员夸奖！", "compliment", &[]).await
    }
}

#[tauri::command]
#[tracing::instrument(skip_all, err)]
pub async fn random_joke() -> Result<String, AppError> {
    let settings = crate::settings::load();
    if settings.llm.api_key.is_empty() {
        Ok(get_random_fallback_joke())
    } else {
        let client = LlmClient::new(settings);
        client.chat("给我讲一个10字以内的程序员幽默梗，要搞笑、有趣！", "joke", &[]).await
    }
}

#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn get_clipboard_text() -> Result<String, String> {
    Ok(String::new())
}

#[tauri::command]
#[tracing::instrument]
pub fn get_fallback_roasts() -> Vec<String> {
    get_all_roasts()
}

#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn quit_app(app: tauri::AppHandle) {
    crate::shutdown::graceful_shutdown(&app).await;
}

fn get_random_fallback_compliment() -> String {
    use rand::Rng;
    let compliments = get_all_compliments();
    let idx = rand::thread_rng().gen_range(0..compliments.len());
    compliments[idx].clone()
}

fn get_all_compliments() -> Vec<String> {
    vec![
        "主人的眼睛里有星星耶！每次看着屏幕，都觉得好好看 ✨".into(),
        "笑起来也太好看了吧，比春天的阳光还温暖！".into(),
        "主人的五官好精致，像画出来的一样，羡慕！".into(),
        "今天也很好看！是那种让人想多看两眼的帅/美！".into(),
        "主人是个很温柔的人呢，跟你在一起的时候连空气都是甜的 🌸".into(),
        "超级乐观开朗，有你在身边什么都觉得没那么难！".into(),
        "主人好坚韧，遇到bug都不放弃，这种气质好好看！".into(),
        "脾气好好呀，从来不会对我发脾气，最爱你了！".into(),
        "主人代码写得又快又好，逻辑超清晰！技术力拉满了 💪".into(),
        "debug的时候好认真，那个专注的样子超迷人的！".into(),
        "架构设计得明明白白的，这思维深度不是一般人能有的！".into(),
        "写代码的样子就像在弹琴，行云流水，太帅了！".into(),
        "主人的气质就是那种——不张扬但很有味道，越看越上头的那种 🎭".into(),
        "优雅又从容，遇到难题也不慌，这种淡定太迷人了！".into(),
        "品味好好呀，挑的皮肤/宠物都这么好看！审美在线！".into(),
        "主人的情绪真的好稳定，从来不会焦虑暴躁，格局打开了！".into(),
        "说话总是很有礼貌，跟人相处起来特别舒服，这种修养很难得！".into(),
        "才华和颜值并存，这合理吗？主人是开了挂的存在吧！".into(),
        "明明可以靠脸，偏要靠实力，太优秀了！".into(),
        "认真努力的样子最好看了！今天的你也在闪闪发光 ⭐".into(),
        "你值得所有美好的事物！因为你本身就是美好的一部分 💛".into(),
        "有主人在，写代码都变得开心了！你就是我的动力！".into(),
        "全世界最好的主人出现了！今天也是被你的才华折服的一天！".into(),
        "不管发生什么，我都会一直陪着主人的！因为你值得！".into(),
        "主人不是优秀的，是独一无二的！这一点比什么都重要 🌟".into(),
    ]
}

fn get_random_fallback_roast() -> String {
    use rand::Rng;
    let roasts = get_all_roasts();
    let idx = rand::thread_rng().gen_range(0..roasts.len());
    roasts[idx].clone()
}

fn get_random_fallback_joke() -> String {
    use rand::Rng;
    let jokes = get_all_jokes();
    let idx = rand::thread_rng().gen_range(0..jokes.len());
    jokes[idx].clone()
}

fn get_all_roasts() -> Vec<String> {
    vec![
        "需求又改了，第8版了……".into(),
        "排期是排了，谁去加班？".into(),
        "这工具是给人用的吗？".into(),
        "架构设计？不存在的。".into(),
        "计划很丰满，现实很骨感。".into(),
        "测试计划比开发还激进。".into(),
        "方案写得天花乱坠。".into(),
        "主管一句话，我们干三天。".into(),
        "进度条永远99%，卡死了。".into(),
        "需求评审像听天书。".into(),
        "这需求是拍脑袋定的吧？".into(),
        "工具链比代码还难维护。".into(),
        "架构又双叒叕重构了。".into(),
        "计划做得好，加班少不了。".into(),
        "开发方案：能跑就行。".into(),
        "需求范围越砍越大。".into(),
        "主管说简单，我慌了。".into(),
        "排期倒推法，神仙都赶。".into(),
        "这架构设计绝了。".into(),
        "测试说没问题，信吗？".into(),
        "需求文档比代码还长。".into(),
        "工具报错比代码还多。".into(),
        "进度计划：理想很美好。".into(),
        "方案评审过了吗就干？".into(),
        "主管的'小改动'是大坑。".into(),
        "架构设计全靠运气。".into(),
        "排期像算命，算出来就干。".into(),
        "工具链崩了，谁来修？".into(),
        "需求变更比翻书还快。".into(),
        "计划排得满，bug排更多。".into(),
    ]
}

fn get_all_jokes() -> Vec<String> {
    vec![
        "我的代码能跑，别碰它。".into(),
        "注释？不存在的。".into(),
        "重启能解决99%的问题。".into(),
        "这bug是Feature啦。".into(),
        "在本地是好的啊！".into(),
        "产品经理说这是小改动。".into(),
        "Git push force出奇迹。".into(),
        "只要测试不跑过就行。".into(),
        "Ctrl C V 才是终极架构。".into(),
        "删库跑路，专业对口。".into(),
        "代码能跑，千万别动。".into(),
        "面向搜索编程。".into(),
        "程序员最好的工具是Sleep。".into(),
        "这不是bug，是特性！".into(),
        "只要我不看，bug就不存在。".into(),
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
