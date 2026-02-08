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
        <div className="min-h-screen bg-gradient-to-br from-cricket-stadium via-gray-950 to-black flex flex-col">
          <Navbar />
          <main className="relative flex-1">
            {children}
          </main>
          
          {/* Footer */}
          <footer className="relative mt-auto border-t border-white/10 bg-black/40 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">🏏</span>
                  </div>
                  <div>
                    <p className="text-sm font-display font-bold text-white">Cricket Clash Cards</p>
                    <p className="text-xs text-gray-400 font-body">Turn-Based Cricket Card Battle</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400 font-body">Made with</span>
                  <span className="text-red-400">❤️</span>
                  <span className="text-sm text-gray-400 font-body">by</span>
                  <span className="text-sm font-display font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Anmol Goyal
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 font-body">
                  © 2024 All rights reserved
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}