function initCopyButtons() {
  const buttons = document.querySelectorAll("[data-copy]");

  for (const button of buttons) {
    if (!(button instanceof HTMLButtonElement)) {
      continue;
    }

    const label = button.textContent ?? "Copy";
    button.addEventListener("click", async () => {
      const value = button.dataset.copy;
      if (!value) {
        return;
      }

      await navigator.clipboard.writeText(value);
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = label;
      }, 1600);
    });
  }
}

initCopyButtons();
