"use client";

import { CreateSiteModal } from "@/components/create-site-modal";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface PageClientProps {
  sites: { name: string; id: string; description: string | null }[] | null;
}

function PageClient({ sites }: PageClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {sites && sites.length > 0 ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 p-4">
          {sites.map((site) => (
            <li key={site.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{site.name}</CardTitle>
                  <CardDescription>{site.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>dsds</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <section className="grid h-full w-full place-content-center">
          <div className="flex flex-col items-center">
            <Image
              width={300}
              height={300}
              src={"/vacation.svg"}
              alt="You have no articles yet"
            />
            <div className="flex flex-col items-center space-y-4">
              <p className="text-balance">
                You have no sites yet. Create a site to start writing articles.
                only takes a minute
              </p>
              <Button
                onClick={() => setIsOpen(true)}
                className="hover:ring-primary group flex items-center gap-2 px-8 py-2 text-sm capitalize transition-all duration-300 ease-out hover:ring-2 hover:ring-offset-2"
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
