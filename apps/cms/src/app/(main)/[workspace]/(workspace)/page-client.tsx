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
  );
}
