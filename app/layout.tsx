import type { Metadata, Viewport } from "next";
import { Dancing_Script, Geist, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Message fonts for the recipient experience (font_family serif / script).
// Not preloaded: most pages never use them.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  preload: false,
});

const dancing = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  preload: false,
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const description =
  "Create personalized, cinematic birthday websites — photos, music, video, friends' wishes, and an interactive candle-blowing finale.";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Birthday Experience — cinematic birthday surprises",
    template: "%s · Birthday Experience",
  },
  description,
  applicationName: "Birthday Experience",
  openGraph: {
    title: "Birthday Experience — cinematic birthday surprises",
    description,
    type: "website",
    url: appUrl,
    siteName: "Birthday Experience",
  },
  twitter: {
    card: "summary_large_image",
    title: "Birthday Experience",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfair.variable} ${dancing.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
