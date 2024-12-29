"use client";

import { Folder } from "@/components/icons";
import { CreateSiteModal } from "@/components/site/create-site-modal";
import { Button, buttonVariants } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import { Plus, SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface PageClientProps {
  articles: { title: string; id: string; description: string | null }[];
  siteId: string;
}

function PageClient({ articles, siteId }: PageClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState("ascending");
  const [search, setSearch] = useState("");

  const handleSort = (order: string) => {
    setPosition(order);
    console.log("sort");
  };

  return (
    <div className="h-full flex flex-col max-w-screen-lg mx-auto">
      <section className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <SearchIcon
              size={16}
              className="text-muted-foreground size-4 absolute top-3 left-3"
            />
            <Input
              onChange={(e) => setSearch(e.target.value)}
              className="px-8 w-72"
            />
            {search.length > 0 && (
              <button type="button" className="absolute right-3 top-3">
                <XIcon className="size-4" />
                <span className="sr-only">Clear search</span>
              </button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Sort by:
                <span className="capitalize">{position}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={position}
                onValueChange={handleSort}
              >
                <DropdownMenuRadioItem value="ascending">
                  Ascending
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="descending">
                  Descending
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div>
          <Link
            href={`/editor/${siteId}/new?from=${encodeURIComponent(window.location.href)}`}
            className={buttonVariants({ variant: "default" })}
          >
            <Plus size={16} />
            <span>New article</span>
          </Link>
        </div>
      </section>
      {articles.length > 0 ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          {articles.map((article) => (
            <li key={article.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{article.title}</CardTitle>
                  <CardDescription>{article.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>view site</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid h-full w-full place-content-center">
          <div className="flex flex-col items-center">
            <Folder className="size-40 text-primary" />
            <div className="flex flex-col items-center gap-10">
              <p className="text-balance max-w-2xl mx-auto text-center">
                No articles yet. Click the button below to start writing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PageClient;
