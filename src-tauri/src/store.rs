use crate::app_config::MultiAppConfig;
use std::sync::Mutex;

/// 全局应用状态
pub struct AppState {
    pub config: Mutex<MultiAppConfig>,
}

impl AppState {
    /// 创建新的应用状态
    pub fn new() -> Self {
        let config = MultiAppConfig::load().unwrap_or_else(|e| {
            log::warn!("加载配置失败: {}, 使用默认配置", e);
            MultiAppConfig::default()
        });

        Self {
            config: Mutex::new(config),
        }
    }

    /// 保存配置到文件
    pub fn save(&self) -> Result<(), String> {
        let config = self
            .config
            .lock()
            .map_err(|e| format!("获取锁失败: {}", e))?;

        config.save()
    }
}
