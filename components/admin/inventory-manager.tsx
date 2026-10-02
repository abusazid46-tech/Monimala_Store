"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  History,
  Minus,
  Plus,
  Search,
  SlidersHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type InventoryProduct = {
  id: string;
  sku: string;
  name: string;
  stock: number;
  lowStockAt: number;
  category: {
    name: string;
  };
};

export type InventoryLog = {
  id: string;
  quantity: number;
  reason: string;
  reference: string | null;
  createdAt: string | Date;
  product: {
    name: string;
    sku: string;
  };
  actor: {
    name: string;
    email: string;
  } | null;
};

export function InventoryManager({
  initialProducts,
  initialLogs
}: {
  initialProducts: InventoryProduct[];
  initialLogs: InventoryLog[];
}) {
  const [activeTab, setActiveTab] = useState<"stock" | "audit">("stock");
  const [products, setProducts] = useState<InventoryProduct[]>(initialProducts);
  const [logs, setLogs] = useState<InventoryLog[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [filterLowOnly, setFilterLowOnly] = useState(false);

  // Adjustment Modal State
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState("RESTOCK");
  const [adjustRef, setAdjustRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.category.name.toLowerCase().includes(search.toLowerCase());
      const matchesLow = !filterLowOnly || p.stock <= p.lowStockAt;
      return matchesSearch && matchesLow;
    });
  }, [products, search, filterLowOnly]);

  async function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct || adjustQty === 0) {
      toast.error("Please specify a non-zero adjustment quantity.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: adjustQty,
          reason: adjustReason,
          reference: adjustRef
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Stock adjustment failed.");

      // Update local product stock
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id ? { ...p, stock: data.product.stock } : p
        )
      );

      // Add to local audit log
      setLogs((prev) => [
        {
          id: data.movement.id,
          quantity: adjustQty,
          reason: adjustReason,
          reference: adjustRef || null,
          createdAt: new Date().toISOString(),
          product: { name: selectedProduct.name, sku: selectedProduct.sku },
          actor: { name: "Current Admin", email: "staff" }
        },
        ...prev
      ]);

      toast.success(
        `Adjusted stock for ${selectedProduct.sku} (${adjustQty > 0 ? `+${adjustQty}` : adjustQty})`
      );
      setSelectedProduct(null);
      setAdjustQty(0);
      setAdjustRef("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Adjustment error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-primary/10 pb-3">
        <button
          onClick={() => setActiveTab("stock")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "stock"
              ? "bg-maroon text-white shadow-xs"
              : "bg-white text-charcoal/70 hover:bg-cream"
          }`}
        >
          <Boxes className="w-4 h-4" />
          Current Stock Ledger ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === "audit"
              ? "bg-maroon text-white shadow-xs"
              : "bg-white text-charcoal/70 hover:bg-cream"
          }`}
        >
          <History className="w-4 h-4" />
          Audit & Movement Ledger ({logs.length})
        </button>
      </div>

      {activeTab === "stock" ? (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-primary/10 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU, product, category..."
                className="pl-9 h-10 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setFilterLowOnly(!filterLowOnly)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  filterLowOnly
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : "bg-white text-charcoal/70 border-primary/10 hover:bg-cream"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Show Low Stock Only ({products.filter((p) => p.stock <= p.lowStockAt).length})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-primary/10 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-charcoal/50 bg-cream/30 border-b border-primary/10">
                  <tr>
                    <th className="py-3.5 px-5 font-semibold">SKU & Code</th>
                    <th className="font-semibold">Product Name</th>
                    <th className="font-semibold">Category</th>
                    <th className="font-semibold text-center">On Hand</th>
                    <th className="font-semibold">Status</th>
                    <th className="font-semibold text-right px-5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal/5">
                  {filteredProducts.map((product) => {
                    const isLow = product.stock <= product.lowStockAt;
                    return (
                      <tr key={product.id} className="hover:bg-cream/20 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-xs text-maroon">
                          {product.sku}
                        </td>
                        <td className="font-medium text-charcoal text-xs">{product.name}</td>
                        <td className="text-xs text-charcoal/60">{product.category.name}</td>
                        <td className="text-center font-heading text-lg font-bold">
                          <span className={isLow ? "text-rose-700" : "text-charcoal"}>{product.stock}</span>
                        </td>
                        <td>
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock (&le;{product.lowStockAt})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="text-right px-5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProduct(product);
                              setAdjustQty(0);
                            }}
                            className="text-xs h-8"
                          >
                            <SlidersHorizontal className="w-3 h-3 mr-1.5" />
                            Adjust Stock
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {!filteredProducts.length && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-charcoal/50 text-xs">
                        No products match your inventory filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Audit Trail Tab */
        <div className="bg-white rounded-2xl border border-primary/10 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-primary/10">
            <h2 className="font-heading text-xl font-bold text-maroon">Stock Movement Ledger</h2>
            <p className="text-xs text-charcoal/60 mt-0.5">
              Chronological immutable audit log of inventory adjustments, order reservations, and returns.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-charcoal/50 bg-cream/30 border-b border-primary/10">
                <tr>
                  <th className="py-3.5 px-5 font-semibold">Timestamp</th>
                  <th className="font-semibold">Product</th>
                  <th className="font-semibold text-center">Change</th>
                  <th className="font-semibold">Reason</th>
                  <th className="font-semibold">Reference</th>
                  <th className="font-semibold px-5">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {logs.map((log) => {
                  const isPositive = log.quantity > 0;
                  return (
                    <tr key={log.id} className="hover:bg-cream/20 transition-colors">
                      <td className="py-3 px-5 text-xs text-charcoal/60 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td>
                        <span className="font-semibold text-xs text-charcoal block">{log.product.name}</span>
                        <span className="font-mono text-[10px] text-charcoal/50">{log.product.sku}</span>
                      </td>
                      <td className="text-center font-heading font-bold text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                            isPositive
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {isPositive ? `+${log.quantity}` : log.quantity}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-medium text-charcoal/80 bg-cream px-2 py-0.5 rounded-full border border-gold/30">
                          {log.reason}
                        </span>
                      </td>
                      <td className="text-xs text-charcoal/60">{log.reference || "—"}</td>
                      <td className="px-5 text-xs text-charcoal/70">
                        {log.actor?.name || log.actor?.email || "System Transaction"}
                      </td>
                    </tr>
                  );
                })}
                {!logs.length && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-charcoal/50 text-xs">
                      No stock movement history recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal / Overlay */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-primary/20 shadow-luxury max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-gold-deep tracking-wider">Inventory Adjustment</span>
                <span className="font-mono text-xs text-charcoal/60">SKU: {selectedProduct.sku}</span>
              </div>
              <h3 className="font-heading text-xl font-bold text-maroon mt-1">{selectedProduct.name}</h3>
              <p className="text-xs text-charcoal/60 mt-0.5">
                Current stock on hand: <strong className="text-charcoal font-bold text-sm">{selectedProduct.stock}</strong> units
              </p>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1.5">
                  Adjustment Units (+ to add, - to deduct):
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setAdjustQty((q) => q - 1)}
                    className="h-10 w-10 p-0 rounded-xl"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                    required
                    className="h-10 text-center font-heading text-lg font-bold"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setAdjustQty((q) => q + 1)}
                    className="h-10 w-10 p-0 rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-charcoal/50 mt-1">
                  New stock will be:{" "}
                  <strong className={selectedProduct.stock + adjustQty < 0 ? "text-rose-600" : "text-emerald-700"}>
                    {selectedProduct.stock + adjustQty}
                  </strong>{" "}
                  units
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1.5">Reason for Adjustment:</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full h-10 rounded-xl border border-primary/20 bg-white px-3 text-xs font-medium text-charcoal focus:ring-2 focus:ring-gold"
                >
                  <option value="RESTOCK">Supplier Restock / New Batch</option>
                  <option value="CUSTOMER_RETURN">Customer Return Restock</option>
                  <option value="DAMAGE_WRITE_OFF">Damaged / Defective Write-off</option>
                  <option value="INVENTORY_AUDIT_CORRECTION">Physical Audit Reconciliation</option>
                  <option value="PROMOTIONAL_SAMPLE">Marketing Sample / Giveaway</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1.5">Reference / Notes (Optional):</label>
                <Input
                  value={adjustRef}
                  onChange={(e) => setAdjustRef(e.target.value)}
                  placeholder="e.g. PO-8491, Bihu Batch A, Return REF-12"
                  className="h-9 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={submitting}
                  onClick={() => setSelectedProduct(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  disabled={submitting || adjustQty === 0 || selectedProduct.stock + adjustQty < 0}
                >
                  {submitting ? "Posting..." : "Confirm Adjustment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
