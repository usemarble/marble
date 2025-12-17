import type { RefAttributes, SVGProps } from "react";

type SVGAttributes = Partial<SVGProps<SVGSVGElement>>;
type ElementAttributes = RefAttributes<SVGSVGElement> & SVGAttributes;

export interface IconProps extends ElementAttributes {
  size?: string | number;
  absoluteStrokeWidth?: boolean;
}
