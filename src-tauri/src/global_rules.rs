use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

/// Claude 全局规则文件路径
pub fn get_claude_rules_path() -> Result<PathBuf, String> {
    let claude_dir = if let Some(custom) = crate::settings::get_claude_override_dir() {
        custom
    } else {
        dirs::home_dir()
            .ok_or_else(|| "无法获取用户主目录".to_string())?
            .join(".claude")
    };
    Ok(claude_dir.join("CLAUDE.md"))
}

/// Codex 规则目录路径
pub fn get_codex_rules_dir() -> Result<PathBuf, String> {
    let codex_dir = crate::codex_config::get_codex_config_dir();
    Ok(codex_dir.join("rules"))
}

/// Codex 规则文件信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexRuleFile {
    pub name: String,
    pub path: String,
    pub tags: Vec<String>,
    pub content: String,
}

/// 读取 Claude 全局规则
pub fn read_claude_rules() -> Result<String, String> {
    let path = get_claude_rules_path()?;
    if !path.exists() {
        return Ok(String::new());
    }
    fs::read_to_string(&path).map_err(|e| format!("读取 Claude 规则失败: {}", e))
}

/// 写入 Claude 全局规则
pub fn write_claude_rules(content: &str) -> Result<(), String> {
    let path = get_claude_rules_path()?;
    
    // 确保目录存在
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("创建 Claude 目录失败: {}", e))?;
    }
    
    fs::write(&path, content).map_err(|e| format!("写入 Claude 规则失败: {}", e))
}

/// 列出 Codex 规则文件
pub fn list_codex_rules() -> Result<Vec<CodexRuleFile>, String> {
    let rules_dir = get_codex_rules_dir()?;
    
    if !rules_dir.exists() {
        return Ok(Vec::new());
    }
    
    let mut rules = Vec::new();
    let entries = fs::read_dir(&rules_dir)
        .map_err(|e| format!("读取 Codex 规则目录失败: {}", e))?;
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("读取目录项失败: {}", e))?;
        let path = entry.path();
        
        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") {
            let name = path
                .file_name()
                .and_then(|s| s.to_str())
                .unwrap_or("")
                .to_string();
            
            let content = fs::read_to_string(&path)
                .map_err(|e| format!("读取规则文件 {} 失败: {}", name, e))?;
            
            rules.push(CodexRuleFile {
                name: name.clone(),
                path: path.to_string_lossy().to_string(),
                tags: Vec::new(), // 标签从 config.toml 中读取
                content,
            });
        }
    }
    
    // 从 config.toml 中读取标签信息
    if let Ok(config_rules) = read_codex_rules_config() {
        for rule in &mut rules {
            if let Some(config_rule) = config_rules.iter().find(|r| {
                Path::new(&r.path)
                    .file_name()
                    .and_then(|s| s.to_str())
                    == Some(&rule.name)
            }) {
                rule.tags = config_rule.tags.clone();
            }
        }
    }
    
    Ok(rules)
}

/// 读取 Codex 规则文件
pub fn read_codex_rule(filename: &str) -> Result<String, String> {
    let rules_dir = get_codex_rules_dir()?;
    let path = rules_dir.join(filename);
    
    if !path.exists() {
        return Err(format!("规则文件不存在: {}", filename));
    }
    
    fs::read_to_string(&path).map_err(|e| format!("读取规则文件失败: {}", e))
}

/// 写入 Codex 规则文件
pub fn write_codex_rule(filename: &str, content: &str, tags: Vec<String>) -> Result<(), String> {
    let rules_dir = get_codex_rules_dir()?;
    
    // 确保目录存在
    fs::create_dir_all(&rules_dir)
        .map_err(|e| format!("创建 Codex 规则目录失败: {}", e))?;
    
    let path = rules_dir.join(filename);
    fs::write(&path, content).map_err(|e| format!("写入规则文件失败: {}", e))?;
    
    // 更新 config.toml
    update_codex_rules_config(filename, tags)?;
    
    Ok(())
}

/// 删除 Codex 规则文件
pub fn delete_codex_rule(filename: &str) -> Result<(), String> {
    let rules_dir = get_codex_rules_dir()?;
    let path = rules_dir.join(filename);
    
    if !path.exists() {
        return Err(format!("规则文件不存在: {}", filename));
    }
    
    fs::remove_file(&path).map_err(|e| format!("删除规则文件失败: {}", e))?;
    
    // 从 config.toml 中移除
    remove_from_codex_rules_config(filename)?;
    
    Ok(())
}

/// Codex 规则配置项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodexRuleConfig {
    pub path: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub tags: Vec<String>,
}

