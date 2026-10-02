import { prisma } from "@/lib/db";
import { InventoryManager } from "@/components/admin/inventory-manager";

export const revalidate = 0;

export default async function AdminInventoryPage() {
  const [products, logs] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      include: {
        category: {
          select: { name: true }
        }
      },
      orderBy: [{ stock: "asc" }, { updatedAt: "desc" }]
    }),
    prisma.inventoryMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        product: {
          select: { name: true, sku: true }
        },
        actor: {
          select: { name: true, email: true }
        }
      }
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-maroon">Inventory & Stock Control</h1>
        <p className="text-sm text-charcoal/65 mt-1">
          Track stock on hand, execute auditable manual stock changes, and inspect the chronological movement ledger.
        </p>
      </div>

      <InventoryManager initialProducts={products} initialLogs={logs} />
    </div>
  );
}
