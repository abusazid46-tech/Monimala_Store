import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { makeTrackingCode } from "@/lib/utils";

const createOrderSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(8),
  address: z.string().min(10),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      color: z.string().max(80).optional(),
      size: z.string().max(40).optional()
    })
  )
});

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order." }, { status: 400 });
  }

  const session = await getSession();
  if (!parsed.data.items.length) return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  const productIds = [...new Set(parsed.data.items.map((item) => item.productId))];
  try {
    const order = await prisma.$transaction(async (tx) => {
    const catalog = await tx.product.findMany({ where: { id: { in: productIds }, active: true } });
    if (catalog.length !== productIds.length) throw new Error("One or more products are unavailable.");
    const catalogById = new Map(catalog.map((product) => [product.id, product]));
    const lines = parsed.data.items.map((item) => ({ ...item, price: catalogById.get(item.productId)!.price }));
    for (const line of lines) {
      const updated = await tx.product.updateMany({ where: { id: line.productId, stock: { gte: line.quantity } }, data: { stock: { decrement: line.quantity } } });
      if (updated.count !== 1) throw new Error("Insufficient stock for one or more products.");
      await tx.inventoryMovement.create({ data: { productId: line.productId, actorId: session?.id, quantity: -line.quantity, reason: "ORDER_RESERVED" } });
    }
    return tx.order.create({
      data: { trackingCode: makeTrackingCode(), userId: session?.id, email: parsed.data.email, phone: parsed.data.phone, address: parsed.data.address, total: lines.reduce((sum, line) => sum + line.price * line.quantity, 0), items: { create: lines } },
      include: { items: true }
    });
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to place this order." },
      { status: 409 }
    );
  }
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
