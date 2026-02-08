import type { Metadata } from "next";
import { Inter, Exo_2 } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-body',
});

const exo2 = Exo_2({ 
  subsets: ["latin"],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800', '900']
});

export const metadata: Metadata = {
  title: "Cricket Clash Cards - Collect, Battle, Dominate",
  description: "Digital cricket card battle platform. Collect legendary players, battle friends, and settle cricket debates.",
  keywords: "cricket, cards, battle, cricket attax, fantasy cricket, cricket game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${exo2.variable} antialiased`}>
        <div className="min-h-screen bg-gradient-to-br from-cricket-stadium via-gray-950 to-black">
          <Navbar />
          <main className="relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
