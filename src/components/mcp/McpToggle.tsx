import React from "react";

interface McpToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

/**
 * Toggle 开关组件
 * 启用时为淡绿色，禁用时为灰色
 */
const McpToggle: React.FC<McpToggleProps> = ({
  enabled,
  onChange,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20
        ${enabled ? "bg-emerald-500 dark:bg-emerald-600" : "bg-gray-300 dark:bg-gray-600"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${enabled ? "translate-x-6" : "translate-x-1"}
        `}
      />
    </button>
  );
};

export default McpToggle;
