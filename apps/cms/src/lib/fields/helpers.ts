export function buildFieldOptionWrites(
  options: Array<{ value: string; label: string }>
) {
  return options.map((option, index) => ({
    value: option.value,
    label: option.label,
    position: index,
  }));
}

export function areFieldOptionsEqual(
  nextOptions: Array<{ value: string; label: string }>,
  currentOptions: Array<{ value: string; label: string }>
) {
  if (nextOptions.length !== currentOptions.length) {
    return false;
  }

  return nextOptions.every((option, index) => {
    const currentOption = currentOptions[index];
    return (
      currentOption !== undefined &&
      option.value === currentOption.value &&
      option.label === currentOption.label
    );
  });
}
