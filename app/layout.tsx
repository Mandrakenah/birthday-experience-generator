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

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const description =
  "Create personalized, cinematic birthday websites — photos, music, video, and an interactive candle-blowing finale.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Birthday Experience Generator",
  description,
  openGraph: {
    title: "Birthday Experience Generator",
    description,
    type: "website",
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Birthday Experience Generator",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
