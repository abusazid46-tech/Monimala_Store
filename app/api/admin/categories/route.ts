import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const createCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().nullable().optional(),
  active: z.boolean().default(true),
  position: z.number().int().min(0).default(0)
});

const updateCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  active: z.boolean().optional(),
  position: z.number().int().min(0).optional()
});

const deleteCategorySchema = z.object({
  id: z.string().min(1)
});

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: {
          select: { id: true, name: true, slug: true }
        },
        children: {
          select: { id: true, name: true, slug: true }
        },
        _count: {
          select: { products: true }
        }
      },
      orderBy: [{ position: "asc" }, { name: "asc" }]
    });

    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load categories." },
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
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid category data." },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const slug = (data.slug || data.name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  try {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: slug || `category-${Date.now()}`,
        description: data.description || null,
        image: data.image || null,
        parentId: data.parentId || null,
        active: data.active,
        position: data.position
      },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true } }
      }
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Slug or category already exists." },
      { status: 409 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid category update parameters." }, { status: 400 });
  }

  const { id, ...data } = parsed.data;

  try {
    const category = await prisma.category.update({
      where: { id },
      data,
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true } }
      }
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update category." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  let id = request.nextUrl.searchParams.get("id");
  if (!id) {
    const body = await request.json().catch(() => null);
    const parsed = deleteCategorySchema.safeParse(body);
    if (parsed.success) {
      id = parsed.data.id;
    }
  }

  if (!id) {
    return NextResponse.json({ error: "Category ID is required." }, { status: 400 });
  }

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    if (category._count.products > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category "${category.name}" because it currently has ${category._count.products} assigned product(s). Please reassign or delete the products first.`
        },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Re-parent any child subcategories to top level so they are not broken
      await tx.category.updateMany({
        where: { parentId: id },
        data: { parentId: null }
      });
      await tx.category.delete({ where: { id } });
    });

    return NextResponse.json({
      success: true,
      deleted: true,
      message: `Category "${category.name}" deleted successfully.`
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete category." },
      { status: 500 }
    );
  }
}

