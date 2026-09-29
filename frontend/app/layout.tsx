import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { BrandingShell } from "./BrandingShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Roadwise | Driving school operations",
  description:
    "Manage students, instructors, lessons, and progress in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.className}>
      <body><BrandingShell>{children}</BrandingShell></body>
    </html>
  );
}
