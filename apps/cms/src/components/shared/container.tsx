import { cn } from "@marble/ui/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function Container({ className, children, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "h-full mx-auto w-full max-w-screen-2xl px-6 md:px-12 lg:px-20",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default Container;
