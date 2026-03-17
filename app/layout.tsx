import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TravelTrack — Track the Countries You've Visited",
  description:
    "Interactively track and share every country you've visited on a beautiful world map.",
  openGraph: {
    title: "TravelTrack",
    description: "Track and share every country you've visited on a world map.",
    url: "https://traveltrack.me",
    siteName: "TravelTrack",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TravelTrack",
    description: "Track and share every country you've visited on a world map.",
  },
  metadataBase: new URL("https://traveltrack.me"),
  manifest: "/manifest.json",
  themeColor: "#22c55e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#22c55e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TravelTrack" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
