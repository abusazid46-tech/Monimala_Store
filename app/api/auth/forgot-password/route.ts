import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mail";

const schema = z.object({ email: z.string().email() });
const response = { message: "If that account exists, a password reset link has been sent." };

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json(response);
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase(), role: "CUSTOMER" } });
  if (!user) return NextResponse.json(response);
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } })
  ]);
  const base = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  try { await sendPasswordResetEmail(user.email, `${base}/account/reset-password?token=${token}`); }
  catch (error) { console.error("Password reset email failed", error); }
  return NextResponse.json(response);
}
