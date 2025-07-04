"use client";

import { Button } from "@marble/ui/components/button";
import { Card, CardContent, CardHeader } from "@marble/ui/components/card";
import { Skeleton } from "@marble/ui/components/skeleton";
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

  if (isFetchingUser || !user) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 flex flex-col flex-1 h-full items-center justify-center">
        <h1 className="text-2xl font-semibold mb-4">
          {getTimeOfDay()}, {user.name}
        </h1>
        <p className="text-muted-foreground">
          Workspace metrics are coming soon!
        </p>
      </div>
    </>
  );
}
