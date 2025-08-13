import type { Metadata } from "next";
import "@/styles/globals.css";
import "@/styles/editor.css";
import { Geist } from "next/font/google";
import { getInitialUserData } from "@/lib/queries/user";
import { UserProvider } from "@/providers/user";
import { SITE_CONFIG } from "@/utils/site";
import Providers from "./providers";
import { Databuddy } from "@databuddy/sdk";

export const metadata: Metadata = {
  title: SITE_CONFIG.title,
  metadataBase: new URL(SITE_CONFIG.url),
  description: SITE_CONFIG.description,
  keywords: SITE_CONFIG.keywords,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_CONFIG.url,
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    images: [
      {
        url: `${SITE_CONFIG.url}/og.jpg`,
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.title,
      },
    ],
  },
  twitter: {
    images: [
      {
        url: `${SITE_CONFIG.url}/og.jpg`,
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user: initialUser, isAuthenticated } = await getInitialUserData();

  return (
    <html lang="en" suppressHydrationWarning>
      {process.env.NODE_ENV === "development" && (
        <head>
          <script
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
          />
        </head>
      )}
      <body className={`${fontSans.className} font-sans antialiased`}>
        <Providers>
          <UserProvider
            initialUser={initialUser}
            initialIsAuthenticated={isAuthenticated}
          >
            {children}
            <Databuddy clientId="Dq_1D8IsZscrCY2rNneFZ" enableBatching={true} />
          </UserProvider>
        </Providers>
      </body>
    </html>
  );
}
