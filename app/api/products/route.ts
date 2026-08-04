import { NextRequest, NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/catalog-db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || undefined;
  const category = searchParams.get("category") || undefined;
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 100, 1), 100);

  const normalizedQuery = query?.trim().toLowerCase();
  const normalizedCategory = category?.trim().toLowerCase();
  const products = (await getCatalogProducts())
    .filter((product) => {
      const matchesQuery = !normalizedQuery || [product.name, product.description, product.category]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesCategory = !normalizedCategory || product.category.toLowerCase().replaceAll(" ", "-") === normalizedCategory;
      return matchesQuery && matchesCategory;
    })
    .slice(0, limit);

  return NextResponse.json({ products: products.map((product) => ({
    ...product,
    category: { name: product.category }
  })) }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" }
  });
}
