import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { CopyIcon, DownloadSimpleIcon, DotsThreeIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Invoice } from "./columns";

export default function TableActions(props: Invoice) {
  const handleCopyInvoiceId = () => {
    navigator.clipboard.writeText(props.id);
    toast.success("ID copied to clipboard");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-8 w-8 p-0" variant="ghost">
          <span className="sr-only">Open menu</span>
          <DotsThreeIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="text-muted-foreground">
        <DropdownMenuItem>
          <button
            className="flex w-full items-center gap-2"
            onClick={() => console.log("download invoice")}
            type="button"
          >
            <DownloadSimpleIcon size={16} /> <span>Download Invoice</span>
          </button>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <button
            className="flex w-full items-center gap-2"
            onClick={() => handleCopyInvoiceId()}
            type="button"
          >
            <CopyIcon size={16} /> <span>Copy Invoice ID</span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
