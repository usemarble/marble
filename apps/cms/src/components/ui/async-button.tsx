"use client";

import { Button } from "@marble/ui/components/button";
import type { ComponentProps, ReactNode, RefObject } from "react";
import { ButtonLoadingSpinner } from "./loading-spinner";

interface AsyncButtonProps extends ComponentProps<typeof Button> {
  /**
   * Whether the button is in a loading state
   */
  isLoading?: boolean;
  /**
   * Text to display when not loading
   */
  children: ReactNode;
  /**
   * Optional loading text to display when loading (takes priority over children)
   */
  loadingText?: string;
  /**
   * Whether to keep the original children text while loading
   * If false (default), only spinner is shown
   * If true, shows spinner + children
   * Note: loadingText takes priority over this prop
   */
  keepTextWhileLoading?: boolean;
  /**
   * Optional ref for the underlying button element
   */
  ref?: RefObject<HTMLButtonElement | null>;
}

const AsyncButton = ({
  children,
  isLoading = false,
  loadingText,
  keepTextWhileLoading = false,
  disabled,
  variant = "default",
  className,
  ref,
  ...props
}: AsyncButtonProps) => {
  const renderLoadingContent = () => {
    // Priority: loadingText > keepTextWhileLoading > spinner only
    if (loadingText) {
      return (
        <>
          <ButtonLoadingSpinner className="mr-2" variant={variant} />
          {loadingText}
        </>
      );
    }

    if (keepTextWhileLoading) {
      return (
        <>
          <ButtonLoadingSpinner className="mr-2" variant={variant} />
          {children}
        </>
      );
    }

    // Default: spinner only
    return <ButtonLoadingSpinner variant={variant} />;
  };

  return (
    <Button
      className={className}
      disabled={disabled || isLoading}
      ref={ref}
      variant={variant}
      {...props}
    >
      {isLoading ? renderLoadingContent() : children}
    </Button>
  );
};

AsyncButton.displayName = "AsyncButton";

export { AsyncButton };
