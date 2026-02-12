import type { NodeViewProps } from "@tiptap/core";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { useCallback, useState } from "react";
import { CodeBlockComp, resolveLanguage } from "./code-block-comp";

export const CodeBlockView = ({ node, updateAttributes }: NodeViewProps) => {
  const rawLanguage = (node.attrs.language as string) || "text";
  const language = resolveLanguage(rawLanguage);
  const [copied, setCopied] = useState(false);

  const onLanguageChange = useCallback(
    (lang: string) => {
      updateAttributes({ language: lang });
    },
    [updateAttributes]
  );

  const onCopy = useCallback(() => {
    const text = node.textContent;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  }, [node]);

  return (
    <NodeViewWrapper className="my-5">
      <CodeBlockComp
        copied={copied}
        language={language}
        onCopy={onCopy}
        onLanguageChange={onLanguageChange}
      >
        <pre className="!m-0 !bg-transparent !p-0 !text-inherit overflow-x-auto">
          <NodeViewContent className="!outline-none p-4 font-mono text-sm" />
        </pre>
      </CodeBlockComp>
    </NodeViewWrapper>
  );
};
