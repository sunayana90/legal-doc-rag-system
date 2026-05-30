import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Legal RAG AI — Intelligent Legal Research Assistant",
  description:
    "Ask questions about legal documents and retrieve accurate, AI-powered answers grounded in your uploaded contracts, agreements, and legal texts.",
  keywords: [
    "legal AI",
    "RAG",
    "legal research",
    "contract analysis",
    "document Q&A",
  ],
  authors: [{ name: "Legal RAG AI" }],
  openGraph: {
    title: "Legal RAG AI",
    description:
      "Intelligent Legal Research Assistant powered by Retrieval-Augmented Generation",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
