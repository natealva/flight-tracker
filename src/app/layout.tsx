import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flight Tracker — Live Departures & Arrivals",
  description: "Search airports and view upcoming departures and arrivals in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="font-sans antialiased bg-white text-slate-900">
        <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
          <nav className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-center gap-6">
            <a href="/" className="text-slate-700 hover:text-slate-900 font-medium">
              Flight Tracker
            </a>
            <a href="/pickup" className="text-cyan-600 font-medium">
              Plan a Pickup
            </a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
