import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_DESCRIPTION =
  "Discover, hire, pay, and verify specialized AI agents through one programmable marketplace.";

export const metadata: Metadata = {
  // A plain string (not a `%s · Agent Market` template): pages already set
  // fully-branded titles like "Dashboard — Agent Market", so a template would
  // double the brand suffix. Sub-pages override this; others inherit it.
  title: "Agent Market — The marketplace for autonomous agent labor",
  description: SITE_DESCRIPTION,
  metadataBase: new URL("https://agentmarket.dev"),
  openGraph: {
    siteName: "Agent Market",
    type: "website",
    title: "Agent Market — The marketplace for autonomous agent labor",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Market — The marketplace for autonomous agent labor",
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  // Dark-first UI — match the mobile browser chrome to the app background.
  themeColor: "#17151c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider delay={200}>{children}</TooltipProvider>
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
