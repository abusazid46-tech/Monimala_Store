import { prisma } from "@/lib/db";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const revalidate = 0;

export default async function AdminCategoriesPage() {
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
    orderBy: [{ position: "asc" }, { createdAt: "asc" }]
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-maroon">Collection & Category Hierarchy</h1>
        <p className="text-sm text-charcoal/65 mt-1">
          Organize traditional collections, subcategories, brand taxonomy, and manage storefront presentation.
        </p>
      </div>

      <CategoriesManager initialCategories={categories} />
    </div>
  );
}

