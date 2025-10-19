import { Button } from "@marble/ui/components/button";
import { Input } from "@marble/ui/components/input";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import { HexColorPicker } from "react-colorful";

const PRESET_COLORS = [
  "#fb7185", // Rose
  "#fdba74", // Orange
  "#d9f99d", // Lime
  "#a7f3d0", // Emerald
  "#a5f3fc", // Cyan
  "#a5b4fc", // Indigo
];

export const ColorPicker = ({
  color,
  onChange,
  onClear,
}: {
  color?: string;
  onChange: (color: string) => void;
  onClear: () => void;
}) => {
  const [hexInput, setHexInput] = useState(color || "");

  const handleHexInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setHexInput(value);

      // Validate hex color format
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        onChange(value);
      }
    },
    [onChange]
  );

  const handleColorChange = useCallback(
    (newColor: string) => {
      setHexInput(newColor);
      onChange(newColor);
    },
    [onChange]
  );

  return (
    <div className="flex flex-col gap-3 p-3">
      <HexColorPicker color={color || "#000000"} onChange={handleColorChange} />

      <div className="flex items-center gap-2">
        <Input
          className="h-8 font-mono text-xs"
          onChange={handleHexInputChange}
          placeholder="#000000"
          value={hexInput}
        />
      </div>

      <div className="flex items-center gap-2">
        {PRESET_COLORS.map((presetColor) => (
          <button
            className="size-6 rounded border border-border transition-transform hover:scale-110"
            key={presetColor}
            onClick={() => handleColorChange(presetColor)}
            style={{ backgroundColor: presetColor }}
            title={presetColor}
            type="button"
          />
        ))}
        <Button
          className="size-8 shrink-0"
          onClick={onClear}
          size="icon"
          title="Reset color"
          type="button"
          variant="ghost"
        >
          <ArrowCounterClockwiseIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
};
