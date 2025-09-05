import { Badge } from "@marble/ui/components/badge";
import { PuzzlePieceIcon } from "@phosphor-icons/react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";

interface CustomComponentNodeViewProps {
  node: {
    attrs: Record<string, unknown>;
  };
  getPos?: () => number;
  editor: {
    chain: () => {
      focus: () => {
        setTextSelection: (pos: number) => {
          run: () => void;
        };
      };
    };
  };
}

export function CustomComponentNodeView({
  node,
  getPos,
  editor,
}: CustomComponentNodeViewProps) {
  const { componentName, ...props } = node.attrs;

  const handleClick = () => {
    if (getPos) {
      editor.chain().focus().setTextSelection(getPos()).run();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <NodeViewWrapper className="marble-custom-component">
      <div
        className="border-primary/30 bg-primary/5 hover:border-primary/50 my-4 cursor-pointer rounded-md border-2 border-dashed p-4 transition-colors"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Custom component: ${componentName}`}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PuzzlePieceIcon className="text-primary h-5 w-5" />
            <span className="text-primary font-medium">{String(componentName)}</span>
            <Badge variant="secondary" className="text-xs">
              Custom Component
            </Badge>
          </div>
        </div>

        {Object.keys(props).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-muted-foreground mb-2 text-sm font-medium">
              Properties:
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(props).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground font-medium">
                    {key}:
                  </span>
                  <span className="text-foreground bg-background rounded border px-2 py-1">
                    {String(value) || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <NodeViewContent className="text-muted-foreground mt-3 text-sm" />
      </div>
    </NodeViewWrapper>
  );
}
