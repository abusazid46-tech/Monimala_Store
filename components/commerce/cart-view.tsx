"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Minus, Plus, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCommerceStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CartView({ products }: { products: Product[] }) {
  const cart = useCommerceStore((state) => state.cart);
  const updateQuantity = useCommerceStore((state) => state.updateQuantity);
  const removeFromCart = useCommerceStore((state) => state.removeFromCart);
  const clearCart = useCommerceStore((state) => state.clearCart);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
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

  async function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          phone: form.get("phone"),
          address: form.get("address"),
          items: lines.map(({ productId, quantity, color, size }) => ({ productId, quantity, color, size }))
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to place your order.");
      setTrackingCode(result.order.trackingCode);
      clearCart();
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : "Unable to place your order.");
    } finally {
      setBusy(false);
    }
  }

  if (trackingCode) {
    return <div className="container flex min-h-[60vh] items-center justify-center py-10"><section className="max-w-xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-luxury"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" /><h1 className="mt-5 font-heading text-4xl text-maroon">Thank you for your order</h1><p className="mt-4 leading-7 text-charcoal/70">Thank you for your order with Monimala. Our representative will contact you for confirmation of your order.</p><p className="mt-4 rounded-full bg-cream px-4 py-2 text-sm font-semibold text-maroon">Order reference: {trackingCode}</p><Button asChild className="mt-6"><Link href="/products">Continue shopping</Link></Button></section></div>;
  }

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
                <Image src={product.images[0]} alt={product.name} fill unoptimized className="object-cover" />
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
        <form className="mt-5 grid gap-3" onSubmit={placeOrder}>
          <h3 className="font-semibold text-maroon">Delivery details</h3>
          <Input name="email" type="email" placeholder="Email address" required />
          <Input name="phone" type="tel" placeholder="Phone number" minLength={8} required />
          <textarea name="address" placeholder="Complete delivery address" minLength={10} required className="min-h-24 rounded-2xl border border-primary/10 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold" />
          {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          <Button className="w-full" variant="gold" disabled={busy}>{busy ? "Placing order…" : "Place order"}</Button>
        </form>
      </aside>
    </div>
  );
}
