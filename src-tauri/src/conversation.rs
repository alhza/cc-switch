use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

/// 对话记录元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConversationMeta {
    pub id: String,
    pub app_type: String, // "claude" or "codex"
    pub file_path: String,
    pub file_size: u64,
    pub created_at: Option<i64>,
    pub modified_at: i64,
    pub message_count: usize,
    pub project_name: Option<String>, // Claude: 项目名称
    pub session_id: Option<String>,   // Codex: 会话ID
}

/// Claude 对话消息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeMessage {
    pub uuid: String,
    #[serde(rename = "parentUuid")]
    pub parent_uuid: Option<String>,
    #[serde(rename = "sessionId")]
    pub session_id: String,
    #[serde(rename = "type")]
    pub msg_type: String, // "user" or "assistant"
    pub timestamp: String,
    pub message: serde_json::Value,
}

/// Codex 对话消息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodexMessage {
    pub timestamp: String,
    #[serde(rename = "type")]
    pub msg_type: String,
    pub payload: serde_json::Value,
}

/// 获取 Claude 对话记录目录
fn get_claude_conversations_dir() -> PathBuf {
    if let Some(custom) = crate::settings::get_claude_override_dir() {
        return custom.join("projects");
    }
    dirs::home_dir()
        .expect("无法获取用户主目录")
        .join(".claude")
        .join("projects")
}

/// 获取 Codex 对话记录目录
fn get_codex_conversations_dir() -> PathBuf {
    if let Some(custom) = crate::settings::get_codex_override_dir() {
        return custom.join("sessions");
    }
    dirs::home_dir()
        .expect("无法获取用户主目录")
        .join(".codex")
        .join("sessions")
}

/// 列出 Claude 对话记录
pub fn list_claude_conversations() -> Result<Vec<ConversationMeta>, String> {
    let projects_dir = get_claude_conversations_dir();
    if !projects_dir.exists() {
        return Ok(Vec::new());
    }

    let mut conversations = Vec::new();

    // 遍历项目目录
    for entry in fs::read_dir(&projects_dir)
        .map_err(|e| format!("读取 Claude 项目目录失败: {}", e))?
    {
        let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
        let path = entry.path();

        // 跳过 .timelines 等特殊目录
        if path.is_dir() {
            let dir_name = path.file_name().unwrap().to_string_lossy().to_string();
            if dir_name.starts_with('.') {
                continue;
            }

            // 遍历项目下的 .jsonl 文件
            for file_entry in fs::read_dir(&path)
                .map_err(|e| format!("读取项目目录失败: {}", e))?
            {
                let file_entry = file_entry.map_err(|e| format!("读取文件项失败: {}", e))?;
                let file_path = file_entry.path();

                if file_path.extension().and_then(|s| s.to_str()) == Some("jsonl") {
                    if let Ok(meta) = get_claude_conversation_meta(&file_path, &dir_name) {
                        conversations.push(meta);
                    }
                }
            }
        }
    }

    // 按修改时间倒序排序
    conversations.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));

    Ok(conversations)
}

/// 获取 Claude 对话元数据
fn get_claude_conversation_meta(
    file_path: &Path,
    project_name: &str,
) -> Result<ConversationMeta, String> {
    let metadata = fs::metadata(file_path)
        .map_err(|e| format!("获取文件元数据失败: {}", e))?;

    let file_name = file_path
        .file_stem()
        .unwrap()
        .to_string_lossy()
        .to_string();

    // 读取文件统计消息数量
    let content = fs::read_to_string(file_path)
        .map_err(|e| format!("读取文件失败: {}", e))?;
    let message_count = content.lines().count();

    // 尝试读取第一条消息获取 sessionId
    let session_id = content
        .lines()
        .next()
        .and_then(|line| serde_json::from_str::<ClaudeMessage>(line).ok())
        .map(|msg| msg.session_id);

    let modified_at = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);

    let created_at = metadata
        .created()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64);

    Ok(ConversationMeta {
        id: file_name.clone(),
        app_type: "claude".to_string(),
        file_path: file_path.to_string_lossy().to_string(),
        file_size: metadata.len(),
        created_at,
        modified_at,
        message_count,
        project_name: Some(project_name.to_string()),
        session_id,
    })
}

