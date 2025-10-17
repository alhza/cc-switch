import { useState, useEffect } from "react";
import { X, Search, RefreshCw } from "lucide-react";
import { ConversationMeta } from "../../types";
import { ConversationList } from "./ConversationList";
import ConversationDetailModal from "./ConversationDetailModal";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

interface ConversationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConversationPanel({
  isOpen,
  onClose,
}: ConversationPanelProps) {
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<
    ConversationMeta[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedAppType, setSelectedAppType] = useState<
    "all" | "claude" | "codex"
  >("all");
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationMeta | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    filePath: string;
  }>({ isOpen: false, filePath: "" });

  // 加载对话记录
  const loadConversations = async () => {
    setLoading(true);
    try {
      const appType = selectedAppType === "all" ? undefined : selectedAppType;
      const result = await window.api.listConversations(appType);
      setConversations(result);
      setFilteredConversations(result);
    } catch (error) {
      console.error("加载对话记录失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索对话记录
  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    setLoading(true);
    try {
      const appType = selectedAppType === "all" ? undefined : selectedAppType;
      const result = await window.api.searchConversations(
        appType,
        searchKeyword,
      );
      setFilteredConversations(result);
    } catch (error) {
      console.error("搜索对话记录失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 删除对话记录
  const handleDelete = (filePath: string) => {
    setDeleteConfirm({ isOpen: true, filePath });
  };

  const confirmDelete = async () => {
    try {
      await window.api.deleteConversation(deleteConfirm.filePath);
      setDeleteConfirm({ isOpen: false, filePath: "" });
      // 重新加载列表
      await loadConversations();
    } catch (error) {
      console.error("删除对话记录失败:", error);
      alert(`删除失败: ${error}`);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, filePath: "" });
  };

  // 初始加载
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedAppType]);

  // 搜索关键词变化时自动搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKeyword, conversations]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            对话记录管理
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title="关闭"
          >
            <X size={20} />
          </button>
        </div>

        {/* 工具栏 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          {/* 应用类型选择 */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedAppType("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedAppType === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setSelectedAppType("claude")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedAppType === "claude"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              Claude Code
            </button>
            <button
              onClick={() => setSelectedAppType("codex")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedAppType === "codex"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              Codex
            </button>
          </div>

          {/* 搜索栏 */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索对话记录 (项目名称、会话ID...)"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={loadConversations}
              disabled={loading}
              className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              刷新
            </button>
          </div>
        </div>

        {/* 对话列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              加载中...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              {searchKeyword ? "未找到匹配的对话记录" : "暂无对话记录"}
            </div>
          ) : (
            <ConversationList
              conversations={filteredConversations}
              onDelete={handleDelete}
              onView={setSelectedConversation}
            />
          )}
        </div>

        {/* 底部统计 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
          共 {filteredConversations.length} 条对话记录
          {searchKeyword && ` (从 ${conversations.length} 条中筛选)`}
        </div>
      </div>

      {/* 对话详情模态框 */}
      {selectedConversation && (
        <ConversationDetailModal
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
        />
      )}

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="确认删除"
        message="确定要删除这条对话记录吗？删除后将无法恢复。"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}

