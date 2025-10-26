import { cn } from "@marble/ui/lib/utils";

interface ErrorMessageProps
	extends React.HTMLAttributes<HTMLParagraphElement> {}

const ErrorMessage = ({ children, className, ...props }: ErrorMessageProps) => {
	return (
		<p
			aria-live="polite"
			className={cn("px-1 font-medium text-destructive text-xs", className)}
			{...props}
		>
			{children}
		</p>
	);
};

ErrorMessage.displayName = "ErrorMessage";

export { ErrorMessage };
