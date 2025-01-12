import type { Metadata } from "next";
import "@/styles/globals.css";
import "@/styles/editor.css";
import { siteConfig } from "@/lib/site-config";
import { Geist } from "next/font/google";
import Providers from "./providers";

export const metadata: Metadata = {
  title: `${siteConfig.title}`,
  description: siteConfig.description,
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
