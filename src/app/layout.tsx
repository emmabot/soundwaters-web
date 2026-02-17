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
  title: "SoundWaters — Explore Water Quality in Long Island Sound",
  description:
    "Explore water quality monitoring data from Long Island Sound. Built for students by SoundWaters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-ocean-50`}
      >
        <header className="bg-gradient-to-r from-ocean-700 via-ocean-600 to-teal-600 text-white shadow-lg">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <span className="text-3xl" role="img" aria-label="wave">
                🌊
              </span>
              <div>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  SoundWaters
                </h1>
                <p className="text-sm text-ocean-200">
                  Explore Water Quality in Long Island Sound
                </p>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
