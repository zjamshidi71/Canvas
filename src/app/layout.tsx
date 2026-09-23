import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: "Canvas — Discover & Collect Original Art",
  description:
    "An online gallery for discovering and collecting original contemporary art from emerging and established artists worldwide.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gallery-bg text-gallery-text font-sans">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
