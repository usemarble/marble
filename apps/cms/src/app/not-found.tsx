"use client";

import { Button } from "@marble/ui/components/button";
import { ArrowArcLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <h1 className="font-bold text-5xl">404</h1>
      <p className="mt-2 text-2xl">Page not found</p>

      <Button className="mt-4" render={<Link href="/" />}>
        <ArrowArcLeftIcon className="size-4" /> Go to homepage
      </Button>
    </main>
  );
}
