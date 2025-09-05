import React from "react";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { Badge } from "@marble/ui/components/badge";
import { PuzzlePieceIcon } from "@phosphor-icons/react";

export function CustomComponentNodeView({ node, getPos, editor }: any) {
  const { componentName, ...props } = node.attrs;

  const handleClick = () => {
    if (getPos) {
      editor.chain().focus().setTextSelection(getPos()).run();
    }
  };

  return (
    <NodeViewWrapper className="marble-custom-component">
      <div
        className="border-2 border-dashed border-primary/30 rounded-md p-4 my-4 bg-primary/5 cursor-pointer hover:border-primary/50 transition-colors"
        onClick={handleClick}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <PuzzlePieceIcon className="h-5 w-5 text-primary" />
            <span className="font-medium text-primary">{componentName}</span>
            <Badge variant="secondary" className="text-xs">
              Custom Component
            </Badge>
          </div>
        </div>
        
        {Object.keys(props).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Properties:</h4>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(props).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-muted-foreground">{key}:</span>
                  <span className="text-foreground bg-background px-2 py-1 rounded border">
                    {String(value) || "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <NodeViewContent className="mt-3 text-sm text-muted-foreground" />
      </div>
    </NodeViewWrapper>
  );
}