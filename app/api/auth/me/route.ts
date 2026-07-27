import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "CUSTOMER") return NextResponse.json({ user: null });
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, phone: true, createdAt: true, orders: { select: { id: true, trackingCode: true, total: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 10 } }
  });
  return NextResponse.json({ user });
}
