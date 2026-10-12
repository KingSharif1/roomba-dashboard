import type { Metadata } from "next";
import { Geist, Geist_Mono, Schibsted_Grotesk } from "next/font/google";
import { RobotProvider } from "@/components/connection/robot-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  weight: "700",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://roomba.kingsharif.com"),
  title: "Stella — robot dashboard",
  description: "Stella — robot dashboard",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/brand/stella-paper-mark.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/apple-touch-icon.png", type: "image/png" }],
  },
  openGraph: {
    title: "Stella — robot dashboard",
    description: "Stella — robot dashboard",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stella — robot dashboard",
    description: "Stella — robot dashboard",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <RobotProvider>{children}</RobotProvider>
      </body>
    </html>
  );
}
