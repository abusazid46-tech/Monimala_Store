"use client";

import Link from "next/link";
import { Grid2X2, Home, MessageCircle, ShoppingBag } from "lucide-react";
import { useCommerceStore } from "@/lib/store";

export function MobileBottomNav() {
  const cartCount = useCommerceStore((state) =>
    state.cart.reduce((sum, line) => sum + line.quantity, 0)
  );
  const whatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-primary/10 bg-white/95 pb-safe text-xs font-semibold text-charcoal shadow-[0_-12px_30px_rgba(0,0,0,0.06)] backdrop-blur md:hidden">
      <Link href="/" className="flex h-16 flex-col items-center justify-center gap-1">
        <Home className="h-5 w-5" />
        Home
      </Link>
      <Link href="/cart" className="relative flex h-16 flex-col items-center justify-center gap-1">
        <ShoppingBag className="h-5 w-5" />
        Cart
        {cartCount ? (
          <span className="absolute right-7 top-2 rounded-full bg-primary px-1.5 text-[10px] text-white">
            {cartCount}
          </span>
        ) : null}
      </Link>
      <Link href="/products" className="flex h-16 flex-col items-center justify-center gap-1">
        <Grid2X2 className="h-5 w-5" />
        All Products
      </Link>
      <a
        href={`https://wa.me/${whatsAppNumber}`}
        className="flex h-16 flex-col items-center justify-center gap-1 text-emerald-600"
      >
        <MessageCircle className="h-5 w-5" />
        WhatsApp Us
      </a>
    </nav>
  );
}
