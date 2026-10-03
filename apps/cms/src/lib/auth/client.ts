import { createAuthClient } from "@marble/auth/client";
import { toast } from "@marble/ui/components/sonner";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  fetchOptions: {
    credentials: "include",
    onError(e) {
      if (typeof window !== "undefined" && e.error.status === 429) {
        toast.error("Too many requests. Please try again later.");
      }
    },
  },
});

export const {
  signUp,
  signIn,
  signOut,
  useSession,
  organization,
  useListOrganizations,
  useActiveOrganization,
  emailOtp,
  checkout,
} = authClient;
