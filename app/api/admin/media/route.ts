import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const results: string[] = [];

  // Read public/uploads/products
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    const files = await readdir(uploadDir);
    for (const file of files) {
      if (/\.(jpe?g|png|webp|gif)$/i.test(file)) {
        results.push(`/uploads/products/${file}`);
      }
    }
  } catch {
    // Directory might not exist in some environments
  }

  // Read existing product images from database
  try {
    const products = await prisma.product.findMany({
      select: { images: true }
    });
    for (const p of products) {
      if (!p.images) continue;
      try {
        const arr = JSON.parse(p.images);
        if (Array.isArray(arr)) {
          for (const url of arr) {
            if (typeof url === "string" && url.length > 5 && !results.includes(url)) {
              results.push(url);
            }
          }
        }
      } catch {
        // Continue if malformed JSON
      }
    }
  } catch {
    // Continue if DB unavailable
  }

  return NextResponse.json({ gallery: results });
}
