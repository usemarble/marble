import { Input } from "@repo/ui/components/input";
import { Badge } from "@repo/ui/components/badge";
import { PostValues } from "@/lib/validations/post";
import { useState, ChangeEvent, useEffect } from "react";
import { useController, Control } from "react-hook-form";
import { Label } from "@repo/ui/components/label";

interface TagInputProps {
  control: Control<PostValues>;
}

function TagInput({ control }: TagInputProps) {
  const [tagInputValue, setTagInputValue] = useState<string>("");

  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({
    name: "tags",
    control,
    defaultValue: [],
  });

  const addTag = () => {
    const trimmedValue = tagInputValue.trim().toLowerCase();
    if (trimmedValue && !value.includes(trimmedValue) && value.length < 4) {
      onChange([...value, trimmedValue]);
      setTagInputValue("");
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTagInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addTag();
      console.log(value);
    }
  };

  const handleRemoveTag = (tagToDelete: string) => {
    onChange(value.filter((tag: string) => tag !== tagToDelete));
  };

  useEffect(() => {
    // Ensure the input is cleared when tags are updated externally
    if (value.length === 0) {
      setTagInputValue("");
    }
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="tags" className="mb-2">
        Tags
      </Label>
      <Input
        type="text"
        onBlur={addTag}
        value={tagInputValue}
        onKeyDown={handleKeyDown}
        onChange={handleInputChange}
        autoComplete="off"
        disabled={value.length >= 4}
        placeholder={
          value.length < 4
            ? "Press comma or enter to add a tag"
            : "Max tags reached"
        }
      />
      <div className="flex flex-wrap gap-2">
        {value.map((tag: string, index: number) => (
          <Badge
            key={`${tag}-${index}`}
            onClick={() => handleRemoveTag(tag)}
            className="py-0.5 px-2"
          >
            {tag}
          </Badge>
        ))}
      </div>
      {error && (
        <p className="text-sm px-1 font-medium text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}

export default TagInput;
