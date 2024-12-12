"use client";

import { CreateSiteModal } from "@/components/nav/site-switcher";
import { Button } from "@repo/ui/components/button";
import { Plus } from "@repo/ui/lib/icons";
import Image from "next/image";
import { useState } from "react";

function Page() {
  const [isOpen, setIsOpen] = useState(false);
  return (
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
            You have no sites yet. Create a site to start writing articles. only
            takes a minute
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
  );
}

export default Page;
