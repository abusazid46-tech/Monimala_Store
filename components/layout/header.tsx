"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Grid2X2,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X
} from "lucide-react";
import { categories, products } from "@/lib/catalog";
import { useCommerceStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const [query, setQuery] = useState("");
  const cartCount = useCommerceStore((state) =>
    state.cart.reduce((sum, line) => sum + line.quantity, 0)
  );
  const wishlistCount = useCommerceStore((state) => state.wishlist.length);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    return products
      .filter((product) =>
        [product.name, product.category].join(" ").toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 4);
  }, [query]);

  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-cream/92 backdrop-blur-xl">
      <div className="bg-primary px-4 py-2 text-center text-xs font-semibold text-cream sm:text-sm">
        Pan India delivery | 4.8 star rated | Easy WhatsApp support | Festive drops live
      </div>
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
          <Link href="/products?category=bridal">Bridal</Link>
          <Link href="/products?category=jonbiri">Jonbiri</Link>
          <Link href="/admin">Admin</Link>
        </nav>

        <div className="relative ml-auto hidden max-w-md flex-1 md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/45" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Assamese jewellery"
            className="pl-9 pr-10"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-charcoal/45 hover:bg-primary/10"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          {results.length ? (
            <div className="absolute left-0 right-0 top-12 rounded-lg border border-primary/10 bg-white p-2 shadow-luxury">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  onClick={() => setQuery("")}
                  className="block rounded-md px-3 py-2 text-sm hover:bg-cream"
                >
                  {product.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button asChild size="icon" variant="ghost" aria-label="Categories">
            <Link href="/products">
              <Grid2X2 className="h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="icon" variant="ghost" aria-label="Wishlist">
            <Link href="/account" className="relative">
              <Heart className="h-5 w-5" />
              {wishlistCount ? <Counter count={wishlistCount} /> : null}
            </Link>
          </Button>
          <Button asChild size="icon" variant="ghost" aria-label="Cart">
            <Link href="/cart" className="relative">
              <ShoppingBag className="h-5 w-5" />
              {cartCount ? <Counter count={cartCount} /> : null}
            </Link>
          </Button>
          <Button asChild size="icon" variant="ghost" aria-label="Account">
            <Link href="/account">
              <UserRound className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
      <div className="container pb-3 md:hidden">
        <Link
          href="/products"
          className="flex h-12 items-center gap-3 rounded-full bg-white px-4 text-charcoal/55 shadow-sm"
        >
          <Search className="h-5 w-5" />
          <span>What are you looking for?</span>
        </Link>
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
