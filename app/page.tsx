import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";
import { getBestSellingProducts, getCatalogCategories } from "@/lib/catalog-db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, bestSellers] = await Promise.all([
    getCatalogCategories(),
    getBestSellingProducts(8)
  ]);

  return (
    <main className="container py-5 sm:py-8">
      <section
        aria-label="Shop by category"
        className="mx-auto grid max-w-4xl grid-cols-3 overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm"
      >
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/products?category=${encodeURIComponent(category.slug)}`}
            className="group flex min-h-44 flex-col items-center justify-start border-b border-r border-charcoal/10 px-2 py-5 text-center transition-colors hover:bg-cream/70 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon sm:min-h-56 sm:px-5 sm:py-7"
          >
            <span className="relative block h-24 w-full sm:h-36">
              <Image
                src={category.image}
                alt=""
                fill
                priority={categories.indexOf(category) < 3}
                sizes="(max-width: 640px) 33vw, 260px"
                className="object-contain p-1 transition-transform duration-300 group-hover:scale-105"
              />
            </span>
            <span className="mt-3 text-sm font-medium leading-snug text-charcoal sm:text-lg">
              {category.name}
            </span>
          </Link>
        ))}
      </section>

      <section aria-labelledby="best-sellers-title" className="py-10 sm:py-14">
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
              Most loved
            </p>
            <h2
              id="best-sellers-title"
              className="mt-1 font-heading text-3xl text-maroon sm:text-4xl"
            >
              Best Sellers
            </h2>
          </div>
          <Link
            href="/products?sort=recommended"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon hover:text-primary"
          >
            View all
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
