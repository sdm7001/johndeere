import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { appConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "John Deere Warranty CDR",
  description: "Dealer-grade John Deere warranty CDR claim drafting MVP.",
  metadataBase: new URL(appConfig.productionUrl),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const body = <body>{children}</body>;

  return (
    <html lang="en">
      {appConfig.clerkIsConfigured ? <ClerkProvider>{body}</ClerkProvider> : body}
    </html>
  );
}
