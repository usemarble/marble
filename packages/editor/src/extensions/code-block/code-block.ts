import { cn } from "@marble/ui/lib/utils";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "../../lib/lowlight";

/**
 * Code Block extension with syntax highlighting
 * Configured with lowlight and custom styling classes
 */
export const CodeBlock = CodeBlockLowlight.configure({
  lowlight,
  HTMLAttributes: {
    class: cn(
      "rounded-md border p-4 text-sm",
      "bg-background text-foreground",
      // Syntax highlighting styles
      "[&_.hljs-doctag]:text-[#d73a49] [&_.hljs-keyword]:text-[#d73a49] [&_.hljs-meta_.hljs-keyword]:text-[#d73a49] [&_.hljs-template-tag]:text-[#d73a49] [&_.hljs-template-variable]:text-[#d73a49] [&_.hljs-type]:text-[#d73a49] [&_.hljs-variable.language_]:text-[#d73a49]",
      "[&_.hljs-title.class_.inherited__]:text-[#6f42c1] [&_.hljs-title.class_]:text-[#6f42c1] [&_.hljs-title.function_]:text-[#6f42c1] [&_.hljs-title]:text-[#6f42c1]",
      "[&_.hljs-attr]:text-[#005cc5] [&_.hljs-attribute]:text-[#005cc5] [&_.hljs-literal]:text-[#005cc5] [&_.hljs-meta]:text-[#005cc5] [&_.hljs-number]:text-[#005cc5] [&_.hljs-operator]:text-[#005cc5] [&_.hljs-selector-attr]:text-[#005cc5] [&_.hljs-selector-class]:text-[#005cc5] [&_.hljs-selector-id]:text-[#005cc5] [&_.hljs-variable]:text-[#005cc5]",
      "[&_.hljs-meta_.hljs-string]:text-[#032f62] [&_.hljs-regexp]:text-[#032f62] [&_.hljs-string]:text-[#032f62]",
      "[&_.hljs-built_in]:text-[#e36209] [&_.hljs-symbol]:text-[#e36209]",
      "[&_.hljs-code]:text-[#6a737d] [&_.hljs-comment]:text-[#6a737d] [&_.hljs-formula]:text-[#6a737d]",
      "[&_.hljs-name]:text-[#22863a] [&_.hljs-quote]:text-[#22863a] [&_.hljs-selector-pseudo]:text-[#22863a] [&_.hljs-selector-tag]:text-[#22863a]",
      "[&_.hljs-subst]:text-[#24292e]",
      "[&_.hljs-section]:font-bold [&_.hljs-section]:text-[#005cc5]",
      "[&_.hljs-bullet]:text-[#735c0f]",
      "[&_.hljs-emphasis]:text-[#24292e] [&_.hljs-emphasis]:italic",
      "[&_.hljs-strong]:font-bold [&_.hljs-strong]:text-[#24292e]",
      "[&_.hljs-addition]:bg-[#f0fff4] [&_.hljs-addition]:text-[#22863a]",
      "[&_.hljs-deletion]:bg-[#ffeef0] [&_.hljs-deletion]:text-[#b31d28]"
    ),
  },
});
