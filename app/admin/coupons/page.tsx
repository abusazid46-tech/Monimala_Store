import { prisma } from "@/lib/db";
import { CouponsManager } from "@/components/admin/coupons-manager";

export const revalidate = 0;

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { id: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-maroon">Promotions & Coupons</h1>
        <p className="text-sm text-charcoal/65 mt-1">
          Issue discount codes, define savings percentages, monitor expiry windows, and control promotional campaigns.
        </p>
      </div>

      <CouponsManager initialCoupons={coupons} />
    </div>
  );
}
