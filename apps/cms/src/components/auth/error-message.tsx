import { cn } from "@repo/ui/lib/utils";
import React, { forwardRef } from "react";

interface ErrorMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  message: string | undefined;
}

const ErrorMessage = forwardRef<HTMLParagraphElement, ErrorMessageProps>(
  ({ className, message, ...props }, ref) => {
    return (
      <p
        ref={ref}
        aria-live="polite"
        className={cn("text-xs px-1 font-medium text-destructive", className)}
        {...props}
      >
        {message}
      </p>
    );
  },
);

ErrorMessage.displayName = "ErrorMessage";

export { ErrorMessage };
