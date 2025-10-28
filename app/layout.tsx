import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
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
  title: "Ghana Sign Language Dictionary | AI-Powered Sign Search",
  description: "Search and learn Ghana Sign Language with AI-powered semantic search. Access 1,582 signs from the official Ghana Sign Language Dictionary (3rd Edition). Free educational platform for inclusive learning.",
  keywords: [
    "Ghana Sign Language",
    "GSL Dictionary",
    "sign language learning",
    "deaf education Ghana",
    "AI sign language search",
    "inclusive education",
    "accessibility Ghana",
    "sign language platform",
    "FAISS vector search",
    "Ghana education technology"
  ],
  authors: [{ name: "SignForge Hackathon Team" }],
  creator: "SignForge Hackathon 2025",
  publisher: "SignForge",
  applicationName: "Ghana Sign Language Dictionary",
  generator: "Next.js 15",
  category: "Education",
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://frontend-theta-three-66.vercel.app",
    title: "Ghana Sign Language Dictionary | AI-Powered Sign Search",
    description: "Search and learn Ghana Sign Language with AI-powered semantic search. Access 1,582 signs from the official Ghana Sign Language Dictionary.",
    siteName: "Ghana Sign Language Dictionary",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ghana Sign Language Dictionary"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Ghana Sign Language Dictionary | AI-Powered Sign Search",
    description: "Search and learn Ghana Sign Language with AI-powered semantic search. 1,582 signs available.",
    images: ["/og-image.png"],
    creator: "@signforge"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  alternates: {
    canonical: "https://frontend-theta-three-66.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/icon-512.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <meta name="theme-color" content="#00549F" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
