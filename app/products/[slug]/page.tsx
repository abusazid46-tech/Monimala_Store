import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, RotateCcw, ShieldCheck, Star, Truck } from "lucide-react";
import { getProduct, products } from "@/lib/catalog";
import { absoluteUrl, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductGallery } from "@/components/commerce/gallery";
import { ProductActions } from "@/components/commerce/product-actions";
import { ProductCard } from "@/components/commerce/product-card";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

const deliveryNotes = [
  { icon: Truck, text: "Free tracked shipping across India" },
  { icon: ShieldCheck, text: "Razorpay secure payment gateway" },
  { icon: RotateCcw, text: "Easy return support on eligible orders" },
  { icon: CheckCircle2, text: "Quality checked before dispatch" }
];

export async function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.description,
    alternates: {
      canonical: `/products/${product.slug}`
    },
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.images[0]]
    }
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const related = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .concat(products.filter((item) => item.id !== product.id))
    .slice(0, 4);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((image) =>
      image.startsWith("http") ? image : absoluteUrl(image)
    ),
    description: product.description,
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: "Monimala Store"
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviews
    }
  };

  return (
    <div className="container py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <ProductGallery images={product.images} name={product.name} />
        <div className="lg:sticky lg:top-28 lg:h-fit">
          <Badge>{product.category}</Badge>
          <h1 className="mt-4 font-heading text-4xl leading-tight text-maroon md:text-5xl">
            {product.name}
          </h1>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-gold-deep">
              <Star className="h-4 w-4 fill-gold text-gold-deep" />
              {product.rating}
            </span>
            <span className="text-charcoal/45">|</span>
            <span className="text-charcoal/60">{product.reviews} reviews</span>
            <span className="text-charcoal/45">|</span>
            <span className="text-emerald-700">{product.stock} in stock</span>
          </div>
          <div className="mt-5 flex items-end gap-3">
            <p className="text-3xl font-bold text-maroon">{formatPrice(product.price)}</p>
            {product.compareAt ? (
              <p className="pb-1 text-lg text-charcoal/40 line-through">
                {formatPrice(product.compareAt)}
              </p>
            ) : null}
          </div>
          <p className="mt-5 leading-7 text-charcoal/68">{product.description}</p>
          <div className="mt-6">
            <ProductActions product={product} />
          </div>

          <div className="mt-6 grid gap-3 rounded-lg border border-primary/10 bg-white p-4 text-sm">
            {deliveryNotes.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-gold-deep" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          ["Details", `${product.metal} finish, ${product.occasion.toLowerCase()} styling, premium gift packaging.`],
          ["Care", "Keep away from perfume and water. Store in the Monimala pouch after use."],
          ["Delivery", "Dispatch in 24-72 hours with tracking. WhatsApp updates available."]
        ].map(([title, text]) => (
          <article key={title} className="rounded-lg border border-primary/10 bg-white p-5">
            <h2 className="font-heading text-2xl text-maroon">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-charcoal/65">{text}</p>
          </article>
        ))}
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-heading text-3xl text-maroon">Reviews</h2>
          <Button variant="outline">Write a review</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            "Beautiful finish and very premium packaging.",
            "The WhatsApp team helped me match it with my mekhela sador."
          ].map((body, index) => (
            <article key={body} className="rounded-lg border border-primary/10 bg-white p-5">
              <p className="text-gold-deep">★★★★★</p>
              <p className="mt-2 text-sm text-charcoal/65">{body}</p>
              <p className="mt-3 font-semibold text-maroon">
                Verified Buyer {index + 1}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-heading text-3xl text-maroon">Related Products</h2>
          <Button asChild variant="ghost">
            <Link href="/products">View all</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
