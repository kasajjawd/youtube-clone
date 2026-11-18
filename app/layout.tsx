import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import NavbarAndSidebar from "@/components/NavbarAndSidebar";

export const metadata: Metadata = {
  title: "YewTube",
  description: "Watch, search, and explore creators on YewTube",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0f0f0f] text-white antialiased">
        <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f]" />}>
          <NavbarAndSidebar>{children}</NavbarAndSidebar>
        </Suspense>
      </body>
    </html>
  );
}
