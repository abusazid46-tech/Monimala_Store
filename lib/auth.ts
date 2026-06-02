import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const cookieName = "monimala_session";

function secret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || "development-secret-change-before-production"
  );
}

export async function createSession(payload: { id: string; email: string; role: string }) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/"
  });
}

export async function getSession() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, secret());
    return verified.payload as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function clearSession() {
  (await cookies()).delete(cookieName);
}
