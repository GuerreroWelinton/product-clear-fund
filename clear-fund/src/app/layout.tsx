import type { Metadata } from "next";
import { Roboto } from "next/font/google";

import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

// Roboto is Material Design 3's canonical typeface. Exposed as --font-sans so
// the Tailwind `font-sans` utility and the base html style actually use it.
const roboto = Roboto({
  variable: "--font-sans",
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
    // next-themes writes the theme class on <html> before paint, so the server
    // markup cannot match.
    <html
      lang="es"
      className={`${roboto.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
