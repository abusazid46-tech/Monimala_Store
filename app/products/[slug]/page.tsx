import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogProduct, getCatalogProducts } from "@/lib/catalog-db";
import { absoluteUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/commerce/product-card";
import { ProductPurchase } from "@/components/commerce/product-purchase";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateStaticParams() {
  return (await getCatalogProducts()).map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProduct(slug);
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
  const product = await getCatalogProduct(slug);
  if (!product) notFound();

  const products = await getCatalogProducts();
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
    <div className="container pb-40 pt-6 lg:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ProductPurchase product={product} />

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
