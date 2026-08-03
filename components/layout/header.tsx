"use client";

import Link from "next/link";
import {
  Menu,
  ShoppingBag,
  UserRound
} from "lucide-react";
import { categories } from "@/lib/catalog";
import { useCommerceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PremiumSearch } from "@/components/commerce/premium-search";

export function Header() {
  const cartCount = useCommerceStore((state) =>
    state.cart.reduce((sum, line) => sum + line.quantity, 0)
  );
  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-cream/92 backdrop-blur-xl">
      <div className="container flex h-16 items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" aria-label="Open menu" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Monimala Store</SheetTitle>
            <nav className="mt-8 grid gap-3">
              <Link href="/products" className="rounded-lg bg-white p-4 font-semibold">
                All Products
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/products?category=${category.slug}`}
                  className="rounded-lg border border-primary/10 bg-white/70 p-4"
                >
                  {category.name}
                </Link>
              ))}
              <Link href="/orders/track" className="rounded-lg bg-white p-4 font-semibold">
                Track Order
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="min-w-fit">
          <span className="block font-heading text-2xl font-bold leading-none text-maroon">
            Monimala
          </span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-deep">
            Store
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-charcoal/75 lg:flex">
          <Link href="/products">Shop</Link>
          <Link href="/products?category=assamese-jewellery">Assamese Jewellery</Link>
          <Link href="/products?category=earrings">Earrings</Link>
        </nav>

        <div className="relative ml-auto hidden max-w-md flex-1 md:block">
          <PremiumSearch />
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button asChild size="icon" variant="ghost" aria-label="Account">
            <Link href="/account">
              <UserRound className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="icon" variant="ghost" aria-label="Cart">
            <Link href="/cart" className="relative">
              <ShoppingBag className="h-5 w-5" />
              {cartCount ? <Counter count={cartCount} /> : null}
            </Link>
          </Button>
        </div>
      </div>
      <div className="container pb-3 md:hidden">
        <PremiumSearch mobile />
      </div>
    </header>
  );
}

function Counter({ count }: { count: number }) {
  return (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
      {count}
    </span>
  );
}
