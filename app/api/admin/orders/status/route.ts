import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const updateStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["PENDING", "PAID", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"]),
  paymentStatus: z.enum(["UNPAID", "PAID"]).optional()
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status parameters." }, { status: 400 });
  }

  const { orderId, status, paymentStatus } = parsed.data;

  try {
    const updateData: { status: string; paymentStatus?: string } = { status };
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    } else if (status === "PAID" || status === "PACKED" || status === "SHIPPED" || status === "DELIVERED") {
      updateData.paymentStatus = "PAID";
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update order status." },
      { status: 500 }
    );
  }
}
