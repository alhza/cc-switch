import { useState, useEffect } from "react";
import { Save, RotateCcw, AlertCircle } from "lucide-react";
import { buttonStyles } from "../../lib/styles";

interface ClaudeRulesEditorProps {
  onSave?: () => void;
}

export default function ClaudeRulesEditor({ onSave }: ClaudeRulesEditorProps) {
  const [content, setContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  useEffect(() => {
    setHasChanges(content !== originalContent);
  }, [content, originalContent]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const rules = await window.api.readClaudeRules();
      setContent(rules);
      setOriginalContent(rules);
    } catch (error) {
      console.error("加载 Claude 规则失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await window.api.writeClaudeRules(content);
      setOriginalContent(content);
      onSave?.();
    } catch (error) {
      console.error("保存 Claude 规则失败:", error);
      alert("保存失败: " + error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (hasChanges && !confirm("确定要放弃所有更改吗?")) {
      return;
    }
    setContent(originalContent);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Claude 全局规则
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            ~/.claude/CLAUDE.md
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-500 rounded-md font-medium inline-flex items-center gap-1">
              <AlertCircle size={12} />
              未保存
            </span>
          )}
          <button
            onClick={handleReset}
            disabled={!hasChanges || saving}
            className={`${buttonStyles.secondary} inline-flex items-center gap-2 ${!hasChanges || saving ? buttonStyles.disabled : ""}`}
          >
            <RotateCcw size={16} />
            重置
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`${buttonStyles.primary} inline-flex items-center gap-2 ${!hasChanges || saving ? buttonStyles.disabled : ""}`}
          >
            <Save size={16} />
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      {/* 编辑器 */}
      <div className="flex-1 p-5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full p-5 font-mono text-sm border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
          placeholder="在此输入 Claude 全局规则...&#10;&#10;示例:&#10;Always respond in Chinese-simplified&#10;&#10;- 除非特别说明否则不要创建文档、不要测试、不要编译"
          spellCheck={false}
        />
      </div>

      {/* 底部提示 */}
      <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-gray-800/50">
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <p className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold">💡</span>
            <span>
              <strong className="text-blue-600 dark:text-blue-400">提示:</strong> 此文件会在每次 Claude Code 对话时自动加载到上下文中
            </span>
          </p>
          <p className="flex items-start gap-2 pl-6">
            <span>支持 Markdown 格式,可以包含系统提示、代码风格要求等</span>
          </p>
        </div>
      </div>
    </div>
  );
}

