import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRazorpay } from "@/lib/razorpay";

const orderSchema = z.object({
  orderId: z.string().min(1)
});

export async function POST(request: NextRequest) {
  const parsed = orderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment amount." }, { status: 400 });
  }

  try {
    const razorpay = getRazorpay();
    const commerceOrder = await (await import("@/lib/db")).prisma.order.findUnique({ where: { id: parsed.data.orderId } });
    if (!commerceOrder || commerceOrder.paymentStatus === "PAID") return NextResponse.json({ error: "Order is not payable." }, { status: 409 });
    const order = await razorpay.orders.create({
      amount: commerceOrder.total * 100,
      currency: "INR",
      receipt: commerceOrder.trackingCode,
      notes: { commerceOrderId: commerceOrder.id }
    });
    await (await import("@/lib/db")).prisma.order.update({ where: { id: commerceOrder.id }, data: { razorpayOrderId: order.id, paymentMethod: "RAZORPAY" } });

    return NextResponse.json({
      order,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create payment order." },
      { status: 500 }
    );
  }
}
