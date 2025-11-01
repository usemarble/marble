import { cn } from "@marble/ui/lib/utils";
import { forwardRef } from "react";

/* biome-ignore lint/nursery/noReactForwardRef: forwardRef is used intentionally for ref forwarding */
export const DropdownButton = forwardRef<
  HTMLButtonElement,
  {
    children: React.ReactNode;
    isActive?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
  }
>((props, ref) => {
  const { children, isActive, onClick, disabled, className } = props;

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
});

DropdownButton.displayName = "DropdownButton";
