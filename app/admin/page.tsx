import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  Package,
  ShoppingBag,
  TrendingUp,
  Users
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const revalidate = 0; // Fresh real-time data for admin

export default async function AdminDashboardPage() {
  const [
    totalRevenueAgg,
    totalOrdersCount,
    pendingOrdersCount,
    productsCount,
    lowStockCount,
    customersCount,
    recentOrders,
    lowStockProducts
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true }
    }),
    prisma.order.count(),
    prisma.order.count({
      where: { status: { notIn: ["DELIVERED", "CANCELLED"] } }
    }),
    prisma.product.count({ where: { active: true } }),
    prisma.product.count({
      where: { active: true, stock: { lte: 5 } }
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: { include: { product: true } } }
    }),
    prisma.product.findMany({
      where: { active: true, stock: { lte: 5 } },
      include: { category: true },
      orderBy: { stock: "asc" },
      take: 5
    })
  ]);

  const totalRevenue = totalRevenueAgg._sum.total || 0;

  const kpis = [
    {
      title: "Gross Paid Revenue",
      value: formatPrice(totalRevenue),
      subtitle: "Lifetime captured payments",
      icon: TrendingUp,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200"
    },
    {
      title: "Pending Fulfillment",
      value: pendingOrdersCount,
      subtitle: `${totalOrdersCount} lifetime orders placed`,
      icon: Clock,
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200"
    },
    {
      title: "Active Products",
      value: productsCount,
      subtitle: "Live in customer catalog",
      icon: Package,
      color: "text-blue-700",
      bg: "bg-blue-50",
      border: "border-blue-200"
    },
    {
      title: "Low Stock Alerts",
      value: lowStockCount,
      subtitle: "Products at or below 5 units",
      icon: AlertTriangle,
      color: lowStockCount > 0 ? "text-rose-700" : "text-emerald-700",
      bg: lowStockCount > 0 ? "bg-rose-50" : "bg-emerald-50",
      border: lowStockCount > 0 ? "border-rose-200" : "border-emerald-200"
    },
    {
      title: "Registered Shoppers",
      value: customersCount,
      subtitle: "Active buyer accounts",
      icon: Users,
      color: "text-purple-700",
      bg: "bg-purple-50",
      border: "border-purple-200"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-primary/10 shadow-xs">
        <div>
          <h1 className="font-heading text-3xl font-bold text-maroon">Store Operations Overview</h1>
          <p className="mt-1 text-sm text-charcoal/65">
            Monitor incoming orders, inventory replenishment, customer activity, and sales health.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button asChild variant="gold">
            <Link href="/admin/orders">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Manage Orders
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/inventory">
              <Boxes className="w-4 h-4 mr-2" />
              Adjust Stock
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className={`p-5 rounded-2xl border bg-white shadow-xs flex flex-col justify-between ${kpi.border}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-charcoal/60 uppercase tracking-wider">{kpi.title}</span>
                <span className={`p-2 rounded-xl ${kpi.bg} ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-4">
                <p className="font-heading text-3xl font-bold text-charcoal">{kpi.value}</p>
                <p className="text-xs text-charcoal/50 mt-1">{kpi.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Orders & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-primary/10 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-primary/10">
            <div>
              <h2 className="font-heading text-xl font-bold text-maroon">Recent Store Orders</h2>
              <p className="text-xs text-charcoal/60 mt-0.5">Orders received across online and direct channels</p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center text-xs font-bold text-maroon hover:text-primary gap-1"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto mt-4 flex-1">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-charcoal/50 border-b border-charcoal/10 pb-2">
                <tr>
                  <th className="py-2.5 font-semibold">Reference</th>
                  <th className="font-semibold">Customer</th>
                  <th className="font-semibold">Items</th>
                  <th className="font-semibold">Status</th>
                  <th className="font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-cream/40 transition-colors">
                    <td className="py-3.5">
                      <Link href={`/admin/orders?search=${order.trackingCode}`} className="font-mono font-semibold text-maroon hover:underline">
                        {order.trackingCode}
                      </Link>
                      <p className="text-[11px] text-charcoal/45">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </td>
                    <td>
                      <p className="font-medium text-charcoal text-xs truncate max-w-[140px]">{order.email}</p>
                      <p className="text-[11px] text-charcoal/50">{order.phone}</p>
                    </td>
                    <td>
                      <span className="text-xs text-charcoal/70">
                        {order.items.length} {order.items.length === 1 ? "item" : "items"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          order.status === "DELIVERED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : order.status === "CANCELLED"
                            ? "bg-gray-100 text-gray-700"
                            : order.status === "SHIPPED"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="text-right font-semibold text-charcoal">
                      {formatPrice(order.total)}
                    </td>
                  </tr>
                ))}
                {!recentOrders.length && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-charcoal/50 text-xs">
                      No orders received yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-primary/10 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-primary/10">
              <div>
                <h2 className="font-heading text-xl font-bold text-maroon">Inventory Alerts</h2>
                <p className="text-xs text-charcoal/60 mt-0.5">Critical stock below safety thresholds</p>
              </div>
              <Link
                href="/admin/inventory"
                className="inline-flex items-center text-xs font-bold text-maroon hover:text-primary gap-1"
              >
                Inventory
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-3">
                    <p className="font-semibold text-xs text-charcoal truncate">{product.name}</p>
                    <p className="text-[11px] text-charcoal/50 mt-0.5">
                      SKU: <span className="font-mono">{product.sku}</span> · {product.category.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                      {product.stock} left
                    </span>
                    <p className="text-[10px] text-charcoal/50 mt-0.5">Alert at {product.lowStockAt}</p>
                  </div>
                </div>
              ))}
              {!lowStockProducts.length && (
                <div className="py-12 text-center text-charcoal/50 flex flex-col items-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
                  <p className="text-sm font-semibold text-charcoal">Stock Levels Healthy</p>
                  <p className="text-xs text-charcoal/60 mt-1">All active catalog products have sufficient inventory.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-primary/10">
            <Button asChild variant="outline" className="w-full justify-center">
              <Link href="/admin/inventory">
                Open Stock Ledger & Audit Log
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
