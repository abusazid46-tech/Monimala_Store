import Link from "next/link";
import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { categories } from "@/lib/catalog";

export function Footer() {
  const whatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999";

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
            <Link href="#" aria-label="Instagram" className="rounded-full bg-white/10 p-2">
              <Instagram className="h-4 w-4" />
            </Link>
            <Link href="#" aria-label="Facebook" className="rounded-full bg-white/10 p-2">
              <Facebook className="h-4 w-4" />
            </Link>
            <a
              href={`https://wa.me/${whatsAppNumber}`}
              aria-label="WhatsApp"
              className="rounded-full bg-white/10 p-2"
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
            <span className="flex gap-2">
              <Phone className="h-4 w-4 text-gold" />
              +91 99999 99999
            </span>
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
