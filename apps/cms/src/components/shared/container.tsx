import { cn } from "@marble/ui/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function Container({ className, children, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto h-full w-full max-w-(--breakpoint-2xl) px-6 md:px-12 lg:px-20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Container;
