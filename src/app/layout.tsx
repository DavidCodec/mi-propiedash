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
  // Sin metadataBase, Next no puede convertir un canonical relativo
  // ("/buscar?ciudad=Caracas") en la URL absoluta que exige el estándar.
  // En un proyecto real esto viene de una variable de entorno.
  metadataBase: new URL("https://mi-propiedash.vercel.app"),
  title: "Mi Propiedash · práctica",
  description: "Mini marketplace inmobiliario, proyecto de práctica del onboarding.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
