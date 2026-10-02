import type { Metadata } from "next";
import Link from "next/link";
import {
  Boxes,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Package,
  Percent,
  ShieldAlert,
  ShoppingBag,
  Store,
  Users
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Commerce Control · Monimala Admin",
  description: "Monimala Store administrator portal for orders, inventory, catalog, and customers."
};

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-primary/20 bg-white p-8 text-center shadow-luxury">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-primary mb-5">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="font-heading text-3xl text-maroon font-bold">Admin Portal</h1>
          <p className="mt-3 text-sm text-charcoal/70 leading-relaxed">
            You must be signed in with an administrator account to access Monimala Commerce Control.
          </p>
          <div className="mt-6 rounded-xl bg-cream p-4 text-xs text-charcoal/80 text-left border border-gold/30">
            <p className="font-semibold text-maroon mb-1">Default Staff Account</p>
            <p className="font-mono">Email: admin@monimalastore.com</p>
            <p className="font-mono mt-0.5">Password: Admin@12345</p>
          </div>
          <div className="mt-6 flex flex-col gap-2.5">
            <Button asChild className="w-full">
              <Link href="/account">Sign In to Account</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/">Return to Storefront</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/inventory", label: "Inventory", icon: Boxes },
    { href: "/admin/customers", label: "Customers", icon: Users },
    { href: "/admin/coupons", label: "Coupons", icon: Percent }
  ];

  return (
    <div className="min-h-screen bg-[#fbf8f4] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#560f1a] text-white flex flex-col border-r border-[#6f1523] shrink-0">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/admin" className="flex flex-col">
            <span className="font-heading text-2xl font-bold tracking-tight text-white">Monimala</span>
            <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-gold-pale">Commerce Control</span>
          </Link>
          <span className="text-xs rounded-full bg-gold/20 text-gold-pale px-2 py-0.5 font-semibold">Admin</span>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Icon className="w-4 h-4 text-gold-pale" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-white/10">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gold-pale hover:bg-white/10 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                View Storefront
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </Link>
          </div>
        </nav>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-white/10 bg-black/15 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-semibold text-white truncate">{session.email}</p>
            <p className="text-[10px] text-white/60">Logged in</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              title="Sign out"
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-primary/10 bg-white px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-sm text-charcoal/60">
            <span>Administration</span>
            <span>/</span>
            <span className="font-semibold text-maroon">Commerce Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild size="sm" variant="outline" className="h-9">
              <Link href="/" target="_blank">
                <Store className="w-3.5 h-3.5 mr-1.5" />
                Live Shop
              </Link>
            </Button>
          </div>
        </header>

        <main className="p-5 md:p-8 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
