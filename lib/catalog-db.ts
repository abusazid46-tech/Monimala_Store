import { prisma } from "@/lib/db";
import type { Category, Product } from "@/lib/types";

function images(value: string): string[] {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) && parsed.length ? parsed : ["/images/monimala-hero.png"]; }
  catch { return ["/images/monimala-hero.png"]; }
}

function stringList(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function imageMap(value: string | null): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function productView(product: Awaited<ReturnType<typeof prisma.product.findFirstOrThrow>> & { category: { name: string } }): Product {
  return {
    id: product.id, name: product.name, slug: product.slug, category: product.category.name,
    description: product.description, price: product.price, compareAt: product.compareAt ?? undefined,
    rating: 0, reviews: 0, stock: product.stock, isFeatured: product.isFeatured, isNew: product.isNew,
    occasion: (product.occasion || "Heritage") as Product["occasion"],
    metal: (product.metal || "Gold Finish") as Product["metal"], images: images(product.images),
    colors: stringList(product.colors), sizes: stringList(product.sizes),
    colorImages: imageMap(product.colorImages), position: product.position
  };
}

export async function getCatalogProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ where: { active: true }, include: { category: true }, orderBy: [{ position: "asc" }, { createdAt: "desc" }] });
  return rows.map(productView);
}

export async function getCatalogProduct(slug: string): Promise<Product | null> {
  const row = await prisma.product.findFirst({ where: { slug, active: true }, include: { category: true } });
  return row ? productView(row) : null;
}

export async function getCatalogCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    where: { active: true, parentId: null },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }]
  });
  return rows
    .map((row) => ({
      name: row.name,
      slug: row.slug,
      description: row.description || "",
      image: row.image || "/images/category-placeholder.svg",
      position: row.position
    }));
}

export async function getBestSellingProducts(limit = 8): Promise<Product[]> {
  const take = Math.min(Math.max(limit, 1), 12);
  const sales = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        paymentStatus: "PAID",
        status: { not: "CANCELLED" }
      },
      product: { active: true }
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take
  });

  const rankedIds = sales.map((sale) => sale.productId);
  const rankedRows = rankedIds.length
    ? await prisma.product.findMany({
        where: { id: { in: rankedIds }, active: true },
        include: { category: true }
      })
    : [];
  const rankedById = new Map(rankedRows.map((product) => [product.id, product]));
  const ranked = rankedIds
    .map((id) => rankedById.get(id))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));

  const fallback = await prisma.product.findMany({
    where: {
      active: true,
      ...(rankedIds.length ? { id: { notIn: rankedIds } } : {})
    },
    include: { category: true },
    orderBy: [
      { isFeatured: "desc" },
      { isNew: "desc" },
      { position: "asc" },
      { createdAt: "desc" }
    ],
    take: take - ranked.length
  });

  return [...ranked, ...fallback].map(productView);
}
