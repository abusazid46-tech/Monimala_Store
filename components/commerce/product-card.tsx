"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useCommerceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function ProductCard({ product }: { product: Product }) {
  const addToCart = useCommerceStore((state) => state.addToCart);
  const toggleWishlist = useCommerceStore((state) => state.toggleWishlist);
  const wishlist = useCommerceStore((state) => state.wishlist);
  const wished = wishlist.includes(product.id);

  return (
    <article className="group overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-cream">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            unoptimized
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-maroon shadow-sm">
            {product.isNew ? "New" : product.occasion}
          </div>
        </div>
      </Link>
      <div className="space-y-3 p-3 sm:p-4">
        <div>
          <Link
            href={`/products/${product.slug}`}
            className="line-clamp-2 min-h-10 text-sm font-semibold text-charcoal hover:text-primary"
          >
            {product.name}
          </Link>
          <div className="mt-1 flex items-center gap-1 text-xs text-charcoal/60">
            <Star className="h-3.5 w-3.5 fill-gold text-gold-deep" />
            <span>{product.rating}</span>
            <span>({product.reviews})</span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="font-semibold text-maroon">{formatPrice(product.price)}</p>
            {product.compareAt ? (
              <p className="text-xs text-charcoal/45 line-through">
                {formatPrice(product.compareAt)}
              </p>
            ) : null}
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="outline"
              aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              onClick={() => toggleWishlist(product.id)}
            >
              <Heart
                className={wished ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"}
              />
            </Button>
            <Button
              size="icon"
              aria-label="Add to cart"
              onClick={() => {
                if (product.colors.length || product.sizes.length) {
                  window.location.href = `/products/${product.slug}`;
                  return;
                }
                addToCart(product.id);
                toast.success("Added to cart");
              }}
            >
              <ShoppingBag className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
