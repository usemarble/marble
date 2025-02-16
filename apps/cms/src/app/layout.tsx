import type { Metadata } from "next";
import "@/styles/globals.css";
import "@/styles/editor.css";
import { siteConfig } from "@/lib/site-config";
import { Geist } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.className} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
