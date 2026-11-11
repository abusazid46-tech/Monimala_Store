import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided." }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(uploadDir, { recursive: true });

    for (const file of files) {
      if (!file || typeof file.arrayBuffer !== "function") continue;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const origExt = path.extname(file.name).toLowerCase();
      const isWebp = file.type === "image/webp" || origExt === ".webp";
      const cleanExt = isWebp ? ".webp" : ([".jpg", ".jpeg", ".png", ".gif"].includes(origExt) ? origExt : ".webp");
      const fileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${cleanExt}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);
      uploadedUrls.push(`/uploads/products/${fileName}`);
    }

    return NextResponse.json({ success: true, urls: uploadedUrls });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload image." },
      { status: 500 }
    );
  }
}
