"use client";

import { Button } from "@marble/ui/components/button";
import Link from "next/link";
import { useUser } from "@/providers/user";

export default function PageClient() {
  const { user, isAuthenticated, isFetchingUser } = useUser();

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Not authenticated</h2>
          <p className="text-muted-foreground mb-4">
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
    <>
      <div className="p-4 flex flex-col flex-1 h-full items-center justify-center">
        <h1 className="text-2xl font-semibold mb-4">
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
    </>
  );
}
