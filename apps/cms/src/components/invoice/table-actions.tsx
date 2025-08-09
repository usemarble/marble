import { Button } from "@marble/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@marble/ui/components/dropdown-menu";
import { Copy, DownloadSimple } from "@phosphor-icons/react";
import { MoreHorizontal } from "lucide-react";
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
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="text-muted-foreground">
        <DropdownMenuItem>
          <button
            type="button"
            onClick={() => console.log("download invoice")}
            className="flex w-full items-center gap-2"
          >
            <DownloadSimple size={16} /> <span>Download Invoice</span>
          </button>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <button
            type="button"
            onClick={() => handleCopyInvoiceId()}
            className="flex w-full items-center gap-2"
          >
            <Copy size={16} /> <span>Copy Invoice ID</span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
