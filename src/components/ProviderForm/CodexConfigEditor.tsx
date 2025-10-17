import React, { useState, useEffect, useRef } from "react";

import { X, Save } from "lucide-react";

import { isLinux } from "../../lib/platform";
import { useTranslation } from "react-i18next";

import {
  generateThirdPartyAuth,
  generateThirdPartyConfig,
} from "../../config/codexProviderPresets";

interface CodexConfigEditorProps {
  authValue: string;

  configValue: string;

  onAuthChange: (value: string) => void;

  onConfigChange: (value: string) => void;

  onAuthBlur?: () => void;

  useCommonConfig: boolean;

  onCommonConfigToggle: (checked: boolean) => void;

  commonConfigSnippet: string;

  onCommonConfigSnippetChange: (value: string) => void;

  commonConfigError: string;

  authError: string;

  isCustomMode?: boolean; // 新增：是否为自定义模式

  onWebsiteUrlChange?: (url: string) => void; // 新增：更新网址回调

  isTemplateModalOpen?: boolean; // 新增：模态框状态

  setIsTemplateModalOpen?: (open: boolean) => void; // 新增：设置模态框状态

  onNameChange?: (name: string) => void; // 新增：更新供应商名称回调
}

const CodexConfigEditor: React.FC<CodexConfigEditorProps> = ({
  authValue,

  configValue,

  onAuthChange,

  onConfigChange,

  onAuthBlur,

  useCommonConfig,

  onCommonConfigToggle,

  commonConfigSnippet,

  onCommonConfigSnippetChange,

  commonConfigError,

  authError,

  onWebsiteUrlChange,

  onNameChange,

  isTemplateModalOpen: externalTemplateModalOpen,

  setIsTemplateModalOpen: externalSetTemplateModalOpen,
}) => {
  const { t } = useTranslation();
  const [isCommonConfigModalOpen, setIsCommonConfigModalOpen] = useState(false);

  // 使用内部状态或外部状态

  const [internalTemplateModalOpen, setInternalTemplateModalOpen] =
    useState(false);

  const isTemplateModalOpen =
    externalTemplateModalOpen ?? internalTemplateModalOpen;

  const setIsTemplateModalOpen =
    externalSetTemplateModalOpen ?? setInternalTemplateModalOpen;

  const [templateApiKey, setTemplateApiKey] = useState("");

  const [templateProviderName, setTemplateProviderName] = useState("");

  const [templateBaseUrl, setTemplateBaseUrl] = useState("");

  const [templateWebsiteUrl, setTemplateWebsiteUrl] = useState("");

  const [templateModelName, setTemplateModelName] = useState("gpt-5-codex");
  const apiKeyInputRef = useRef<HTMLInputElement>(null);

  const baseUrlInputRef = useRef<HTMLInputElement>(null);

  const modelNameInputRef = useRef<HTMLInputElement>(null);
  const displayNameInputRef = useRef<HTMLInputElement>(null);

  // 移除自动填充逻辑，因为现在在点击自定义按钮时就已经填充

  const [templateDisplayName, setTemplateDisplayName] = useState("");

  useEffect(() => {
    if (commonConfigError && !isCommonConfigModalOpen) {
      setIsCommonConfigModalOpen(true);
    }
  }, [commonConfigError, isCommonConfigModalOpen]);

  // 支持按下 ESC 关闭弹窗

  useEffect(() => {
    if (!isCommonConfigModalOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();

        closeModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCommonConfigModalOpen]);

  const closeModal = () => {
    setIsCommonConfigModalOpen(false);
  };

  const closeTemplateModal = () => {
    setIsTemplateModalOpen(false);
  };

  const applyTemplate = () => {
    const requiredInputs = [
      displayNameInputRef.current,
      apiKeyInputRef.current,
      baseUrlInputRef.current,
      modelNameInputRef.current,
    ];

    for (const input of requiredInputs) {
      if (input && !input.checkValidity()) {
        input.reportValidity();
        input.focus();
        return;
      }
    }

    const trimmedKey = templateApiKey.trim();

    const trimmedBaseUrl = templateBaseUrl.trim();

    const trimmedModel = templateModelName.trim();

    const auth = generateThirdPartyAuth(trimmedKey);

    const config = generateThirdPartyConfig(
      templateProviderName || "custom",

      trimmedBaseUrl,

      trimmedModel,
    );

    onAuthChange(JSON.stringify(auth, null, 2));

    onConfigChange(config);

    if (onWebsiteUrlChange) {
      const trimmedWebsite = templateWebsiteUrl.trim();

      if (trimmedWebsite) {
        onWebsiteUrlChange(trimmedWebsite);
      }
    }

    if (onNameChange) {
      const trimmedName = templateDisplayName.trim();
      if (trimmedName) {
        onNameChange(trimmedName);
      }
    }

    setTemplateApiKey("");

    setTemplateProviderName("");

    setTemplateBaseUrl("");

    setTemplateWebsiteUrl("");

    setTemplateModelName("gpt-5-codex");

    setTemplateDisplayName("");

    closeTemplateModal();
  };

  const handleTemplateInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();

      e.stopPropagation();

      applyTemplate();
    }
  };

  const handleAuthChange = (value: string) => {
    onAuthChange(value);
  };

  const handleConfigChange = (value: string) => {
    onConfigChange(value);
  };

  const handleCommonConfigSnippetChange = (value: string) => {
    onCommonConfigSnippetChange(value);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="codexAuth"
          className="block text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          {t("codexConfig.authJson")}
        </label>

        <textarea
          id="codexAuth"
          value={authValue}
          onChange={(e) => handleAuthChange(e.target.value)}
          onBlur={onAuthBlur}
          placeholder={t("codexConfig.authJsonPlaceholder")}
          rows={6}
          required
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-colors resize-y min-h-[8rem]"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          lang="en"
          inputMode="text"
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
        />

        {authError && (
          <p className="text-xs text-red-500 dark:text-red-400">{authError}</p>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("codexConfig.authJsonHint")}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="codexConfig"
            className="block text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            {t("codexConfig.configToml")}
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={useCommonConfig}
              onChange={(e) => onCommonConfigToggle(e.target.checked)}
              className="w-4 h-4 text-blue-500 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
            />
            {t("codexConfig.writeCommonConfig")}
          </label>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setIsCommonConfigModalOpen(true)}
            className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
          >
            {t("codexConfig.editCommonConfig")}
          </button>
        </div>

        {commonConfigError && !isCommonConfigModalOpen && (
          <p className="text-xs text-red-500 dark:text-red-400 text-right">
            {commonConfigError}
          </p>
        )}

        <textarea
          id="codexConfig"
          value={configValue}
          onChange={(e) => handleConfigChange(e.target.value)}
          placeholder=""
          rows={8}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-colors resize-y min-h-[10rem]"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          lang="en"
          inputMode="text"
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
        />

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("codexConfig.configTomlHint")}
        </p>
      </div>

      {isTemplateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeTemplateModal();
            }
          }}
        >
          <div
            className={`absolute inset-0 bg-black/50 dark:bg-black/70${
              isLinux() ? "" : " backdrop-blur-sm"
            }`}
          />

          <div className="relative mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-lg dark:bg-gray-900">
            <div className="flex h-full min-h-0 flex-col" role="form">
              <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {t("codexConfig.quickWizard")}
                </h2>

                <button
                  type="button"
                  onClick={closeTemplateModal}
                  className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  aria-label={t("common.close")}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 min-h-0 space-y-4 overflow-auto p-6">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {t("codexConfig.wizardHint")}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t("codexConfig.apiKeyLabel")}
                    </label>

                    <input
                      type="text"
                      value={templateApiKey}
                      ref={apiKeyInputRef}
                      onChange={(e) => setTemplateApiKey(e.target.value)}
                      onKeyDown={handleTemplateInputKeyDown}
                      pattern=".*\S.*"
                      title={t("common.enterValidValue")}
                      placeholder={t("codexConfig.apiKeyPlaceholder")}
                      required
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t("codexConfig.supplierNameLabel")}
                    </label>

                    <input
                      type="text"
                      value={templateDisplayName}
                      ref={displayNameInputRef}
                      onChange={(e) => {
                        setTemplateDisplayName(e.target.value);
                        if (onNameChange) {
                          onNameChange(e.target.value);
                        }
                      }}
                      onKeyDown={handleTemplateInputKeyDown}
                      placeholder={t("codexConfig.supplierNamePlaceholder")}
                      required
                      pattern=".*\S.*"
                      title={t("common.enterValidValue")}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t("codexConfig.supplierNameHint")}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t("codexConfig.supplierCodeLabel")}
                    </label>

                    <input
                      type="text"
                      value={templateProviderName}
                      onChange={(e) => setTemplateProviderName(e.target.value)}
                      onKeyDown={handleTemplateInputKeyDown}
                      placeholder={t("codexConfig.supplierCodePlaceholder")}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t("codexConfig.supplierCodeHint")}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t("codexConfig.apiUrlLabel")}
                    </label>

                    <input
                      type="url"
                      value={templateBaseUrl}
                      ref={baseUrlInputRef}
                      onChange={(e) => setTemplateBaseUrl(e.target.value)}
                      onKeyDown={handleTemplateInputKeyDown}
                      placeholder={t("codexConfig.apiUrlPlaceholder")}
                      required
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t("codexConfig.websiteLabel")}
                    </label>

                    <input
                      type="url"
                      value={templateWebsiteUrl}
                      onChange={(e) => setTemplateWebsiteUrl(e.target.value)}
                      onKeyDown={handleTemplateInputKeyDown}
                      placeholder={t("codexConfig.websitePlaceholder")}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t("codexConfig.websiteHint")}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t("codexConfig.modelNameLabel")}
                    </label>

                    <input
                      type="text"
                      value={templateModelName}
                      ref={modelNameInputRef}
                      onChange={(e) => setTemplateModelName(e.target.value)}
                      onKeyDown={handleTemplateInputKeyDown}
                      pattern=".*\S.*"
                      title={t("common.enterValidValue")}
                      placeholder={t("codexConfig.modelNamePlaceholder")}
                      required
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>

                {(templateApiKey ||
                  templateProviderName ||
                  templateBaseUrl) && (
                  <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t("codexConfig.configPreview")}
                    </h3>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                          auth.json
                        </label>

                        <pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs font-mono text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {JSON.stringify(
                            generateThirdPartyAuth(templateApiKey),
                            null,
                            2,
                          )}
                        </pre>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                          config.toml
                        </label>

                        <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs font-mono text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {templateProviderName && templateBaseUrl
                            ? generateThirdPartyConfig(
                                templateProviderName,

                                templateBaseUrl,

                                templateModelName,
                              )
                            : ""}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-100 p-6 dark:border-gray-800 dark:bg-gray-800">
                <button
                  type="button"
                  onClick={closeTemplateModal}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                >
                  {t("common.cancel")}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();

                    e.stopPropagation();

                    applyTemplate();
                  }}
                  className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  <Save className="h-4 w-4" />
                  {t("codexConfig.applyConfig")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCommonConfigModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          {/* Backdrop - 统一背景样式 */}

          <div
            className={`absolute inset-0 bg-black/50 dark:bg-black/70${
              isLinux() ? "" : " backdrop-blur-sm"
            }`}
          />

          {/* Modal - 统一窗口样式 */}

          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header - 统一标题栏样式 */}

            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t("codexConfig.editCommonConfigTitle")}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                aria-label={t("common.close")}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content - 统一内容区域样式 */}

            <div className="flex-1 overflow-auto p-6 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("codexConfig.commonConfigHint")}
              </p>

              <textarea
                value={commonConfigSnippet}
                onChange={(e) =>
                  handleCommonConfigSnippetChange(e.target.value)
                }
                placeholder={`# Common Codex config



# Add your common TOML configuration here`}
                rows={12}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-colors resize-y"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                lang="en"
                inputMode="text"
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />

              {commonConfigError && (
                <p className="text-sm text-red-500 dark:text-red-400">
                  {commonConfigError}
                </p>
              )}
            </div>

            {/* Footer - 统一底部按钮样式 */}

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t("common.cancel")}
              </button>

              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodexConfigEditor;
