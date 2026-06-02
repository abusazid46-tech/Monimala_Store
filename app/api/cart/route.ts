import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { products } from "@/lib/catalog";

const cartSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive()
    })
  )
});

export async function POST(request: NextRequest) {
  const parsed = cartSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart." }, { status: 400 });
  }

  const lines = parsed.data.items
    .map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) return null;
      return {
        product,
        quantity: item.quantity,
        subtotal: product.price * item.quantity
      };
    })
    .filter(Boolean);

  const subtotal = lines.reduce((sum, line) => sum + (line?.subtotal || 0), 0);

  return NextResponse.json({
    lines,
    subtotal,
    shipping: subtotal > 0 ? 0 : 0,
    total: subtotal
  });
}
