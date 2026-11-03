import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SIAD-Saber Pro",
  description: "Sistema de apoyo académico SIAD-Saber Pro para la creación y gestión de evaluaciones.",
  icons: {
    icon: "/logo/siad-saber-pro.png",
    shortcut: "/logo/siad-saber-pro.png",
    apple: "/logo/siad-saber-pro.png",
  },
  openGraph: {
    title: "SIAD-Saber Pro",
    description: "Sistema de apoyo académico para la creación y gestión de evaluaciones.",
    locale: "es_CO",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <AuthGuard>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </AuthGuard>
      </body>
    </html>
  );
}
