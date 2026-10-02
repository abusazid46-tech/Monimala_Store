"use client";

import { useMemo, useState } from "react";
import {
  Mail,
  MessageCircle,
  Search
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string | Date;
  orders: Array<{
    id: string;
    total: number;
    paymentStatus: string;
    status: string;
  }>;
};

export function CustomersManager({ initialCustomers }: { initialCustomers: AdminCustomer[] }) {
  const [customers] = useState<AdminCustomer[]>(initialCustomers);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    );
  }, [customers, search]);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white p-4 rounded-2xl border border-primary/10 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, phone..."
            className="pl-9 h-10 text-sm"
          />
        </div>
        <div className="text-xs font-semibold text-charcoal/60">
          Total Shoppers: <strong className="text-maroon text-sm">{customers.length}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-primary/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-charcoal/50 bg-cream/30 border-b border-primary/10">
              <tr>
                <th className="py-3.5 px-5 font-semibold">Customer</th>
                <th className="font-semibold">Contact</th>
                <th className="font-semibold text-center">Orders</th>
                <th className="font-semibold text-right">Lifetime Spend</th>
                <th className="font-semibold text-center">Joined Date</th>
                <th className="font-semibold text-right px-5">Contact Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {filtered.map((customer) => {
                const paidOrders = customer.orders.filter((o) => o.paymentStatus === "PAID");
                const totalSpent = paidOrders.reduce((sum, o) => sum + o.total, 0);
                const cleanPhone = (customer.phone || "").replace(/[^0-9]/g, "");

                return (
                  <tr key={customer.id} className="hover:bg-cream/20 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gold/20 text-maroon font-bold flex items-center justify-center text-xs">
                          {customer.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-charcoal block">{customer.name}</span>
                          <span className="text-[11px] text-charcoal/50">ID: {customer.id.slice(-6)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-charcoal font-medium block">{customer.email}</span>
                      <span className="text-[11px] text-charcoal/50">{customer.phone || "No phone added"}</span>
                    </td>
                    <td className="text-center font-heading font-bold text-sm text-charcoal">
                      {customer.orders.length}
                    </td>
                    <td className="text-right font-bold text-sm text-maroon">
                      {formatPrice(totalSpent)}
                    </td>
                    <td className="text-center text-xs text-charcoal/60">
                      {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="text-right px-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                          <a href={`mailto:${customer.email}`} title="Email customer">
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                        {cleanPhone ? (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                          >
                            <a
                              href={`https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`}`}
                              target="_blank"
                              rel="noreferrer"
                              title="WhatsApp customer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-charcoal/50 text-xs">
                    No customer accounts match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
