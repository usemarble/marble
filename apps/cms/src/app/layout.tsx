import type { Metadata } from "next";
import "@/styles/globals.css";
import "@/styles/editor.css";
import { Databuddy } from "@databuddy/sdk/react";
import { Geist } from "next/font/google";
import { SITE_CONFIG } from "@/utils/site";
import Providers from "./providers";

export const metadata: Metadata = {
  title: SITE_CONFIG.title,
  metadataBase: new URL(SITE_CONFIG.url),
  description: SITE_CONFIG.description,
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

function DatabuddyAnalytics() {
  return (
    <>
      {process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID && (
        <Databuddy
          clientId={process.env.NEXT_PUBLIC_DATABUDDY_CLIENT_ID}
          enableBatching={true}
        />
      )}
    </>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === "development" && (
          <script
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
          />
        )}
      </head>
      <DatabuddyAnalytics />
      <body className={`${fontSans.className} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
