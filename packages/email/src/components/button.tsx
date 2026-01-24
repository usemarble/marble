import { Button as ReactEmailButton } from "@react-email/components";
import type { ComponentProps } from "react";

type EmailButtonProps = ComponentProps<typeof ReactEmailButton>;

export const EmailButton = ({
  children,
  className,
  ...props
}: EmailButtonProps) => {
  const baseClasses =
    "rounded-lg bg-[#766df8] px-6 py-3 font-semibold text-sm text-white";
  const combinedClassName = className
    ? `${baseClasses} ${className}`
    : baseClasses;

  return (
    <ReactEmailButton {...props} className={combinedClassName}>
      {children}
    </ReactEmailButton>
  );
};
