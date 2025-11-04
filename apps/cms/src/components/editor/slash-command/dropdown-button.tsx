import { cn } from "@marble/ui/lib/utils";
import type { Ref } from "react";

type DropdownButtonProps = {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
};

export const DropdownButton = ({
  children,
  isActive,
  onClick,
  disabled,
  className,
  ref,
}: DropdownButtonProps) => {
  const buttonClass = cn(
    "flex w-full items-center gap-2 rounded-[6px] bg-transparent px-2 py-1 text-left font-medium text-sm",
    !isActive && !disabled && "hover:bg-accent",
    isActive && !disabled && "bg-accent",
    disabled && "cursor-not-allowed opacity-50",
    className
  );

  return (
    <button
      className={buttonClass}
      disabled={disabled}
      onClick={onClick}
      ref={ref}
      type="button"
    >
      {children}
    </button>
  );
};

DropdownButton.displayName = "DropdownButton";
