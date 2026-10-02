import { prisma } from "@/lib/db";
import { OrdersManager } from "@/components/admin/orders-manager";

export const revalidate = 0;

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              images: true
            }
          }
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-maroon">Order Management & Fulfillment</h1>
        <p className="text-sm text-charcoal/65 mt-1">
          Review customer shipping information, manage fulfillment pipelines, inspect product options, and notify buyers.
        </p>
      </div>

      <OrdersManager initialOrders={orders} />
    </div>
  );
}
