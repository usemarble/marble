import { ReactNodeViewRenderer } from "@tiptap/react";
import { AudioFigure } from "./audio";
import { AudioView } from "./audio-view";

export const Audio = AudioFigure.extend({
  addNodeView() {
    return ReactNodeViewRenderer(AudioView);
  },
});
