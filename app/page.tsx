import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gem, MessageCircle, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { categories, products, reviews } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/commerce/product-card";

const trustSignals = [
  { icon: Truck, title: "Pan India Shipping", copy: "Tracked delivery" },
  { icon: ShieldCheck, title: "Secure Payments", copy: "Razorpay ready" },
  { icon: Gem, title: "Premium Finish", copy: "Gold accents" },
  { icon: Sparkles, title: "Stylist Support", copy: "WhatsApp help" }
];

export default function HomePage() {
  const bestSellers = products.filter((product) => product.isFeatured);
  const newArrivals = products.filter((product) => product.isNew);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 assam-motif opacity-40" />
        <div className="container relative grid min-h-[640px] items-center gap-8 py-8 md:grid-cols-[0.9fr_1.1fr] md:py-14">
          <div className="z-10 max-w-xl">
            <Badge>Assamese Heritage Jewellery</Badge>
            <h1 className="mt-5 font-heading text-5xl font-semibold leading-[1.02] text-maroon sm:text-6xl lg:text-7xl">
              Monimala Store
            </h1>
            <p className="mt-4 text-base leading-7 text-charcoal/70 sm:text-lg">
              Luxury Jonbiri, Gamkharu, Lokaparo and bridal jewellery inspired by Assamese
              craft, curated for women who carry tradition beautifully.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/products">
                  Shop Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <a href="https://wa.me/919999999999">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Stylist
                </a>
              </Button>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              {[
                ["4.8", "Rated"],
                ["Pan India", "Delivery"],
                ["Easy", "Returns"]
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-primary/10 bg-white/75 p-3">
                  <p className="font-heading text-2xl text-maroon">{value}</p>
                  <p className="text-xs text-charcoal/55">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative min-h-[380px] overflow-hidden rounded-lg shadow-luxury md:min-h-[560px]">
            <Image
              src="/images/monimala-hero.png"
              alt="Assamese traditional jewellery by Monimala Store"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 58vw"
              className="object-cover"
            />
            <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-white/88 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase text-gold-deep">Featured Set</p>
              <div className="mt-1 flex items-end justify-between gap-3">
                <div>
                  <h2 className="font-heading text-2xl text-maroon">Royal Jonbiri Bridal</h2>
                  <p className="text-sm text-charcoal/60">Hand-finished gold tone</p>
                </div>
                <p className="font-semibold text-maroon">{formatPrice(5499)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {trustSignals.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-lg border border-primary/10 bg-white p-4">
              <Icon className="h-5 w-5 text-gold-deep" />
              <p className="mt-2 font-semibold">{title}</p>
              <p className="text-xs text-charcoal/55">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <SectionHeader title="Shop By Categories" href="/products" />
      <section className="container">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="group overflow-hidden rounded-lg border border-primary/10 bg-white shadow-sm"
            >
              <div className="relative aspect-square overflow-hidden bg-cream">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 16vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
              <div className="min-h-20 p-3">
                <h3 className="font-semibold leading-tight text-charcoal">{category.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-charcoal/55">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <SectionHeader title="Best Sellers" href="/products" />
      <section className="container grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {bestSellers.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>

      <section className="mt-10 bg-primary py-10 text-cream">
        <div className="container grid gap-8 md:grid-cols-[1fr_1fr] md:items-center">
          <div>
            <Badge className="border-gold/60 bg-white/10 text-gold">Heritage Collection</Badge>
            <h2 className="mt-4 font-heading text-4xl text-white md:text-5xl">
              Assamese motifs, refined for today.
            </h2>
            <p className="mt-4 max-w-xl text-cream/78">
              Explore statement necklaces, ceremonial bangles and Lokaparo earrings shaped by
              cultural memory, premium finishes and everyday comfort.
            </p>
            <Button asChild variant="gold" className="mt-6">
              <Link href="/products?occasion=Heritage">Explore Heritage</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {products.slice(0, 4).map((product) => (
              <div key={product.id} className="relative aspect-square overflow-hidden rounded-lg">
                <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionHeader title="New Arrivals" href="/products" />
      <section className="container grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {newArrivals.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>

      <section className="container py-12">
        <div className="rounded-lg border border-gold/30 bg-white p-5 shadow-luxury md:p-8">
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Badge>Festive Collection</Badge>
              <h2 className="mt-4 font-heading text-4xl text-maroon">
                Bihu, weddings and celebrations.
              </h2>
              <p className="mt-3 text-charcoal/65">
                Conversion-focused festive edits with fast discovery, wishlist saves, WhatsApp
                inquiry and a clear checkout path.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {products.slice(2, 5).map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="rounded-lg bg-cream p-3"
                >
                  <div className="relative aspect-square overflow-hidden rounded-md">
                    <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                  </div>
                  <p className="mt-2 text-sm font-semibold">{product.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8">
        <SectionHeadingOnly title="Customer Reviews" />
        <div className="grid gap-3 md:grid-cols-3">
          {reviews.map((review) => (
            <article key={review.name} className="rounded-lg border border-primary/10 bg-white p-5">
              <p className="text-gold-deep">★★★★★</p>
              <p className="mt-3 text-sm leading-6 text-charcoal/70">“{review.body}”</p>
              <p className="mt-4 font-semibold text-maroon">{review.name}</p>
              <p className="text-xs text-charcoal/50">{review.location}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container py-8">
        <SectionHeadingOnly title="Instagram Gallery" />
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {products.concat(products).slice(0, 6).map((product, index) => (
            <div key={`${product.id}-${index}`} className="relative aspect-square overflow-hidden rounded-lg">
              <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
            </div>
          ))}
        </div>
      </section>

      <section className="container py-12">
        <div className="rounded-lg bg-charcoal p-6 text-cream md:flex md:items-center md:justify-between md:p-8">
          <div>
            <h2 className="font-heading text-3xl text-gold">Join the Monimala Circle</h2>
            <p className="mt-2 text-sm text-cream/65">
              New drops, festive styling notes and early bridal collection access.
            </p>
          </div>
          <form className="mt-5 flex max-w-md gap-2 md:mt-0">
            <input
              type="email"
              placeholder="Email address"
              className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/10 px-4 text-sm outline-none ring-gold placeholder:text-cream/45 focus:ring-2"
            />
            <Button type="submit" variant="gold">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="container mt-10 mb-4 flex items-end justify-between gap-4">
      <h2 className="font-heading text-3xl text-maroon sm:text-4xl">{title}</h2>
      <Button asChild variant="ghost" className="hidden sm:inline-flex">
        <Link href={href}>
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function SectionHeadingOnly({ title }: { title: string }) {
  return <h2 className="mb-4 font-heading text-3xl text-maroon sm:text-4xl">{title}</h2>;
}
