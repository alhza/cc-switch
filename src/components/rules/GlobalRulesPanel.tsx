import { useState } from "react";
import { X } from "lucide-react";
import ClaudeRulesEditor from "./ClaudeRulesEditor";
import CodexRulesManager from "./CodexRulesManager";

interface GlobalRulesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalRulesPanel({
  isOpen,
  onClose,
}: GlobalRulesPanelProps) {
  const [activeTab, setActiveTab] = useState<"claude" | "codex">("claude");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[90vw] h-[85vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col border border-gray-200 dark:border-gray-700">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            全局规则管理
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title="关闭"
          >
            <X size={20} />
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("claude")}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "claude"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Claude Code
          </button>
          <button
            onClick={() => setActiveTab("codex")}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "codex"
                ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-500"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Codex
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "claude" ? (
            <ClaudeRulesEditor />
          ) : (
            <CodexRulesManager />
          )}
        </div>
      </div>
    </div>
  );
}

