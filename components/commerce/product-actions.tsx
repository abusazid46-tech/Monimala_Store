"use client";

import { Heart, MessageCircle, ShoppingBag, Zap } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import { useCommerceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function ProductActions({ product }: { product: Product }) {
  const addToCart = useCommerceStore((state) => state.addToCart);
  const toggleWishlist = useCommerceStore((state) => state.toggleWishlist);
  const wished = useCommerceStore((state) => state.wishlist.includes(product.id));
  const whatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999";
  const inquiry = encodeURIComponent(
    `Hi Monimala Store, I want to know more about ${product.name}.`
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Button
        onClick={() => {
          addToCart(product.id);
          toast.success("Added to cart");
        }}
      >
        <ShoppingBag className="h-4 w-4" />
        Add to cart
      </Button>
      <Button variant="gold">
        <Zap className="h-4 w-4" />
        Buy now
      </Button>
      <Button
        variant="outline"
        onClick={() => toggleWishlist(product.id)}
        className="sm:col-span-1"
      >
        <Heart className={wished ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />
        {wished ? "Wishlisted" : "Wishlist"}
      </Button>
      <Button variant="outline" asChild>
        <a
          href={`https://wa.me/${whatsAppNumber}?text=${inquiry}`}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp inquiry
        </a>
      </Button>
    </div>
  );
}
