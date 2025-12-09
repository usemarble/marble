import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { InfoIcon } from "@phosphor-icons/react";

type FieldInfoProps = {
  /**
   * The information text to display in the tooltip
   */
  text: string;
  /**
   * Additional className for the icon
   */
  className?: string;
};

export function FieldInfo(props: FieldInfoProps) {
  const { text, className = "size-4 text-gray-400" } = props

  return (
    <Tooltip>
      <TooltipTrigger className="cursor-help">
        <InfoIcon className={className} />
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-64 text-balance text-xs">{text}</p>
      </TooltipContent>
    </Tooltip>
  )
}
