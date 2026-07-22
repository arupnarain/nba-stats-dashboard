import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Hardwood Analytics · NBA Stats",
  description:
    "A live NBA stats dashboard — players, teams, league leaders, injuries, news, and the 2026 draft. Built with Next.js, TypeScript, Tailwind, and Radix UI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
