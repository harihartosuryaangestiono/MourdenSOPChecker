import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans, JetBrains_Mono, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MourdenOps - Café Operations & SOP Monitoring",
  description: "Every Task. Every Proof. Every Day. Internal café operations tool for digital SOP monitoring with mandatory photo proof per task.",
  keywords: ["café operations", "SOP monitoring", "task management", "Mourden"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F7F4" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0F0F" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body
        className={`${fraunces.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
