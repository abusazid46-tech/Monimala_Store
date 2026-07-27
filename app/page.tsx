import Image from "next/image";
import Link from "next/link";
import { getCatalogCategories } from "@/lib/catalog-db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categories = await getCatalogCategories();

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
    </main>
  );
}
