import type { Metadata } from "next";
import { SearchFilters } from "@/components/commerce/search-filters";

export const metadata: Metadata = {
  title: "Shop Assamese Jewellery",
  description:
    "Search and filter Monimala Store products including Jonbiri, Gamkharu, Lokaparo, necklaces and bridal jewellery."
};

export default function ProductsPage() {
  return (
    <div className="container py-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-deep">
          Shop Collection
        </p>
        <h1 className="mt-2 font-heading text-4xl text-maroon md:text-5xl">
          Assamese Jewellery
        </h1>
        <p className="mt-3 max-w-2xl text-charcoal/65">
          Discover premium traditional jewellery with fast search, category filters,
          wishlist saves and WhatsApp support.
        </p>
      </div>
      <SearchFilters />
    </div>
  );
}
