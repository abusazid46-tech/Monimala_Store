import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRazorpay } from "@/lib/razorpay";

const orderSchema = z.object({
  amount: z.number().int().positive(),
  receipt: z.string().optional()
});

export async function POST(request: NextRequest) {
  const parsed = orderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment amount." }, { status: 400 });
  }

  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: parsed.data.amount * 100,
      currency: "INR",
      receipt: parsed.data.receipt || `monimala_${Date.now()}`
    });

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
