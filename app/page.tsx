import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Facebook, Instagram, MessageCircle, ShieldCheck, Star, Youtube } from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";
import { getBestSellingProducts, getCatalogCategories } from "@/lib/catalog-db";
import { reviews } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, bestSellers] = await Promise.all([
    getCatalogCategories(),
    getBestSellingProducts(8)
  ]);

  return (
    <main className="container py-5 sm:py-8">
      <section aria-label="Customer trust rating" className="mb-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl border border-gold/30 bg-white px-4 py-3 text-center shadow-sm">
        <span className="flex items-center gap-1 text-gold-deep" aria-hidden="true">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-gold text-gold" />)}</span>
        <strong className="text-sm text-maroon">4.8 out of 5</strong>
        <span className="text-sm text-charcoal/65">Loved by Monimala customers</span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><ShieldCheck className="h-4 w-4" />Trusted shopping</span>
      </section>
      <section
        aria-label="Shop by category"
        className="mx-auto grid max-w-4xl grid-cols-3 overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm"
      >
        {categories.map((category, index) => (
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
                priority={index < 3}
                loading={index < 3 ? "eager" : "lazy"}
                unoptimized
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

      <section aria-labelledby="customer-reviews-title" className="pb-10 sm:pb-14">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">Real experiences</p>
          <h2 id="customer-reviews-title" className="mt-1 font-heading text-3xl text-maroon sm:text-4xl">Customer Reviews</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {reviews.map((review) => (
            <article key={review.name} className="rounded-2xl border border-primary/10 bg-white p-6 shadow-sm">
              <div className="flex text-gold-deep" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: review.rating }).map((_, index) => <Star key={index} className="h-4 w-4 fill-gold text-gold" />)}</div>
              <blockquote className="mt-4 text-sm leading-7 text-charcoal/70">“{review.body}”</blockquote>
              <p className="mt-5 font-semibold text-maroon">{review.name}</p>
              <p className="text-xs text-charcoal/50">{review.location} · Verified customer</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="social-title" className="rounded-3xl bg-maroon px-5 py-9 text-center text-white sm:px-10 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Stay connected</p>
        <h2 id="social-title" className="mt-2 font-heading text-3xl sm:text-4xl">Follow Monimala</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/75">New arrivals, styling inspiration, product videos and direct shopping support.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <SocialLink href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com"} label="Instagram" icon={Instagram} />
          <SocialLink href={process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://facebook.com"} label="Facebook" icon={Facebook} />
          <SocialLink href={process.env.NEXT_PUBLIC_YOUTUBE_URL || "https://youtube.com"} label="YouTube" icon={Youtube} />
          <SocialLink href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999"}`} label="WhatsApp" icon={MessageCircle} />
        </div>
      </section>
    </main>
  );
}

function SocialLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Instagram }) {
  return <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold transition hover:bg-white hover:text-maroon"><Icon className="h-4 w-4" />{label}</a>;
}
