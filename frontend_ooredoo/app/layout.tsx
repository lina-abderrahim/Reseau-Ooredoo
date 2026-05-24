import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Ooredoo SIG Network Planner",
  description: "Système intelligent de planification de couverture réseau",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} scroll-smooth`}>
      <body className="antialiased bg-[#f1f5f9] text-slate-900 min-h-screen selection:bg-red-100 selection:text-red-600">
        {/* Texture de fond subtile */}
        <div className="fixed inset-0 z-[-1] opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        {children}
      </body>
    </html>
  );
}