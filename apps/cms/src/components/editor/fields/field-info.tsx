import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { InfoIcon } from "@phosphor-icons/react";

interface FieldInfoProps {
  /**
   * The information text to display in the tooltip
   */
  text: string;
  /**
   * Additional className for the icon
   */
  className?: string;
}

export function FieldInfo({
  text,
  className = "size-4 text-gray-400",
}: FieldInfoProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={<InfoIcon className={className} />} />
      <TooltipContent>
        <p className="max-w-64 text-balance text-xs">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}
