import { cn } from "@marble/ui/lib/utils";
import { forwardRef } from "react";

interface ErrorMessageProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

const ErrorMessage = ({ children, className, ...props }: ErrorMessageProps) => {
  return (
    <p
      aria-live="polite"
      className={cn("text-xs px-1 font-medium text-destructive", className)}
      {...props}
    >
      {children}
    </p>
  );
};

ErrorMessage.displayName = "ErrorMessage";

export { ErrorMessage };
