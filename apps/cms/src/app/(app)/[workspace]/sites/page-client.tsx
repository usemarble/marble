"use client";

import { Add } from "@/components/icons/isometric";
import { useWorkspace } from "@/components/providers/workspace";
import { CreateSiteModal } from "@/components/site/create-site-modal";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Plus } from "@repo/ui/lib/icons";
import Link from "next/link";
import { useState } from "react";

interface PageClientProps {
  sites: { name: string; id: string; description: string | null }[] | null;
}

function PageClient({ sites }: PageClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { workspace } = useWorkspace();

  return (
    <>
      {sites && sites.length > 0 ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 p-4">
          {sites.map((site) => (
            <li key={site.id}>
              <Link href={`/${workspace?.slug}/sites/${site.id}`}>
                <Card>
                  <CardHeader>
                    <CardTitle>{site.name}</CardTitle>
                    <CardDescription>{site.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>view site</p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <section className="grid h-full w-full place-content-center">
          <div className="flex flex-col items-center">
            <Add className="size-40 text-primary" />
            <div className="flex flex-col items-center gap-10">
              <p className="text-balance max-w-2xl mx-auto text-center">
                You have no sites yet. Create a site to start writing articles.
                only takes a minute
              </p>
              <Button
                onClick={() => setIsOpen(true)}
                size="sm"
                className="hover:ring-primary group flex items-center gap-2 text-sm capitalize transition-all duration-300 ease-out hover:ring-2 hover:ring-offset-2"
              >
                <Plus size={16} />
                <span>New site</span>
              </Button>
            </div>
          </div>
          <CreateSiteModal open={isOpen} setOpen={setIsOpen} />
        </section>
      )}
    </>
  );
}

export default PageClient;
