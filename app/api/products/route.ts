import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/catalog";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || undefined;
  const category = searchParams.get("category") || undefined;
  const occasion = searchParams.get("occasion") || undefined;

  return NextResponse.json({
    products: searchProducts(query, { category, occasion })
  });
}
