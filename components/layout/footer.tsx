import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Youtube } from "lucide-react";
import { categories } from "@/lib/catalog";

export function Footer() {
  const whatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919282713731";
  const instagramUrl =
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ||
    "https://www.instagram.com/monimalastore?stkn=MW8xa2l4OHp4bWN2dA==";
  const facebookUrl =
    process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com/share/1Dk9XwxTnw/";
  const youtubeUrl =
    process.env.NEXT_PUBLIC_YOUTUBE_URL || "https://www.youtube.com/@Monimala-AssameseJewellery";

  return (
    <footer className="mt-12 bg-charcoal text-cream">
      <div className="container grid gap-8 py-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <h2 className="font-heading text-3xl text-gold">Monimala Store</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-cream/70">
            Assamese traditional jewellery crafted for weddings, festivals and everyday pride,
            delivered to the Assamese community worldwide.
          </p>
          <div className="mt-5 flex gap-3">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
            >
              <Youtube className="h-4 w-4" />
            </a>
            <a
              href={`https://wa.me/${whatsAppNumber}`}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gold">Collections</h3>
          <div className="mt-4 grid gap-2 text-sm text-cream/70">
            {categories.slice(0, 5).map((category) => (
              <Link key={category.slug} href={`/products?category=${category.slug}`}>
                {category.name}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gold">Customer Care</h3>
          <div className="mt-4 grid gap-2 text-sm text-cream/70">
            <Link href="/orders/track">Track Order</Link>
            <Link href="/account">Account</Link>
            <Link href="/cart">Cart</Link>
            <Link href="/products">Shop All</Link>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gold">Contact</h3>
          <div className="mt-4 grid gap-3 text-sm text-cream/70">
            <span className="flex gap-2">
              <MapPin className="h-4 w-4 text-gold" />
              Guwahati, Assam
            </span>
            <a href="tel:+919282713731" className="flex gap-2 transition hover:text-cream">
              <Phone className="h-4 w-4 text-gold" />
              +91 92827 13731
            </a>
            <a
              href={`https://wa.me/${whatsAppNumber}`}
              target="_blank"
              rel="noreferrer"
              className="flex gap-2 transition hover:text-cream"
            >
              <MessageCircle className="h-4 w-4 text-gold" />
              WhatsApp: +91 92827 13731
            </a>
            <span className="flex gap-2">
              <Mail className="h-4 w-4 text-gold" />
              care@monimalastore.com
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-cream/50">
        © 2026 Monimala Store. Assamese heritage, modern luxury.
      </div>
    </footer>
  );
}
