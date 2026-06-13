import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Toaster from "@/components/Toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ApplyPilot — AI Job Application Assistant",
  description:
    "Tailor your CV and cover letters, scan ATS compatibility, and track applications with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-y-auto scrollbar">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
