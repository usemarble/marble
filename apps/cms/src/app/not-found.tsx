"use client";

import { Button } from "@marble/ui/components/button";
import { ArrowArcLeft } from "@phosphor-icons/react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <h1 className="font-bold text-5xl">404</h1>
      <p className="mt-2 text-2xl">Page not found</p>

      <Button asChild className="mt-4">
        <Link href="/">
          <ArrowArcLeft className="mr-2 h-4 w-4" /> Go to homepage
        </Link>
      </Button>
    </main>
  );
}
