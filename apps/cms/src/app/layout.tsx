import type { Metadata } from "next";
import "@/styles/globals.css";
import "@/styles/editor.css";
import { Geist } from "next/font/google";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { siteConfig } from "@/lib/seo";
import { UserProvider } from "@/providers/user";
import type { UserProfile } from "@/types/user";
import Providers from "./providers";

export const metadata: Metadata = {
  title: siteConfig.title,
  metadataBase: new URL(siteConfig.url),
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: `${siteConfig.url}/og.jpg`,
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
  },
  twitter: {
    images: [
      {
        url: `${siteConfig.url}/og.jpg`,
        width: "1200",
        height: "630",
      },
    ],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/icon.svg",
    apple: "/apple-icon.png",
  },
};

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

async function getInitialUserData(): Promise<{
  user: UserProfile | null;
  isAuthenticated: boolean;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { user: null, isAuthenticated: false };
    }

    // If there's a session, fetch complete user data from our API
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const cookieHeader = (await headers()).get("cookie") || "";

    const response = await fetch(`${baseUrl}/api/user`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (response.ok) {
      const userData = (await response.json()) as UserProfile;
      return { user: userData, isAuthenticated: true };
    }
    // If API call fails, fall back to basic session data
    console.warn(
      "Failed to fetch user data from API, falling back to session data",
    );
    return { user: null, isAuthenticated: true };
  } catch (error) {
    console.error("Error fetching initial user data:", error);
    return { user: null, isAuthenticated: false };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user: initialUser, isAuthenticated } = await getInitialUserData();

  return (
    <html lang="en" suppressHydrationWarning>
      {/* <head>
        <script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
        />
      </head> */}
      <body className={`${fontSans.className} font-sans antialiased`}>
        <Providers>
          <UserProvider
            initialUser={initialUser}
            initialIsAuthenticated={isAuthenticated}
          >
            {children}
          </UserProvider>
        </Providers>
      </body>
    </html>
  );
}
