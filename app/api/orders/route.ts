import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { products } from "@/lib/catalog";
import { getSession } from "@/lib/auth";
import { makeTrackingCode } from "@/lib/utils";

const createOrderSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(8),
  address: z.string().min(10),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive()
    })
  )
});

export async function POST(request: NextRequest) {
  const parsed = createOrderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order." }, { status: 400 });
  }

  const session = await getSession();
  const lines = parsed.data.items
    .map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) return null;
      return {
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      };
    })
    .filter(Boolean) as { productId: string; quantity: number; price: number }[];

  if (!lines.length) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  const order = await prisma.order.create({
    data: {
      trackingCode: makeTrackingCode(),
      userId: session?.id,
      email: parsed.data.email,
      phone: parsed.data.phone,
      address: parsed.data.address,
      total,
      items: {
        create: lines
      }
    },
    include: { items: true }
  });

  return NextResponse.json({ order });
}

export async function GET(request: NextRequest) {
  const trackingCode = request.nextUrl.searchParams.get("trackingCode");
  if (!trackingCode) {
    return NextResponse.json({ error: "trackingCode is required." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { trackingCode },
    include: { items: true }
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ order });
}
