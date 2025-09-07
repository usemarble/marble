import { cn } from "@marble/ui/lib/utils";

interface ErrorMessageProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

const ErrorMessage = ({ children, className, ...props }: ErrorMessageProps) => {
  return (
    <p
      aria-live="polite"
      className={cn("text-destructive px-1 text-xs font-medium", className)}
      {...props}
    >
      {children}
    </p>
  );
};

ErrorMessage.displayName = "ErrorMessage";

export { ErrorMessage };
