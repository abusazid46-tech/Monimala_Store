"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type SearchProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  images: string[];
  category: { name: string };
};

export function PremiumSearch({ mobile = false }: { mobile?: boolean }) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    const value = query.trim();
    if (!value) {
      setProducts([]);
      setLoading(false);
      return;
    }
    const timer = window.setTimeout(async () => {
      request.current?.abort();
      request.current = new AbortController();
      setLoading(true);
      try {
        const response = await fetch(`/api/products?q=${encodeURIComponent(value)}&limit=8`, {
          signal: request.current.signal
        });
        const data = await response.json();
        setProducts(response.ok ? data.products : []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full">
      <div className={`flex items-center rounded-full bg-charcoal/5 ${mobile ? "h-12 px-5" : "h-10 px-4"}`}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="What are you looking for?"
          aria-label="Search products"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-charcoal/50"
        />
        {query ? (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="p-1">
            <X className="h-5 w-5" />
          </button>
        ) : (
          <Search className="h-5 w-5 text-charcoal" />
        )}
      </div>
      {query.trim() ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-luxury">
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {loading ? <p className="p-4 text-sm text-charcoal/55">Searching available products…</p> : null}
            {!loading && !products.length ? <p className="p-4 text-sm text-charcoal/55">No available products found.</p> : null}
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                onClick={() => setQuery("")}
                className="grid grid-cols-[58px_1fr_auto] items-center gap-3 rounded-xl p-2 hover:bg-cream"
              >
                <span className="relative h-14 w-14 overflow-hidden rounded-lg bg-cream">
                  <Image src={product.images[0]} alt="" fill unoptimized sizes="58px" className="object-cover" />
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-sm">{product.name}</strong>
                  <small className="text-charcoal/50">{product.category.name}</small>
                </span>
                <span className="text-right">
                  <strong className="block text-sm text-maroon">{formatPrice(product.price)}</strong>
                  <small className={product.stock > 0 ? "text-emerald-700" : "text-red-600"}>
                    {product.stock > 0 ? "In stock" : "Sold out"}
                  </small>
                </span>
              </Link>
            ))}
          </div>
          {products.length ? (
            <Link
              href={`/products?q=${encodeURIComponent(query.trim())}`}
              onClick={() => setQuery("")}
              className="block border-t border-charcoal/10 bg-cream px-4 py-3 text-center text-sm font-semibold text-maroon"
            >
              View all matching products
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
