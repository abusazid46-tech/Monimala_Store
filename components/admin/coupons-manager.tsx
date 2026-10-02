"use client";

import { useState } from "react";
import {
  Plus,
  Tag,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AdminCoupon = {
  id: string;
  code: string;
  percent: number;
  active: boolean;
  expiresAt: string | Date | null;
};

export function CouponsManager({ initialCoupons }: { initialCoupons: AdminCoupon[] }) {
  const [coupons, setCoupons] = useState<AdminCoupon[]>(initialCoupons);
  const [newCode, setNewCode] = useState("");
  const [newPercent, setNewPercent] = useState<number>(10);
  const [newExpiry, setNewExpiry] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newCode.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode,
          percent: newPercent,
          expiresAt: newExpiry ? new Date(newExpiry).toISOString() : null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create coupon.");

      setCoupons((prev) => [data.coupon, ...prev]);
      toast.success(`Coupon ${data.coupon.code} created!`);
      setNewCode("");
      setNewPercent(10);
      setNewExpiry("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error creating coupon");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !current })
      });
      if (!res.ok) throw new Error("Failed to toggle status");
      setCoupons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, active: !current } : c))
      );
      toast.success(!current ? "Coupon activated" : "Coupon deactivated");
    } catch {
      toast.error("Failed to update coupon status");
    }
  }

  async function deleteCoupon(id: string, code: string) {
    if (!confirm(`Are you sure you want to delete coupon ${code}?`)) return;

    try {
      const res = await fetch(`/api/admin/coupons?id=${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete coupon");
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.success(`Coupon ${code} deleted`);
    } catch {
      toast.error("Failed to delete coupon");
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
      {/* Coupon List */}
      <div className="bg-white rounded-2xl border border-primary/10 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-primary/10">
          <h2 className="font-heading text-xl font-bold text-maroon">Active Discount Codes</h2>
          <p className="text-xs text-charcoal/60 mt-0.5">
            Promotional codes eligible for storefront checkout deductions.
          </p>
        </div>

        <div className="divide-y divide-charcoal/5">
          {coupons.map((coupon) => {
            const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();

            return (
              <div
                key={coupon.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-cream/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center text-maroon font-bold text-sm shrink-0">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-maroon text-base tracking-wider">
                        {coupon.code}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-cream text-maroon border border-gold/40">
                        {coupon.percent}% OFF
                      </span>
                    </div>
                    <p className="text-[11px] text-charcoal/50 mt-0.5">
                      {coupon.expiresAt ? (
                        <span>
                          Expires:{" "}
                          {new Date(coupon.expiresAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                          {isExpired && <strong className="text-rose-600 ml-1">(Expired)</strong>}
                        </span>
                      ) : (
                        "Never expires"
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(coupon.id, coupon.active)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                      coupon.active && !isExpired
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {coupon.active && !isExpired ? "Active" : "Disabled"}
                  </button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteCoupon(coupon.id, coupon.code)}
                    className="h-8 w-8 p-0 text-charcoal/40 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {!coupons.length && (
            <div className="p-12 text-center text-charcoal/50 text-xs">
              No discount coupons created yet.
            </div>
          )}
        </div>
      </div>

      {/* Create Coupon Form */}
      <div className="bg-white rounded-2xl border border-primary/10 p-6 shadow-xs h-fit space-y-5">
        <div>
          <h2 className="font-heading text-xl font-bold text-maroon">Create New Coupon</h2>
          <p className="text-xs text-charcoal/60 mt-0.5">
            Configure percentage discounts for festivals, campaigns, or VIP customers.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Coupon Code</label>
            <Input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              required
              placeholder="e.g. BIHU15, FESTIVE20"
              className="h-10 text-xs font-mono font-bold tracking-wider"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Discount Percentage (%)</label>
            <Input
              type="number"
              min={1}
              max={100}
              value={newPercent}
              onChange={(e) => setNewPercent(parseInt(e.target.value) || 0)}
              required
              className="h-10 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Expiration Date (Optional)
            </label>
            <Input
              type="date"
              value={newExpiry}
              onChange={(e) => setNewExpiry(e.target.value)}
              className="h-10 text-xs"
            />
          </div>

          <Button type="submit" variant="default" disabled={submitting} className="w-full">
            <Plus className="w-4 h-4 mr-1.5" />
            {submitting ? "Creating..." : "Issue Coupon"}
          </Button>
        </form>
      </div>
    </div>
  );
}
