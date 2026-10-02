import { prisma } from "@/lib/db";
import { ProductsManager } from "@/components/admin/products-manager";

export const revalidate = 0;

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: {
          select: { id: true, name: true }
        }
      },
      orderBy: [{ position: "asc" }, { updatedAt: "desc" }]
    }),
    prisma.category.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-maroon">Product Catalog Management</h1>
        <p className="text-sm text-charcoal/65 mt-1">
          Add new pieces, toggle storefront visibility, manage pricing, and organize cultural collections.
        </p>
      </div>

      <ProductsManager initialProducts={products} categories={categories} />
    </div>
  );
}
