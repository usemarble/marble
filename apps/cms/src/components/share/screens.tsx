import { buttonVariants } from "@marble/ui/components/button";
import { cn } from "@marble/ui/lib/utils";
import {
  ArrowArcLeftIcon,
  LinkBreakIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export function LinkExpired() {
  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <div className="mx-auto mb-4 flex size-12 bg-sidebar dark:bg-accent/50 items-center justify-center rounded-full ">
        <LinkBreakIcon className="size-6 dark:text-accent-foreground" />
      </div>
      <h1 className="text-4xl font-bold">Expired</h1>
      <p className="mt-2 text-xl text-muted-foreground">
        This link has expired and is no longer accessible.
      </p>

      <Link href="/" className={cn("mt-6", buttonVariants())}>
        <ArrowArcLeftIcon className="size-4" /> Go to Dashboard
      </Link>
    </main>
  );
}

export function LinkNotFound() {
  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <div className="mx-auto mb-4 flex size-12 bg-sidebar dark:bg-accent/50 items-center justify-center rounded-full ">
        <LinkBreakIcon className="size-6 dark:text-accent-foreground" />
      </div>
      <h1 className="text-4xl font-bold">Link Not Found</h1>
      <p className="mt-2 text-xl text-muted-foreground">
        This share link could not be found or is no longer valid.
      </p>

      <Link href="/" className={cn("mt-6", buttonVariants())}>
        <ArrowArcLeftIcon className="size-4" /> Go to Dashboard
      </Link>
    </main>
  );
}
