import type { Metadata } from "next";
import { Playfair_Display, Caveat } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

import { siteContent } from "@/content/content";

export const metadata: Metadata = {
  title: siteContent.title,
  description: siteContent.heroSubtitle,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cloud-pink text-dusty-plum font-sans selection:bg-sakura/40 selection:text-dusty-plum">
        {children}
      </body>
    </html>
  );
}
