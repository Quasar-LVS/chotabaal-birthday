import type { Metadata } from "next";
import "./globals.css";

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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-cloud-pink text-dusty-plum font-sans selection:bg-sakura/40 selection:text-dusty-plum">
        {children}
      </body>
    </html>
  );
}