/// 列出 Codex 对话记录
pub fn list_codex_conversations() -> Result<Vec<ConversationMeta>, String> {
    let sessions_dir = get_codex_conversations_dir();
    if !sessions_dir.exists() {
        return Ok(Vec::new());
    }

    let mut conversations = Vec::new();

    // 遍历年/月/日目录结构
    for year_entry in fs::read_dir(&sessions_dir)
        .map_err(|e| format!("读取 Codex 会话目录失败: {}", e))?
    {
        let year_entry = year_entry.map_err(|e| format!("读取年份目录失败: {}", e))?;
        let year_path = year_entry.path();

        if !year_path.is_dir() {
            continue;
        }

        for month_entry in fs::read_dir(&year_path)
            .map_err(|e| format!("读取月份目录失败: {}", e))?
        {
            let month_entry = month_entry.map_err(|e| format!("读取月份目录失败: {}", e))?;
            let month_path = month_entry.path();

            if !month_path.is_dir() {
                continue;
            }

            for day_entry in fs::read_dir(&month_path)
                .map_err(|e| format!("读取日期目录失败: {}", e))?
            {
                let day_entry = day_entry.map_err(|e| format!("读取日期目录失败: {}", e))?;
                let day_path = day_entry.path();

                if !day_path.is_dir() {
                    continue;
                }

                // 遍历日期目录下的 .jsonl 文件
                for file_entry in fs::read_dir(&day_path)
                    .map_err(|e| format!("读取会话文件失败: {}", e))?
                {
                    let file_entry = file_entry.map_err(|e| format!("读取文件项失败: {}", e))?;
                    let file_path = file_entry.path();

                    if file_path.extension().and_then(|s| s.to_str()) == Some("jsonl") {
                        if let Ok(meta) = get_codex_conversation_meta(&file_path) {
                            conversations.push(meta);
                        }
                    }
                }
            }
        }
    }

    // 按修改时间倒序排序
    conversations.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));

    Ok(conversations)
}

/// 获取 Codex 对话元数据
fn get_codex_conversation_meta(file_path: &Path) -> Result<ConversationMeta, String> {
    let metadata = fs::metadata(file_path)
        .map_err(|e| format!("获取文件元数据失败: {}", e))?;

    let file_name = file_path
        .file_stem()
        .unwrap()
        .to_string_lossy()
        .to_string();

    // 读取文件统计消息数量
    let content = fs::read_to_string(file_path)
        .map_err(|e| format!("读取文件失败: {}", e))?;
    let message_count = content.lines().count();

    // 尝试读取第一条消息获取 session_id
    let session_id = content
        .lines()
        .next()
        .and_then(|line| serde_json::from_str::<CodexMessage>(line).ok())
        .and_then(|msg| {
            if msg.msg_type == "session_meta" {
                msg.payload
                    .get("id")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
            } else {
                None
            }
        });

    let modified_at = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);

    let created_at = metadata
        .created()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64);

    Ok(ConversationMeta {
        id: file_name.clone(),
        app_type: "codex".to_string(),
        file_path: file_path.to_string_lossy().to_string(),
        file_size: metadata.len(),
        created_at,
        modified_at,
        message_count,
        project_name: None,
        session_id,
    })
}

/// 删除对话记录
pub fn delete_conversation(file_path: &str) -> Result<(), String> {
    let path = Path::new(file_path);
    if !path.exists() {
        return Err("文件不存在".to_string());
    }

    // 删除文件
    fs::remove_file(path).map_err(|e| format!("删除文件失败: {}", e))?;

    // 尝试清理空文件夹
    if let Some(parent) = path.parent() {
        cleanup_empty_directories(parent);
    }

    Ok(())
}

/// 递归清理空文件夹
fn cleanup_empty_directories(dir: &Path) {
    // 检查目录是否为空
    if let Ok(entries) = fs::read_dir(dir) {
        let count = entries.count();
        if count == 0 {
            // 目录为空,尝试删除
            if fs::remove_dir(dir).is_ok() {
                // 删除成功后,继续检查父目录
                if let Some(parent) = dir.parent() {
                    // 只清理 Codex 的日期目录结构 (sessions/year/month/day)
                    // 不要删除 sessions 根目录或 Claude 的 projects 目录
                    if parent.ends_with("sessions")
                        || parent.ends_with("projects")
                        || parent.file_name().is_none()
                    {
                        return;
                    }
                    cleanup_empty_directories(parent);
                }
            }
        }
    }
}

/// 搜索对话记录
pub fn search_conversations(
    app_type: Option<String>,
    keyword: &str,
) -> Result<Vec<ConversationMeta>, String> {
    let mut all_conversations = Vec::new();

    // 根据 app_type 决定搜索范围
    match app_type.as_deref() {
        Some("claude") => {
            all_conversations.extend(list_claude_conversations()?);
        }
        Some("codex") => {
            all_conversations.extend(list_codex_conversations()?);
        }
        _ => {
            // 搜索所有
            all_conversations.extend(list_claude_conversations()?);
            all_conversations.extend(list_codex_conversations()?);
        }
    }

    // 如果没有关键词,返回所有
    if keyword.is_empty() {
        return Ok(all_conversations);
    }

    // 过滤包含关键词的对话
    let keyword_lower = keyword.to_lowercase();
    let filtered: Vec<ConversationMeta> = all_conversations
        .into_iter()
        .filter(|conv| {
            conv.id.to_lowercase().contains(&keyword_lower)
                || conv
                    .project_name
                    .as_ref()
                    .map(|p| p.to_lowercase().contains(&keyword_lower))
                    .unwrap_or(false)
                || conv
                    .session_id
                    .as_ref()
                    .map(|s| s.to_lowercase().contains(&keyword_lower))
                    .unwrap_or(false)
        })
        .collect();

    Ok(filtered)
}

/// 读取对话内容
pub fn read_conversation_content(file_path: &str) -> Result<String, String> {
    let path = Path::new(file_path);
    if !path.exists() {
        return Err("文件不存在".to_string());
    }

    fs::read_to_string(path).map_err(|e| format!("读取文件失败: {}", e))
}

