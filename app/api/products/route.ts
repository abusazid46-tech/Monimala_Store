import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || undefined;
  const category = searchParams.get("category") || undefined;
  const occasion = searchParams.get("occasion") || undefined;
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 100, 1), 100);

  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(query ? { OR: [{ name: { contains: query } }, { description: { contains: query } }, { sku: { contains: query } }] } : {}),
      ...(category ? { category: { slug: category } } : {}),
      ...(occasion ? { occasion } : {})
    },
    include: { category: true },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    take: limit
  });

  return NextResponse.json({ products: products.map((product) => ({ ...product, images: JSON.parse(product.images) })) });
}
