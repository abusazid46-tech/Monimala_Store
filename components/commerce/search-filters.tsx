"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Product } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/commerce/product-card";

export function SearchFilters({ products, initialQuery = "", initialCategory = "" }: { products: Product[]; initialQuery?: string; initialCategory?: string }) {
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get("q") || initialQuery;
  const categoryFromUrl = searchParams.get("category") || initialCategory;
  const [query, setQuery] = useState(queryFromUrl);
  const matchingCategory = products.find((product) => product.category.toLowerCase().replaceAll(" ", "-") === categoryFromUrl)?.category;
  const [category, setCategory] = useState(matchingCategory || "All");
  const [sort, setSort] = useState("ranking");

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  useEffect(() => setQuery(queryFromUrl), [queryFromUrl]);
  useEffect(() => setCategory(matchingCategory || "All"), [matchingCategory]);

  const filtered = useMemo(() => {
    const matches = products.filter((product) => {
      const matchesQuery = [product.name, product.category, product.description]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesCategory = category === "All" || product.category === category;
      return matchesQuery && matchesCategory;
    });
    if (sort === "price-asc") return matches.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return matches.sort((a, b) => b.price - a.price);
    if (sort === "newest") return matches.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
    return matches.sort((a, b) => a.position - b.position);
  }, [category, products, query, sort]);

  return (
    <div className="space-y-5">
      <div className="sticky top-[72px] z-20 rounded-lg border border-primary/10 bg-cream/90 p-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/45" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Jonbiri, Gamkharu, bridal sets..."
              className="pl-9"
            />
          </div>
          <SlidersHorizontal className="h-5 w-5 text-maroon" />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort products"
            className="h-10 rounded-full border border-primary/15 bg-white px-3 text-xs font-semibold outline-none"
          >
            <option value="ranking">Recommended</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                category === item
                  ? "border-primary bg-primary text-white"
                  : "border-primary/15 bg-white text-charcoal"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
