"use client";

import { Button } from "@marble/ui/components/button";
import Link from "next/link";
import { useUser } from "@/providers/user";

export default function PageClient() {
  const { user, isAuthenticated, isFetchingUser } = useUser();

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "Good morning";
    }
    if (hour < 17) {
      return "Good afternoon";
    }
    return "Good evening";
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 font-semibold text-xl">Not authenticated</h2>
          <p className="mb-4 text-muted-foreground">
            Please log in to continue
          </p>
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center p-4">
      <h1 className="mb-4 font-semibold text-2xl">
        {isFetchingUser ? (
          getTimeOfDay()
        ) : (
          <>
            {getTimeOfDay()}, {user?.name}
          </>
        )}
      </h1>
      <p className="text-muted-foreground">
        Workspace metrics are coming soon!
      </p>
    </div>
  );
}
