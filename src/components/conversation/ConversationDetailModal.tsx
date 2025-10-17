import { useState, useEffect } from "react";
import { X, User, Bot, Clock, MessageSquare } from "lucide-react";
import { ConversationMeta } from "../../types";
import { buttonStyles } from "../../lib/styles";

interface ConversationDetailModalProps {
  conversation: ConversationMeta;
  onClose: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export default function ConversationDetailModal({
  conversation,
  onClose,
}: ConversationDetailModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversationContent();
  }, [conversation.filePath]);

  const loadConversationContent = async () => {
    setLoading(true);
    try {
      const content = await window.api.readConversationContent(
        conversation.filePath,
      );
      const parsed = parseConversationContent(content, conversation.appType);
      setMessages(parsed);
    } catch (error) {
      console.error("加载对话内容失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 解析对话内容
  const parseConversationContent = (
    content: string,
    appType: string,
  ): Message[] => {
    const lines = content.split("\n").filter((line) => line.trim());
    const messages: Message[] = [];

    for (const line of lines) {
      try {
        const json = JSON.parse(line);

        if (appType === "claude") {
          // Claude 格式 - 只处理 user 和 assistant 类型
          if (json.type === "user" || json.type === "assistant") {
            const messageContent = extractClaudeContent(json.message);
            if (messageContent) {
              messages.push({
                role: json.type,
                content: messageContent,
                timestamp: json.timestamp,
              });
            }
          }
        } else if (appType === "codex") {
          // Codex 格式 - 只处理实际对话消息
          if (json.type === "response_item" && json.payload) {
            const payload = json.payload;
            if (payload.type === "message" && payload.content) {
              // 过滤掉系统消息和提示词
              if (payload.role === "user" || payload.role === "assistant") {
                const messageContent = extractCodexContent(payload.content);
                if (messageContent) {
                  messages.push({
                    role: payload.role === "user" ? "user" : "assistant",
                    content: messageContent,
                    timestamp: json.timestamp,
                  });
                }
              }
            }
          }
        }
      } catch (e) {
        // 跳过无法解析的行
        continue;
      }
    }

    return messages;
  };

  // 提取 Claude 消息内容
  const extractClaudeContent = (message: any): string | null => {
    if (!message || !message.content) return null;

    const content = message.content;
    if (Array.isArray(content)) {
      const text = content
        .map((item: any) => {
          if (item.type === "text") return item.text;
          if (item.type === "input_text") return item.text;
          if (item.type === "output_text") return item.text;
          return "";
        })
        .filter(Boolean)
        .join("\n");

      return cleanUserMessage(text);
    }

    return null;
  };

  // 提取 Codex 消息内容
  const extractCodexContent = (content: any): string | null => {
    if (!Array.isArray(content)) return null;

    const text = content
      .map((item: any) => {
        if (item.type === "input_text") return item.text;
        if (item.type === "output_text") return item.text;
        if (item.type === "text") return item.text;
        return "";
      })
      .filter(Boolean)
      .join("\n");

    return cleanUserMessage(text);
  };

  // 清理用户消息 - 移除环境上下文和系统提示
  const cleanUserMessage = (text: string): string | null => {
    if (!text) return null;

    // 移除 <environment_context> 标签及其内容
    let cleaned = text.replace(/<environment_context>[\s\S]*?<\/environment_context>/g, "");

    // 移除 "# Context from my IDE setup:" 及其后续内容,直到找到 "## My request for"
    cleaned = cleaned.replace(/# Context from my IDE setup:[\s\S]*?## My request for (Claude|Codex):\s*/g, "");

    // 移除其他常见的系统提示模式
    cleaned = cleaned.replace(/## Active file:[\s\S]*?(?=\n\n|$)/g, "");
    cleaned = cleaned.replace(/## Open files:[\s\S]*?(?=\n\n|$)/g, "");

    // 清理多余的空行
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

    return cleaned || null;
  };

  // 格式化时间
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 格式化消息内容 - 支持代码块、列表等
  const formatMessageContent = (content: string) => {
    const lines = content.split("\n");
    const elements: JSX.Element[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLanguage = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 检测代码块开始/结束
      if (line.trim().startsWith("```")) {
        if (!inCodeBlock) {
          // 开始代码块
          inCodeBlock = true;
          codeBlockLanguage = line.trim().substring(3).trim();
          codeBlockContent = [];
        } else {
          // 结束代码块
          inCodeBlock = false;
          elements.push(
            <pre
              key={i}
              className="bg-gray-900 dark:bg-gray-950 text-gray-100 rounded-md p-3 overflow-x-auto my-2 text-xs"
            >
              <code className={`language-${codeBlockLanguage}`}>
                {codeBlockContent.join("\n")}
              </code>
            </pre>,
          );
          codeBlockContent = [];
          codeBlockLanguage = "";
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // 行内代码
      if (line.includes("`")) {
        const parts = line.split(/(`[^`]+`)/g);
        elements.push(
          <p key={i} className="my-1">
            {parts.map((part, idx) => {
              if (part.startsWith("`") && part.endsWith("`")) {
                return (
                  <code
                    key={idx}
                    className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono"
                  >
                    {part.slice(1, -1)}
                  </code>
                );
              }
              return <span key={idx}>{part}</span>;
            })}
          </p>,
        );
        continue;
      }

      // 标题
      if (line.startsWith("#")) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const text = line.replace(/^#+\s*/, "");
        const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
        elements.push(
          <HeadingTag
            key={i}
            className="font-bold mt-3 mb-2"
            style={{ fontSize: `${1.5 - level * 0.1}em` }}
          >
            {text}
          </HeadingTag>,
        );
        continue;
      }

      // 列表
      if (line.trim().match(/^[-*]\s/)) {
        const text = line.trim().replace(/^[-*]\s/, "");
        elements.push(
          <li key={i} className="ml-4 my-1">
            {text}
          </li>,
        );
        continue;
      }

      // 有序列表
      if (line.trim().match(/^\d+\.\s/)) {
        const text = line.trim().replace(/^\d+\.\s/, "");
        elements.push(
          <li key={i} className="ml-4 my-1 list-decimal">
            {text}
          </li>,
        );
        continue;
      }

      // 空行
      if (line.trim() === "") {
        elements.push(<br key={i} />);
        continue;
      }

      // 普通文本
      elements.push(
        <p key={i} className="my-1">
          {line}
        </p>,
      );
    }

    return <>{elements}</>;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare size={24} className="text-blue-600 dark:text-blue-400" />
              对话详情
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
              {conversation.projectName || conversation.sessionId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="关闭"
          >
            <X size={20} />
          </button>
        </div>

        {/* 对话内容 */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span>加载中...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              暂无对话内容
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((message, index) => (
                <div key={index} className="flex gap-4">
                  {/* 头像 */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                        : "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User size={18} />
                    ) : (
                      <Bot size={18} />
                    )}
                  </div>

                  {/* 消息内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {message.role === "user" ? "用户" : "AI 助手"}
                      </span>
                      {message.timestamp && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock size={12} />
                          {formatTime(message.timestamp)}
                        </span>
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-4 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100 border border-blue-200 dark:border-blue-800"
                          : "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {formatMessageContent(message.content)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部统计 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              共 {messages.length} 条消息
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {conversation.appType === "claude" ? "Claude Code" : "Codex"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

