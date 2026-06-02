import type { Metadata, Viewport } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap"
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Monimala Store | Assamese Traditional Jewellery",
    template: "%s | Monimala Store"
  },
  description:
    "Premium Assamese traditional jewellery including Jonbiri, Gamkharu, Lokaparo, bridal sets, necklaces and earrings.",
  keywords: [
    "Assamese jewellery",
    "Jonbiri",
    "Gamkharu",
    "Lokaparo",
    "Assamese bridal jewellery",
    "traditional necklaces"
  ],
  openGraph: {
    title: "Monimala Store",
    description: "Assamese heritage jewellery with a modern luxury shopping experience.",
    images: ["/images/monimala-hero.png"],
    type: "website"
  },
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/"
  }
};

export const viewport: Viewport = {
  themeColor: "#A61D2D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    name: "Monimala Store",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    image: "/images/monimala-hero.png",
    description:
      "Premium Assamese traditional jewellery for bridal, festive and everyday occasions.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Guwahati",
      addressRegion: "Assam",
      addressCountry: "IN"
    },
    sameAs: ["https://instagram.com", "https://facebook.com"]
  };

  return (
    <html lang="en">
      <body className={`${playfair.variable} ${poppins.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Header />
        <main className="min-h-screen pb-20 md:pb-0">{children}</main>
        <Footer />
        <MobileBottomNav />
        <Toaster />
      </body>
    </html>
  );
}
