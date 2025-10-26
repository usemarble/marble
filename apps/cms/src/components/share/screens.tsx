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
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-sidebar dark:bg-accent/50">
        <LinkBreakIcon className="size-6 dark:text-accent-foreground" />
      </div>
      <h1 className="font-bold text-4xl">Expired</h1>
      <p className="mt-2 text-muted-foreground text-xl">
        This link has expired and is no longer accessible.
      </p>

      <Link className={cn("mt-6", buttonVariants())} href="/">
        <ArrowArcLeftIcon className="size-4" /> Go to Dashboard
      </Link>
    </main>
  );
}

export function LinkNotFound() {
  return (
    <main className="flex h-screen flex-col items-center justify-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-sidebar dark:bg-accent/50">
        <LinkBreakIcon className="size-6 dark:text-accent-foreground" />
      </div>
      <h1 className="font-bold text-4xl">Link Not Found</h1>
      <p className="mt-2 text-muted-foreground text-xl">
        This share link could not be found or is no longer valid.
      </p>

      <Link className={cn("mt-6", buttonVariants())} href="/">
        <ArrowArcLeftIcon className="size-4" /> Go to Dashboard
      </Link>
    </main>
  );
}
