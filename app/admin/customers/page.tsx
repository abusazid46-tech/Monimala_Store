import { prisma } from "@/lib/db";
import { CustomersManager } from "@/components/admin/customers-manager";

export const revalidate = 0;

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      orders: {
        select: {
          id: true,
          total: true,
          paymentStatus: true,
          status: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-maroon">Customer Directory</h1>
        <p className="text-sm text-charcoal/65 mt-1">
          Registered buyer accounts, order frequencies, customer lifetime values, and contact shortcuts.
        </p>
      </div>

      <CustomersManager initialCustomers={customers} />
    </div>
  );
}
