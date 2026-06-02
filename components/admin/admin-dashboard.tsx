import {
  BarChart3,
  Boxes,
  ImagePlus,
  Package,
  Percent,
  ShoppingCart,
  Tags,
  UsersRound
} from "lucide-react";
import { products } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";

const modules = [
  { icon: Package, title: "Product Management", value: `${products.length} SKUs` },
  { icon: Tags, title: "Category Management", value: "6 collections" },
  { icon: ShoppingCart, title: "Orders", value: "128 monthly" },
  { icon: UsersRound, title: "Customers", value: "2.4k profiles" },
  { icon: Percent, title: "Coupons", value: "4 active" },
  { icon: BarChart3, title: "Analytics", value: "18.7% CVR" },
  { icon: Boxes, title: "Inventory", value: "158 units" },
  { icon: ImagePlus, title: "Banner Management", value: "3 live" }
];

export function AdminDashboard() {
  return (
    <div className="container py-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-deep">
            Admin Dashboard
          </p>
          <h1 className="mt-2 font-heading text-4xl text-maroon md:text-5xl">
            Monimala Commerce Control
          </h1>
          <p className="mt-3 max-w-2xl text-charcoal/65">
            Operational views for catalog, orders, customers, coupons, analytics, inventory and
            homepage banner management.
          </p>
        </div>
        <div className="rounded-lg border border-primary/10 bg-white p-4 shadow-sm">
          <p className="text-xs text-charcoal/55">Today revenue</p>
          <p className="font-heading text-3xl text-maroon">{formatPrice(82450)}</p>
        </div>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map(({ icon: Icon, title, value }) => (
          <article key={title} className="rounded-lg border border-primary/10 bg-white p-5 shadow-sm">
            <Icon className="h-5 w-5 text-gold-deep" />
            <h2 className="mt-3 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-charcoal/55">{value}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-primary/10 bg-white p-5 shadow-sm">
          <h2 className="font-heading text-2xl text-maroon">Recent Orders</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-charcoal/50">
                <tr>
                  <th className="py-2">Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["MONI-A9K21", "Madhurima D.", "Paid", 5499],
                  ["MONI-B7P02", "Rima B.", "Shipped", 3299],
                  ["MONI-K4J88", "Ankita S.", "Packed", 8999]
                ].map(([id, customer, status, total]) => (
                  <tr key={String(id)} className="border-t border-primary/10">
                    <td className="py-3 font-semibold">{id}</td>
                    <td>{customer}</td>
                    <td>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                        {status}
                      </span>
                    </td>
                    <td>{formatPrice(Number(total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-lg border border-primary/10 bg-white p-5 shadow-sm">
          <h2 className="font-heading text-2xl text-maroon">Inventory Alerts</h2>
          <div className="mt-4 grid gap-3">
            {products
              .slice()
              .sort((a, b) => a.stock - b.stock)
              .slice(0, 4)
              .map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-lg bg-cream p-3 text-sm">
                  <span>{product.name}</span>
                  <span className="font-semibold text-maroon">{product.stock} left</span>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
