import type { Metadata } from "next";
import { Geist_Mono, Montserrat } from "next/font/google";

import { AppHeader } from "@/components/layout/header";
import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Training Dashboard",
  description: "Workout analytics and import for your training history",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${montserrat.variable} ${geistMono.variable} min-h-screen antialiased font-sans`}
      >
        <AppProviders>
          <AppHeader />
          <main>{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
