import { Skeleton } from "@marble/ui/components/skeleton";

export default function Loading() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b px-4 py-4">
        <Skeleton className="h-8 w-40" />
      </header>
      <main className="mx-auto flex max-w-screen-md flex-col gap-6 px-4 py-14 lg:py-20">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
      </main>
    </div>
  );
}