/// 读取 Codex config.toml 中的规则配置
pub fn read_codex_rules_config() -> Result<Vec<CodexRuleConfig>, String> {
    let config_text = crate::codex_config::read_codex_config_text()?;
    if config_text.trim().is_empty() {
        return Ok(Vec::new());
    }
    
    let root: toml::Table = toml::from_str(&config_text)
        .map_err(|e| format!("解析 config.toml 失败: {}", e))?;
    
    let rules_table = root
        .get("rules")
        .and_then(|v| v.as_table())
        .ok_or_else(|| "config.toml 中没有 [rules] 段".to_string())?;
    
    let global_array = rules_table
        .get("global")
        .and_then(|v| v.as_array())
        .ok_or_else(|| "[rules] 段中没有 global 数组".to_string())?;
    
    let mut rules = Vec::new();
    for item in global_array {
        let table = item
            .as_table()
            .ok_or_else(|| "规则项必须是表".to_string())?;
        
        let path = table
            .get("path")
            .and_then(|v| v.as_str())
            .ok_or_else(|| "规则项缺少 path 字段".to_string())?
            .to_string();
        
        let tags = table
            .get("tags")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default();
        
        rules.push(CodexRuleConfig { path, tags });
    }
    
    Ok(rules)
}

/// 更新 Codex config.toml 中的规则配置
fn update_codex_rules_config(filename: &str, tags: Vec<String>) -> Result<(), String> {
    let config_path = crate::codex_config::get_codex_config_path();
    let config_text = crate::codex_config::read_codex_config_text()?;
    
    let mut root: toml::Table = if config_text.trim().is_empty() {
        toml::Table::new()
    } else {
        toml::from_str(&config_text)
            .map_err(|e| format!("解析 config.toml 失败: {}", e))?
    };
    
    // 获取或创建 [rules] 段
    let rules_table = root
        .entry("rules".to_string())
        .or_insert_with(|| toml::Value::Table(toml::Table::new()))
        .as_table_mut()
        .ok_or_else(|| "[rules] 必须是表".to_string())?;
    
    // 获取或创建 global 数组
    let global_array = rules_table
        .entry("global".to_string())
        .or_insert_with(|| toml::Value::Array(Vec::new()))
        .as_array_mut()
        .ok_or_else(|| "global 必须是数组".to_string())?;
    
    // 构建规则路径
    let rules_dir = get_codex_rules_dir()?;
    let rule_path = rules_dir.join(filename);
    let path_str = rule_path.to_string_lossy().to_string();
    
    // 查找是否已存在
    let existing_index = global_array.iter().position(|item| {
        item.as_table()
            .and_then(|t| t.get("path"))
            .and_then(|v| v.as_str())
            .map(|p| Path::new(p).file_name() == Path::new(&path_str).file_name())
            .unwrap_or(false)
    });
    
    // 构建新的规则项
    let mut rule_table = toml::Table::new();
    rule_table.insert("path".to_string(), toml::Value::String(path_str));
    if !tags.is_empty() {
        rule_table.insert(
            "tags".to_string(),
            toml::Value::Array(tags.into_iter().map(toml::Value::String).collect()),
        );
    }
    
    if let Some(index) = existing_index {
        global_array[index] = toml::Value::Table(rule_table);
    } else {
        global_array.push(toml::Value::Table(rule_table));
    }
    
    // 写回文件
    let new_config = toml::to_string_pretty(&root)
        .map_err(|e| format!("序列化 config.toml 失败: {}", e))?;
    
    fs::write(&config_path, new_config)
        .map_err(|e| format!("写入 config.toml 失败: {}", e))?;
    
    Ok(())
}

/// 从 Codex config.toml 中移除规则配置
fn remove_from_codex_rules_config(filename: &str) -> Result<(), String> {
    let config_path = crate::codex_config::get_codex_config_path();
    let config_text = crate::codex_config::read_codex_config_text()?;
    
    if config_text.trim().is_empty() {
        return Ok(());
    }
    
    let mut root: toml::Table = toml::from_str(&config_text)
        .map_err(|e| format!("解析 config.toml 失败: {}", e))?;
    
    if let Some(rules_table) = root.get_mut("rules").and_then(|v| v.as_table_mut()) {
        if let Some(global_array) = rules_table.get_mut("global").and_then(|v| v.as_array_mut()) {
            global_array.retain(|item| {
                item.as_table()
                    .and_then(|t| t.get("path"))
                    .and_then(|v| v.as_str())
                    .map(|p| {
                        Path::new(p).file_name().and_then(|f| f.to_str()) != Some(filename)
                    })
                    .unwrap_or(true)
            });
        }
    }
    
    let new_config = toml::to_string_pretty(&root)
        .map_err(|e| format!("序列化 config.toml 失败: {}", e))?;
    
    fs::write(&config_path, new_config)
        .map_err(|e| format!("写入 config.toml 失败: {}", e))?;
    
    Ok(())
}

