import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const updateProductSchema = z.object({
  id: z.string().min(1),
  active: z.boolean().optional(),
  price: z.number().int().min(0).optional(),
  compareAt: z.number().int().min(0).nullable().optional(),
  position: z.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional()
});

const createProductSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  sku: z.string().min(2).transform((v) => v.toUpperCase()),
  categoryId: z.string().min(1),
  price: z.number().int().min(0),
  compareAt: z.number().int().min(0).nullable().optional(),
  stock: z.number().int().min(0).default(0),
  lowStockAt: z.number().int().min(0).default(5),
  description: z.string().min(5),
  images: z.array(z.string()).default([]),
  metal: z.string().optional(),
  occasion: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false)
});

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product parameters." }, { status: 400 });
  }

  const { id, ...data } = parsed.data;

  try {
    const product = await prisma.product.update({
      where: { id },
      data
    });
    return NextResponse.json({ success: true, product });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update product." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid product input." }, { status: 400 });
  }

  const data = parsed.data;

  try {
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: data.name,
          slug: data.slug,
          sku: data.sku,
          categoryId: data.categoryId,
          price: data.price,
          compareAt: data.compareAt ?? null,
          stock: data.stock,
          lowStockAt: data.lowStockAt,
          description: data.description,
          images: JSON.stringify(data.images.length ? data.images : ["/images/monimala-hero.png"]),
          metal: data.metal || null,
          occasion: data.occasion || null,
          isFeatured: data.isFeatured,
          isNew: data.isNew,
          active: true
        }
      });

      if (data.stock > 0) {
        await tx.inventoryMovement.create({
          data: {
            productId: created.id,
            actorId: session.id,
            quantity: data.stock,
            reason: "INITIAL_STOCK",
            reference: "Product creation"
          }
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create product." },
      { status: 409 }
    );
  }
}

const deleteProductSchema = z.object({
  id: z.string().min(1)
});

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  let id = request.nextUrl.searchParams.get("id");
  if (!id) {
    const body = await request.json().catch(() => null);
    const parsed = deleteProductSchema.safeParse(body);
    if (parsed.success) {
      id = parsed.data.id;
    }
  }

  if (!id) {
    return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orderItems: true }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    if (product._count.orderItems > 0) {
      await prisma.product.update({
        where: { id },
        data: { active: false, stock: 0 }
      });

      return NextResponse.json({
        success: true,
        archived: true,
        message: `Product "${product.name}" is part of ${product._count.orderItems} existing order(s). It has been deactivated and archived instead of permanently removed to preserve order records.`
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.wishlistItem.deleteMany({ where: { productId: id } });
      await tx.review.deleteMany({ where: { productId: id } });
      await tx.inventoryMovement.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    return NextResponse.json({
      success: true,
      deleted: true,
      message: `Product "${product.name}" has been permanently deleted.`
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete product." },
      { status: 500 }
    );
  }
}

