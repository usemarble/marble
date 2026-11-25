type Media = HTMLImageElement | HTMLVideoElement;

function getAspectRatio(media: Media, bounds: DOMRect) {
  if (media instanceof HTMLImageElement && media.naturalHeight) {
    return media.naturalWidth / media.naturalHeight;
  }
  if (media instanceof HTMLVideoElement && media.videoHeight) {
    return media.videoWidth / media.videoHeight;
  }
  return bounds.width / bounds.height;
}

function expandVideo(
  video: HTMLVideoElement,
  content: HTMLElement,
  bounds: DOMRect
) {
  const placeholder = document.createElement("span");
  const { marginBlockStart, marginBlockEnd } = getComputedStyle(video);
  placeholder.style.display = "block";
  placeholder.style.width = `${bounds.width}px`;
  placeholder.style.height = `${bounds.height}px`;
  placeholder.style.marginBlockStart = marginBlockStart;
  placeholder.style.marginBlockEnd = marginBlockEnd;
  video.before(placeholder);

  const hadControls = video.controls;
  video.controls = true;
  content.append(video);

  return () => {
    video.controls = hadControls;
    placeholder.replaceWith(video);
  };
}

function expandImage(image: HTMLImageElement, content: HTMLElement) {
  const expanded = new Image();
  expanded.alt = image.alt;
  expanded.src = image.currentSrc || image.src;
  content.append(expanded);

  return () => expanded.remove();
}

function addTrigger(
  media: Media,
  videoTrigger: HTMLTemplateElement,
  open: (trigger: HTMLButtonElement) => void
) {
  const target = media.closest("picture") ?? media;
  if (target.closest("a, button") || media.hasAttribute("usemap")) {
    return;
  }

  const trigger =
    media instanceof HTMLVideoElement
      ? document.importNode(videoTrigger.content, true).querySelector("button")
      : document.createElement("button");
  if (!trigger) {
    return;
  }

  if (media instanceof HTMLVideoElement) {
    const wrapper = document.createElement("span");
    wrapper.className = "blog-video-zoom relative block w-fit max-w-full";
    media.before(wrapper);
    wrapper.append(media, trigger);
  } else {
    trigger.type = "button";
    trigger.setAttribute("aria-haspopup", "dialog");
    trigger.className =
      "blog-image-zoom block max-w-full cursor-zoom-in rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
    trigger.setAttribute(
      "aria-label",
      media.alt ? `View full size image, ${media.alt}` : "View full size image"
    );
    target.before(trigger);
    trigger.append(target);
  }
  trigger.addEventListener("click", () => open(trigger));
}

function initMediaZoom() {
  const dialog = document.querySelector<HTMLDialogElement>("#blog-media-zoom");
  const content = dialog?.querySelector<HTMLElement>(
    "[data-media-zoom-content]"
  );
  const videoTrigger = dialog?.querySelector<HTMLTemplateElement>(
    "[data-media-zoom-video-trigger]"
  );
  if (!(dialog && content && videoTrigger) || dialog.dataset.ready) {
    return;
  }
  dialog.dataset.ready = "true";

  let restoreMedia: (() => void) | undefined;

  const close = () => {
    for (const animation of content.getAnimations()) {
      animation.cancel();
    }
    restoreMedia?.();
    restoreMedia = undefined;
    dialog.close();
  };

  dialog.addEventListener("click", (event) => {
    if (
      event.target === dialog ||
      event.target instanceof HTMLImageElement ||
      (event.target instanceof Element &&
        event.target.closest("[data-media-zoom-close]"))
    ) {
      close();
    }
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  document.addEventListener("astro:before-swap", close, { once: true });

  for (const media of document.querySelectorAll<Media>(
    "[data-zoomable-media] :is(img, video)"
  )) {
    addTrigger(media, videoTrigger, (trigger) => {
      const bounds = media.getBoundingClientRect();
      if (dialog.open || !bounds.width || !bounds.height) {
        return;
      }
      if (
        media instanceof HTMLImageElement &&
        !(media.currentSrc || media.src)
      ) {
        return;
      }

      content.style.setProperty(
        "--media-ratio",
        String(getAspectRatio(media, bounds))
      );
      trigger.focus({ preventScroll: true });
      dialog.showModal();
      restoreMedia =
        media instanceof HTMLVideoElement
          ? expandVideo(media, content, bounds)
          : expandImage(media, content);

      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const expanded = content.getBoundingClientRect();
        const transform = `translate(${bounds.left - expanded.left}px, ${bounds.top - expanded.top}px) scale(${bounds.width / expanded.width}, ${bounds.height / expanded.height})`;
        content.animate([{ transform }, { transform: "none" }], {
          duration: 280,
          easing: "cubic-bezier(0.2, 0, 0, 1)",
        });
      }
    });
  }
}

initMediaZoom();
document.addEventListener("astro:page-load", initMediaZoom);
