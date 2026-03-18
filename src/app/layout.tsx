import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cloud Board Lab",
  description:
    "Portfolio-style developer blog with CRUD posts, board, admin auth, attachments, and deployment practice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff5dc_0%,#f4ead7_36%,#efe5d1_100%)] text-zinc-950">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
