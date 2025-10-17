import { Trash2, MessageSquare, Calendar, FileText, Eye } from "lucide-react";
import { ConversationMeta } from "../../types";

interface ConversationItemProps {
  conversation: ConversationMeta;
  onDelete: (filePath: string) => void;
  onView: (conversation: ConversationMeta) => void;
}

export function ConversationItem({
  conversation,
  onDelete,
  onView,
}: ConversationItemProps) {
  // 格式化时间戳
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 获取应用类型标签颜色
  const getAppTypeBadgeColor = (appType: string) => {
    return appType === "claude"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-[border-color,box-shadow] duration-200 border border-gray-200 dark:border-gray-700 dark:hover:border-gray-600">
      <div className="flex items-start justify-between gap-4">
        {/* 左侧信息 */}
        <div className="flex-1 min-w-0">
          {/* 标题行 */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${getAppTypeBadgeColor(conversation.appType)}`}
            >
              {conversation.appType === "claude" ? "Claude Code" : "Codex"}
            </span>
            {conversation.projectName && (
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {conversation.projectName}
              </span>
            )}
          </div>

          {/* 详细信息 */}
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            {/* 会话ID */}
            {conversation.sessionId && (
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="flex-shrink-0" />
                <span className="font-mono text-xs truncate">
                  {conversation.sessionId}
                </span>
              </div>
            )}

            {/* 时间和消息数 */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="flex-shrink-0" />
                <span>{formatDate(conversation.modifiedAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquare size={14} className="flex-shrink-0" />
                <span>{conversation.messageCount} 条消息</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText size={14} className="flex-shrink-0" />
                <span>{formatSize(conversation.fileSize)}</span>
              </div>
            </div>

            {/* 文件路径 */}
            <div className="text-xs text-gray-500 dark:text-gray-500 truncate font-mono">
              {conversation.filePath}
            </div>
          </div>
        </div>

        {/* 右侧操作按钮 */}
        <div className="flex-shrink-0 flex gap-2">
          <button
            onClick={() => onView(conversation)}
            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            title="查看详情"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(conversation.filePath);
            }}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="删除对话记录"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

