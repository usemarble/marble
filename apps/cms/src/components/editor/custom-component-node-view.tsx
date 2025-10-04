import { Button } from "@marble/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import {
  CaretDownIcon,
  CaretRightIcon,
  PencilIcon,
  PuzzlePieceIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import { useState } from "react";
import { ComponentEditorModal } from "./component-selector-modal";

type CustomComponentAttrs = {
  componentName: string;
  properties?: Record<string, unknown>;
};

export function CustomComponentNodeView({
  node,
  getPos,
  editor,
}: NodeViewProps) {
  const { componentName, properties = {} } = node.attrs as CustomComponentAttrs;
  const props = properties as Record<string, unknown>;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleClick = () => {
    if (getPos) {
      editor.chain().focus().setTextSelection(getPos()).run();
    }
  };

  const handleEdit: React.MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (getPos) {
      editor.chain().focus().setNodeSelection(getPos()).run();
    }
    setIsModalOpen(true);
  };

  const handleRemove: React.MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirmOpen(true);
  };

  const handleToggleExpand: React.MouseEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded((x) => !x);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <>
      <NodeViewWrapper className="marble-custom-component">
        {/** biome-ignore lint/a11y/useSemanticElements: <> */}
        <div
          aria-expanded={Object.keys(props).length > 0 ? isExpanded : undefined}
          aria-label={`Select ${componentName} component`}
          className="group relative my-3 w-full rounded-lg border border-border bg-card p-4 text-left transition-all duration-200 hover:bg-muted/50 hover:shadow-sm"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <PuzzlePieceIcon className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">
                {componentName}
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <Button
                className="h-8 w-8 cursor-pointer p-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={handleEdit}
                size="sm"
                type="button"
                variant="ghost"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </Button>

              <Button
                aria-label="Remove component"
                className="hover:!bg-destructive/20 h-8 w-8 cursor-pointer p-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={handleRemove}
                size="sm"
                title="Remove"
                type="button"
                variant="ghost"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </Button>

              {Object.keys(props).length > 0 && (
                <Button
                  aria-expanded={isExpanded}
                  aria-label={
                    isExpanded ? "Collapse properties" : "Expand properties"
                  }
                  className="h-8 w-8 cursor-pointer p-0 hover:bg-muted"
                  onClick={handleToggleExpand}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  {isExpanded ? (
                    <CaretDownIcon className="h-3.5 w-3.5" />
                  ) : (
                    <CaretRightIcon className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {Object.keys(props).length > 0 && isExpanded && (
            <div className="slide-in-from-top-1 mb-3 animate-in duration-200">
              <div className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                Properties
              </div>
              <div className="space-y-2">
                {Object.entries(props).map(([key, value]) => (
                  <div
                    className="flex items-center justify-between py-1"
                    key={key}
                  >
                    <span className="font-medium text-muted-foreground text-sm">
                      {key}
                    </span>
                    <span className="rounded bg-muted/50 px-2 py-0.5 text-foreground text-sm">
                      {String(value ?? "—")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </NodeViewWrapper>

      <ComponentEditorModal
        editor={editor}
        existingComponent={node}
        getPos={getPos}
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
      />

      <Dialog onOpenChange={setIsConfirmOpen} open={isConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Remove Component</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove “{componentName}”? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end space-x-2">
            <Button onClick={() => setIsConfirmOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (getPos)
                  editor.chain().focus().setNodeSelection(getPos()).run();
                editor.chain().focus().deleteSelection().run();
                setIsConfirmOpen(false);
              }}
              variant="destructive"
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
