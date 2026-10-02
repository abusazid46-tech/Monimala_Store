import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const adjustStockSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().refine((val) => val !== 0, "Adjustment cannot be zero"),
  reason: z.string().min(3, "Reason is required"),
  reference: z.string().optional()
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adjustStockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input." }, { status: 400 });
  }

  const { productId, quantity, reason, reference } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new Error("Product not found.");
      }

      const newStock = product.stock + quantity;
      if (newStock < 0) {
        throw new Error(`Stock cannot become negative. Current stock is ${product.stock}, attempted adjustment is ${quantity}.`);
      }

      const updated = await tx.product.update({
        where: { id: productId },
        data: { stock: newStock }
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          productId,
          actorId: session.id,
          quantity,
          reason,
          reference: reference || null
        }
      });

      return { product: updated, movement };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to adjust stock." },
      { status: 422 }
    );
  }
}
