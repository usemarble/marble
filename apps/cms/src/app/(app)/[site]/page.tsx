import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import { ArrowUpDown, ListFilter, PlusCircle } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/table/data-table";
import { columns } from "@/components/table/columns";
import { dummyArticles } from "@/lib/constants";

async function Page({ params }: { params: { site: string } }) {
  const { site } = params;
  // TODO throw 404 page for users that arent part of the site
  // For former members that were removed we might show a page stating they've been removed :)

  return (
    <div className="flex h-screen flex-col gap-4">
      <section className="bg-background/90 w-full backdrop-blur-lg">
        <h1 className="text-center text-2xl font-bold capitalize">{site}</h1>
      </section>

      <section>
        <DataTable columns={columns} data={dummyArticles} />
      </section>
    </div>
  );
}

export default Page;
