"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { products } from "@/lib/catalog";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/commerce/product-card";

export function SearchFilters() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [occasion, setOccasion] = useState("All");

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];
  const occasions = ["All", "Bridal", "Festive", "Heritage", "Daily"];

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = [product.name, product.category, product.description]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesCategory = category === "All" || product.category === category;
      const matchesOccasion = occasion === "All" || product.occasion === occasion;
      return matchesQuery && matchesCategory && matchesOccasion;
    });
  }, [category, occasion, query]);

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
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {occasions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setOccasion(item)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                occasion === item
                  ? "border-gold bg-gold text-charcoal"
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
