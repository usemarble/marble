"use client";

import type { Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import { useCallback, useState } from "react";

export function useDragData() {
  const [currentNode, setCurrentNode] = useState<Node | null>(null);
  const [currentNodePos, setCurrentNodePos] = useState<number>(-1);

  const handleNodeChange = useCallback(
    (data: { node: Node | null; editor: Editor; pos: number }) => {
      if (data.node) {
        setCurrentNode(data.node);
      }

      setCurrentNodePos(data.pos);
    },
    []
  );

  return {
    currentNode,
    currentNodePos,
    setCurrentNode,
    setCurrentNodePos,
    handleNodeChange,
  };
}
