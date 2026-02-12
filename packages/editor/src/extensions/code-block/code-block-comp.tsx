import { Button } from "@marble/ui/components/button";
import { Card, CardContent } from "@marble/ui/components/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@marble/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { cn } from "@marble/ui/lib/utils";
import {
  CaretUpDownIcon,
  CheckIcon,
  CopySimpleIcon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";

/**
 * Supported languages for the code block language selector.
 */
const LANGUAGES = [
  { value: "text", label: "Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "bash", label: "Bash" },
  { value: "sql", label: "SQL" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
] as const;

/** Common aliases that map to a supported language value. */
const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  htm: "html",
  golang: "go",
  rs: "rust",
  plaintext: "text",
  plain: "text",
  txt: "text",
};

const LANGUAGE_VALUES: Set<string> = new Set(LANGUAGES.map((l) => l.value));

/**
 * Resolve a raw language string (from markdown fences, pasted content, etc.)
 * to a known language value. Unrecognised strings fall back to "text".
 */
export const resolveLanguage = (raw: string): string => {
  const lower = raw.toLowerCase().trim();
  if (LANGUAGE_VALUES.has(lower)) {
    return lower;
  }
  return LANGUAGE_ALIASES[lower] ?? "text";
};

interface CodeBlockCompProps {
  /** The currently selected language */
  language: string;
  /** Callback when the language changes */
  onLanguageChange: (language: string) => void;
  /** Callback to copy the code block content */
  onCopy: () => void;
  /** Whether the content was recently copied */
  copied: boolean;
  /** The editable code content (NodeViewContent) */
  children: ReactNode;
}

/**
 * Code Block UI Component
 *
 * Card-based layout with a searchable language selector and copy button
 * in the header, and the editable code content in the body.
 */
export const CodeBlockComp = ({
  language,
  onLanguageChange,
  onCopy,
  copied,
  children,
}: CodeBlockCompProps) => {
  const [open, setOpen] = useState(false);

  const selectedLabel =
    LANGUAGES.find((lang) => lang.value === language)?.label ?? language;

  const handleSelect = useCallback(
    (value: string) => {
      onLanguageChange(value);
      setOpen(false);
    },
    [onLanguageChange]
  );

  return (
    <Card className="col-span-full gap-0 rounded-[20px] border-none bg-surface p-2 pt-0">
      {/* Header with language selector and copy button */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: ProseMirror event isolation */}
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: ProseMirror event isolation */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: ProseMirror event isolation */}
      <div
        className="flex items-center justify-between gap-2 px-2 py-1.5"
        data-drag-handle
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Popover onOpenChange={setOpen} open={open}>
          <PopoverTrigger
            render={
              <Button
                className="h-7 gap-1.5 px-2 font-normal text-muted-foreground text-xs shadow-none active:scale-100"
                size="sm"
                type="button"
                variant="ghost"
              />
            }
          >
            {selectedLabel}
            <CaretUpDownIcon className="size-3 opacity-50" />
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[200px] p-0"
            side="bottom"
            sideOffset={4}
          >
            <Command>
              <CommandInput placeholder="Search language..." />
              <CommandList>
                <CommandEmpty>No language found.</CommandEmpty>
                <CommandGroup>
                  {LANGUAGES.map((lang) => (
                    <CommandItem
                      key={lang.value}
                      onSelect={() => handleSelect(lang.value)}
                      value={lang.value}
                    >
                      {lang.label}
                      <CheckIcon
                        className={cn(
                          "ml-auto size-3.5",
                          language === lang.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          className="h-7 w-7 text-muted-foreground shadow-none"
          onClick={onCopy}
          size="icon"
          type="button"
          variant="ghost"
        >
          {copied ? (
            <CheckIcon className="size-3.5" />
          ) : (
            <CopySimpleIcon className="size-3.5" />
          )}
        </Button>
      </div>

      {/* Code content area with syntax highlighting */}
      <CardContent
        className={cn(
          "overflow-hidden rounded-[12px] bg-background p-0 shadow-xs",
          "font-mono text-foreground text-sm",
          // hljs syntax highlighting — light mode
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
          "[&_.hljs-deletion]:bg-[#ffeef0] [&_.hljs-deletion]:text-[#b31d28]",
          // hljs syntax highlighting — dark mode overrides
          "dark:[&_.hljs-doctag]:text-[#ff7b72] dark:[&_.hljs-keyword]:text-[#ff7b72] dark:[&_.hljs-meta_.hljs-keyword]:text-[#ff7b72] dark:[&_.hljs-template-tag]:text-[#ff7b72] dark:[&_.hljs-template-variable]:text-[#ff7b72] dark:[&_.hljs-type]:text-[#ff7b72] dark:[&_.hljs-variable.language_]:text-[#ff7b72]",
          "dark:[&_.hljs-title.class_.inherited__]:text-[#d2a8ff] dark:[&_.hljs-title.class_]:text-[#d2a8ff] dark:[&_.hljs-title.function_]:text-[#d2a8ff] dark:[&_.hljs-title]:text-[#d2a8ff]",
          "dark:[&_.hljs-attr]:text-[#79c0ff] dark:[&_.hljs-attribute]:text-[#79c0ff] dark:[&_.hljs-literal]:text-[#79c0ff] dark:[&_.hljs-meta]:text-[#79c0ff] dark:[&_.hljs-number]:text-[#79c0ff] dark:[&_.hljs-operator]:text-[#79c0ff] dark:[&_.hljs-selector-attr]:text-[#79c0ff] dark:[&_.hljs-selector-class]:text-[#79c0ff] dark:[&_.hljs-selector-id]:text-[#79c0ff] dark:[&_.hljs-variable]:text-[#79c0ff]",
          "dark:[&_.hljs-meta_.hljs-string]:text-[#a5d6ff] dark:[&_.hljs-regexp]:text-[#a5d6ff] dark:[&_.hljs-string]:text-[#a5d6ff]",
          "dark:[&_.hljs-built_in]:text-[#ffa657] dark:[&_.hljs-symbol]:text-[#ffa657]",
          "dark:[&_.hljs-code]:text-[#8b949e] dark:[&_.hljs-comment]:text-[#8b949e] dark:[&_.hljs-formula]:text-[#8b949e]",
          "dark:[&_.hljs-name]:text-[#7ee787] dark:[&_.hljs-quote]:text-[#7ee787] dark:[&_.hljs-selector-pseudo]:text-[#7ee787] dark:[&_.hljs-selector-tag]:text-[#7ee787]",
          "dark:[&_.hljs-subst]:text-[#c9d1d9]",
          "dark:[&_.hljs-section]:text-[#79c0ff]",
          "dark:[&_.hljs-bullet]:text-[#f2cc60]",
          "dark:[&_.hljs-emphasis]:text-[#c9d1d9]",
          "dark:[&_.hljs-strong]:text-[#c9d1d9]",
          "dark:[&_.hljs-addition]:bg-[#0d2117] dark:[&_.hljs-addition]:text-[#7ee787]",
          "dark:[&_.hljs-deletion]:bg-[#28060a] dark:[&_.hljs-deletion]:text-[#ff7b72]"
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
};
