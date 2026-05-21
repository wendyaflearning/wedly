import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, Josefin_Sans, Manrope } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant-var",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope-var",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans-var",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const josefin = Josefin_Sans({
  variable: "--font-josefin-var",
  subsets: ["latin"],
  weight: ["400"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: "Wedly",
  description: "La plateforme d'organisation de mariage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${cormorant.variable} ${manrope.variable} ${josefin.variable} ${dmSans.variable} bg-creme`}
    >
      <body className="font-manrope text-texte min-h-full">{children}</body>
    </html>
  );
}
