import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Toaster from "@/components/Toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ApplyPilot — AI Job Application Assistant",
  description:
    "Tailor your CV and cover letters, scan ATS compatibility, run interview prep, and track applications — all powered by the AI provider of your choice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen scrollbar">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
