"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  MapPin,
  MessageCircle,
  PackageCheck,
  Search,
  ShoppingBag,
  Truck,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AdminOrder = {
  id: string;
  trackingCode: string;
  userId: string | null;
  email: string;
  phone: string;
  address: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  notes: string | null;
  createdAt: string | Date;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    color: string | null;
    size: string | null;
    product: {
      name: string;
      sku: string;
      images: string;
    };
  }>;
};

export function OrdersManager({ initialOrders }: { initialOrders: AdminOrder[] }) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(initialOrders[0]?.id || null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.trackingCode.toLowerCase().includes(q) ||
        order.email.toLowerCase().includes(q) ||
        order.phone.toLowerCase().includes(q) ||
        order.address.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  async function updateStatus(orderId: string, nextStatus: string, nextPaymentStatus?: string) {
    setLoadingId(orderId);
    try {
      const res = await fetch("/api/admin/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: nextStatus, paymentStatus: nextPaymentStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: nextStatus, paymentStatus: nextPaymentStatus || o.paymentStatus }
            : o
        )
      );
      toast.success(`Order status updated to ${nextStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error updating order");
    } finally {
      setLoadingId(null);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }

  function getFirstImage(imagesJson: string): string {
    try {
      const parsed = JSON.parse(imagesJson);
      return Array.isArray(parsed) && parsed.length ? parsed[0] : "/images/monimala-hero.png";
    } catch {
      return "/images/monimala-hero.png";
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls & Search */}
      <div className="bg-white p-5 rounded-2xl border border-primary/10 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracking, phone, email..."
            className="pl-9 h-10 text-sm"
          />
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {["ALL", "PENDING", "PAID", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? "bg-maroon text-white"
                  : "bg-cream text-charcoal/70 hover:bg-primary/10"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Count */}
      <div className="flex items-center justify-between text-xs text-charcoal/60 px-1">
        <span>Showing {filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"}</span>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const isExpanded = expandedId === order.id;
          const cleanPhone = order.phone.replace(/[^0-9]/g, "");

          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-primary/10 shadow-xs overflow-hidden transition-all"
            >
              {/* Card Header Row */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-cream/20 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center text-maroon font-bold text-xs shrink-0">
                    #{order.trackingCode.slice(-4)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-maroon text-base">{order.trackingCode}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.status === "CANCELLED"
                            ? "bg-gray-100 text-gray-700"
                            : order.status === "SHIPPED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.status}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal/60 mt-0.5">
                      Customer: <strong className="text-charcoal">{order.email}</strong> · {order.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6">
                  <div className="text-left md:text-right">
                    <p className="font-heading font-bold text-lg text-maroon">{formatPrice(order.total)}</p>
                    <p className="text-[11px] text-charcoal/50">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <div className="text-charcoal/40">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Expanded Details Drawer */}
              {isExpanded && (
                <div className="p-6 border-t border-primary/10 bg-[#faf6f0]/50 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer & Shipping Details */}
                    <div className="bg-white p-5 rounded-xl border border-primary/10 shadow-2xs space-y-4">
                      <h3 className="font-heading text-base font-bold text-maroon flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gold-deep" />
                        Shipping & Customer Contact
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-charcoal/50 block">Customer Email:</span>
                          <span className="font-medium text-charcoal">{order.email}</span>
                        </div>
                        <div>
                          <span className="text-charcoal/50 block">Contact Phone:</span>
                          <span className="font-medium text-charcoal">{order.phone}</span>
                        </div>
                        <div>
                          <span className="text-charcoal/50 block">Delivery Address:</span>
                          <p className="mt-1 p-3 rounded-lg bg-cream/70 text-charcoal border border-primary/10 font-sans leading-relaxed whitespace-pre-wrap">
                            {order.address}
                          </p>
                        </div>
                      </div>

                      {/* Quick Communication Actions */}
                      <div className="pt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(order.address, "Delivery address")}
                          className="text-xs h-8"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1.5" />
                          Copy Address
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="text-xs h-8 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                        >
                          <a
                            href={`https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`}?text=${encodeURIComponent(
                              `Hello! This is Monimala Store regarding your order ${order.trackingCode}.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                            WhatsApp Customer
                          </a>
                        </Button>
                      </div>
                    </div>

                    {/* Fulfillment Controls & Status */}
                    <div className="bg-white p-5 rounded-xl border border-primary/10 shadow-2xs space-y-4 flex flex-col justify-between">
                      <div>
                        <h3 className="font-heading text-base font-bold text-maroon flex items-center gap-2">
                          <Truck className="w-4 h-4 text-gold-deep" />
                          Fulfillment Actions
                        </h3>
                        <p className="text-xs text-charcoal/60 mt-1">
                          Current status: <strong className="text-maroon">{order.status}</strong> · Payment:{" "}
                          <strong className="text-emerald-700">{order.paymentStatus}</strong>
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant={order.status === "PAID" ? "default" : "outline"}
                            disabled={loadingId === order.id}
                            onClick={() => updateStatus(order.id, "PAID", "PAID")}
                            className="text-xs justify-start h-9"
                          >
                            <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                            Confirm Paid
                          </Button>
                          <Button
                            size="sm"
                            variant={order.status === "PACKED" ? "default" : "outline"}
                            disabled={loadingId === order.id}
                            onClick={() => updateStatus(order.id, "PACKED")}
                            className="text-xs justify-start h-9"
                          >
                            <PackageCheck className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                            Mark Packed
                          </Button>
                          <Button
                            size="sm"
                            variant={order.status === "SHIPPED" ? "default" : "outline"}
                            disabled={loadingId === order.id}
                            onClick={() => updateStatus(order.id, "SHIPPED")}
                            className="text-xs justify-start h-9"
                          >
                            <Truck className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                            Mark Shipped
                          </Button>
                          <Button
                            size="sm"
                            variant={order.status === "DELIVERED" ? "default" : "outline"}
                            disabled={loadingId === order.id}
                            onClick={() => updateStatus(order.id, "DELIVERED", "PAID")}
                            className="text-xs justify-start h-9 border-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                            Mark Delivered
                          </Button>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-primary/10 flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={loadingId === order.id || order.status === "CANCELLED"}
                          onClick={() => updateStatus(order.id, "CANCELLED")}
                          className="text-xs text-rose-700 hover:bg-rose-50 h-8"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Cancel Order
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                          className="text-xs h-8 text-charcoal/60"
                        >
                          <a href={`/orders/track?trackingCode=${order.trackingCode}`} target="_blank" rel="noreferrer">
                            Public Tracking Link
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Order Line Items */}
                  <div className="bg-white p-5 rounded-xl border border-primary/10 shadow-2xs">
                    <h3 className="font-heading text-base font-bold text-maroon mb-3">
                      Ordered Products ({order.items.length})
                    </h3>
                    <div className="divide-y divide-charcoal/10">
                      {order.items.map((item) => (
                        <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-cream overflow-hidden relative shrink-0 border border-primary/10">
                              <Image
                                src={getFirstImage(item.product.images)}
                                alt={item.product.name}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-charcoal">{item.product.name}</p>
                              <p className="text-[11px] text-charcoal/50">
                                SKU: <span className="font-mono">{item.product.sku}</span>
                              </p>
                              {(item.color || item.size) && (
                                <div className="mt-1 flex items-center gap-1.5">
                                  {item.color && (
                                    <span className="px-1.5 py-0.5 rounded bg-cream border border-gold/30 text-[10px] font-semibold text-maroon">
                                      Colour: {item.color}
                                    </span>
                                  )}
                                  {item.size && (
                                    <span className="px-1.5 py-0.5 rounded bg-cream border border-gold/30 text-[10px] font-semibold text-maroon">
                                      Size: {item.size}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-xs text-charcoal">
                              {formatPrice(item.price)} × {item.quantity}
                            </p>
                            <p className="font-bold text-sm text-maroon">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!filteredOrders.length && (
          <div className="bg-white rounded-2xl border border-primary/10 p-12 text-center text-charcoal/60">
            <ShoppingBag className="w-10 h-10 text-charcoal/30 mx-auto mb-3" />
            <p className="font-semibold text-base text-charcoal">No orders found</p>
            <p className="text-xs text-charcoal/50 mt-1">No orders match the current search or status filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
