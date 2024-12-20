import type { Metadata } from "next";
import "@/styles/globals.css";
import "@/styles/editor.css";
import { siteConfig } from "@/lib/site-config";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import Providers from "./providers";

export const metadata: Metadata = {
  title: `${siteConfig.title} - ${siteConfig.description}`,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
