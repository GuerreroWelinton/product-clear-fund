import type { Metadata } from "next";
import { Geist_Mono, Roboto } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

// Roboto is Material Design 3's canonical typeface. Exposed as --font-sans so
// the Tailwind `font-sans` utility and the base html style actually use it.
const roboto = Roboto({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clear Fund",
  description: "Administración de cajas de ahorro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${roboto.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
