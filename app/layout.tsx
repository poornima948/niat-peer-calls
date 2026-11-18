import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NIAT Parent Peer Calls",
  description: "Talk to a parent whose child already studies in NIAT.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
