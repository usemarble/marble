"use client";

import {
  EditorAlignSelector,
  EditorBubbleMenu,
  EditorClearFormatting,
  EditorContent,
  EditorLinkSelector,
  EditorMarkBold,
  EditorMarkCode,
  EditorMarkHighlight,
  EditorMarkItalic,
  EditorMarkStrike,
  EditorMarkSubscript,
  EditorMarkSuperscript,
  EditorMarkTextColor,
  EditorMarkUnderline,
  EditorNodeBulletList,
  EditorNodeHeading1,
  EditorNodeHeading2,
  EditorNodeHeading3,
  EditorNodeOrderedList,
  EditorNodeQuote,
  EditorNodeTaskList,
  EditorNodeText,
  EditorSelector,
  EditorTableMenus,
} from "@marble/editor";

/**
 * Marble Editor Menus and Content
 *
 * This component provides the editor menus (bubble menu, table menus) and content.
 * It should be used inside an EditorProvider.
 */
export function MarbleEditorMenus() {
  return (
    <>
      <EditorBubbleMenu>
        <EditorSelector title="Text">
          <EditorNodeText />
          <EditorNodeHeading1 />
          <EditorNodeHeading2 />
          <EditorNodeHeading3 />
          <EditorNodeBulletList />
          <EditorNodeOrderedList />
          <EditorNodeTaskList />
          <EditorNodeQuote />
        </EditorSelector>

        <EditorSelector title="Format">
          <EditorMarkBold />
          <EditorMarkItalic />
          <EditorMarkUnderline />
          <EditorMarkStrike />
          <EditorMarkCode />
          <EditorMarkSuperscript />
          <EditorMarkSubscript />
        </EditorSelector>

        <EditorMarkTextColor />
        <EditorMarkHighlight />

        <EditorLinkSelector />

        <EditorAlignSelector />

        <EditorClearFormatting />
      </EditorBubbleMenu>

      <EditorContent />

      <EditorTableMenus />
    </>
  );
}

export default MarbleEditorMenus;
