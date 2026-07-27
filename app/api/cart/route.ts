import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const cartSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      color: z.string().optional(),
      size: z.string().optional()
    })
  )
});

export async function POST(request: NextRequest) {
  const parsed = cartSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart." }, { status: 400 });
  }

  const quantities = new Map(parsed.data.items.map((item) => [item.productId, item.quantity]));
  const products = await prisma.product.findMany({ where: { id: { in: [...quantities.keys()] }, active: true } });
  const lines = products.map((product) => ({ product: { ...product, images: JSON.parse(product.images) }, quantity: quantities.get(product.id)!, subtotal: product.price * quantities.get(product.id)! }));

  const subtotal = lines.reduce((sum, line) => sum + (line?.subtotal || 0), 0);

  return NextResponse.json({
    lines,
    subtotal,
    shipping: subtotal > 0 ? 0 : 0,
    total: subtotal
  });
}
