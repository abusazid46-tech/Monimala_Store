"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCommerceStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function CartView({ products }: { products: Product[] }) {
  const cart = useCommerceStore((state) => state.cart);
  const updateQuantity = useCommerceStore((state) => state.updateQuantity);
  const removeFromCart = useCommerceStore((state) => state.removeFromCart);
  const lines = cart
    .map((line) => ({
      ...line,
      product: products.find((product) => product.id === line.productId)
    }))
    .filter((line) => line.product);
  const total = lines.reduce(
    (sum, line) => sum + (line.product?.price || 0) * line.quantity,
    0
  );

  if (!lines.length) {
    return (
      <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="font-heading text-4xl text-maroon">Your cart is waiting</h1>
        <p className="mt-3 max-w-md text-charcoal/65">
          Add a Jonbiri, Gamkharu or bridal set and your checkout summary will appear here.
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">Shop jewellery</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container grid gap-6 py-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <h1 className="font-heading text-4xl text-maroon">Shopping Cart</h1>
        {lines.map(({ product, quantity, color, size }) =>
          product ? (
            <div
              key={`${product.id}-${color || ""}-${size || ""}`}
              className="grid grid-cols-[88px_1fr] gap-4 rounded-lg border border-primary/10 bg-white p-3 shadow-sm"
            >
              <div className="relative aspect-square overflow-hidden rounded-md bg-cream">
                <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <Link href={`/products/${product.slug}`} className="font-semibold">
                      {product.name}
                    </Link>
                    <p className="text-sm text-charcoal/60">{formatPrice(product.price)}</p>
                    {color || size ? <p className="mt-1 text-xs font-medium text-charcoal/55">{[color && `Colour: ${color}`, size && `Size: ${size}`].filter(Boolean).join(" · ")}</p> : null}
                  </div>
                  <button
                    type="button"
                    aria-label="Remove item"
                    onClick={() => removeFromCart(product.id, color, size)}
                    className="h-9 w-9 rounded-full text-charcoal/50 hover:bg-primary/10 hover:text-primary"
                  >
                    <Trash2 className="mx-auto h-4 w-4" />
                  </button>
                </div>
                <div className="flex w-fit items-center gap-2 rounded-full border border-primary/10 bg-cream p-1">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => updateQuantity(product.id, quantity - 1, color, size)}
                    className="rounded-full p-2 hover:bg-white"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-6 text-center text-sm font-semibold">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => updateQuantity(product.id, quantity + 1, color, size)}
                    className="rounded-full p-2 hover:bg-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : null
        )}
      </div>
      <aside className="h-fit rounded-lg border border-primary/10 bg-white p-5 shadow-luxury">
        <h2 className="font-heading text-2xl text-maroon">Order Summary</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div className="border-t border-primary/10 pt-3 flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
        <Button className="mt-5 w-full" variant="gold">
          Continue to secure checkout
        </Button>
      </aside>
    </div>
  );
}
