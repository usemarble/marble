"use client";

import { useUser } from "@/providers/user";

export default function PageClient() {
  const { user, isFetchingUser } = useUser();

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center p-4">
      <h1 className="mb-4 text-2xl font-semibold">
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
