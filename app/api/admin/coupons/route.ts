import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const createCouponSchema = z.object({
  code: z.string().min(2).max(20).transform((val) => val.trim().toUpperCase()),
  percent: z.number().int().min(1).max(100),
  expiresAt: z.string().optional().nullable()
});

const toggleCouponSchema = z.object({
  id: z.string().min(1),
  active: z.boolean()
});

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: { id: "desc" }
  });

  return NextResponse.json({ coupons });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  // Check if this is a toggle action
  if (body && typeof body.active === "boolean" && body.id) {
    const parsedToggle = toggleCouponSchema.safeParse(body);
    if (!parsedToggle.success) {
      return NextResponse.json({ error: "Invalid toggle payload." }, { status: 400 });
    }

    const updated = await prisma.coupon.update({
      where: { id: parsedToggle.data.id },
      data: { active: parsedToggle.data.active }
    });

    return NextResponse.json({ success: true, coupon: updated });
  }

  // Otherwise create a new coupon
  const parsed = createCouponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid coupon data." }, { status: 400 });
  }

  const { code, percent, expiresAt } = parsed.data;

  try {
    const existing = await prisma.coupon.findUnique({
      where: { code }
    });

    if (existing) {
      return NextResponse.json({ error: "A coupon with this code already exists." }, { status: 409 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        percent,
        active: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create coupon." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Coupon ID is required." }, { status: 400 });
  }

  try {
    await prisma.coupon.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete coupon." },
      { status: 500 }
    );
  }
}
