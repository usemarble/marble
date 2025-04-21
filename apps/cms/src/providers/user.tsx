"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface UserContextType {
  user: { name: string };
  setUser: (user: { name: string }) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: React.ReactNode;
  initialUser: { name: string };
}

export function UserProvider({ children, initialUser }: UserProviderProps) {
  const [user, setUser] = useState<{ name: string }>(initialUser);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
