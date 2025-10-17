import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, Tag } from "lucide-react";
import { CodexRuleFile } from "../../types";
import { buttonStyles } from "../../lib/styles";

interface CodexRulesManagerProps {
  onSave?: () => void;
}

export default function CodexRulesManager({
  onSave,
}: CodexRulesManagerProps) {
  const [rules, setRules] = useState<CodexRuleFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<CodexRuleFile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editFilename, setEditFilename] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const rulesList = await window.api.listCodexRules();
      setRules(rulesList);
    } catch (error) {
      console.error("加载 Codex 规则失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRule = (rule: CodexRuleFile) => {
    setSelectedRule(rule);
    setIsEditing(false);
  };

  const handleEdit = () => {
    if (!selectedRule) return;
    setEditContent(selectedRule.content);
    setEditTags(selectedRule.tags);
    setEditFilename(selectedRule.name);
    setIsEditing(true);
  };

  const handleCreate = () => {
    setEditContent("");
    setEditTags([]);
    setEditFilename("");
    setIsCreating(true);
    setIsEditing(true);
    setSelectedRule(null);
  };

  const handleSave = async () => {
    if (!editFilename.trim()) {
      alert("请输入文件名");
      return;
    }

    const filename = editFilename.endsWith(".md")
      ? editFilename
      : `${editFilename}.md`;

    try {
      await window.api.writeCodexRule(filename, editContent, editTags);
      await loadRules();
      setIsEditing(false);
      setIsCreating(false);
      onSave?.();
    } catch (error) {
      console.error("保存规则失败:", error);
      alert("保存失败: " + error);
    }
  };

  const handleDelete = async (rule: CodexRuleFile) => {
    if (!confirm(`确定要删除规则文件 "${rule.name}" 吗?`)) {
      return;
    }

    try {
      await window.api.deleteCodexRule(rule.name);
      await loadRules();
      if (selectedRule?.name === rule.name) {
        setSelectedRule(null);
      }
      onSave?.();
    } catch (error) {
      console.error("删除规则失败:", error);
      alert("删除失败: " + error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleAddTag = () => {
    const tag = prompt("输入标签名称:");
    if (tag && tag.trim() && !editTags.includes(tag.trim())) {
      setEditTags([...editTags, tag.trim()]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEditTags(editTags.filter((t) => t !== tag));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* 左侧列表 */}
      <div className="w-72 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/30">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCreate}
            className={`${buttonStyles.primary} w-full inline-flex items-center justify-center gap-2`}
          >
            <Plus size={16} />
            新建规则文件
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {rules.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
              暂无规则文件
            </div>
          ) : (
            <div className="p-2">
              {rules.map((rule) => (
                <div
                  key={rule.name}
                  onClick={() => handleSelectRule(rule)}
                  className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                    selectedRule?.name === rule.name
                      ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {rule.name}
                  </div>
                  {rule.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {rule.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            共 {rules.length} 个规则文件
          </p>
        </div>
      </div>

      {/* 右侧内容 */}
      <div className="flex-1 flex flex-col">
        {isEditing ? (
          // 编辑模式
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {isCreating ? "新建规则文件" : "编辑规则文件"}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className={`${buttonStyles.secondary} inline-flex items-center gap-2`}
                  >
                    <X size={16} />
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    className={`${buttonStyles.primary} inline-flex items-center gap-2`}
                  >
                    <Save size={16} />
                    保存
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    文件名
                  </label>
                  <input
                    type="text"
                    value={editFilename}
                    onChange={(e) => setEditFilename(e.target.value)}
                    placeholder="例如: base.md"
                    disabled={!isCreating}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    标签 (可选)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-sm"
                      >
                        <Tag size={12} />
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-purple-900 dark:hover:text-purple-100"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={handleAddTag}
                      className="px-2 py-1 border border-dashed border-gray-300 dark:border-gray-600 rounded text-sm text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600"
                    >
                      + 添加标签
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    标签用于在特定场景下应用规则
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="在此输入规则内容..."
                spellCheck={false}
              />
            </div>
          </>
        ) : selectedRule ? (
          // 查看模式
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedRule.name}
                  </h3>
                  {selectedRule.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedRule.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className={`${buttonStyles.secondary} inline-flex items-center gap-2`}
                  >
                    <Edit size={16} />
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(selectedRule)}
                    className={`${buttonStyles.danger} inline-flex items-center gap-2`}
                  >
                    <Trash2 size={16} />
                    删除
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-900 dark:text-gray-100">
                {selectedRule.content}
              </pre>
            </div>
          </>
        ) : (
          // 空状态
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <p className="mb-2">请选择一个规则文件</p>
              <p className="text-sm">或点击"新建规则"创建新文件</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

