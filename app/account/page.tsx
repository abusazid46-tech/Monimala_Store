import type { Metadata } from "next";
import { Heart, LockKeyhole, PackageCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Account"
};

const accountTiles = [
  { icon: UserRound, label: "Profile" },
  { icon: PackageCheck, label: "Orders" },
  { icon: Heart, label: "Wishlist" }
];

export default function AccountPage() {
  return (
    <div className="container grid gap-6 py-8 lg:grid-cols-[0.8fr_1.2fr]">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-deep">
          Customer Account
        </p>
        <h1 className="mt-2 font-heading text-4xl text-maroon md:text-5xl">
          Sign in to manage your Monimala orders.
        </h1>
        <p className="mt-3 max-w-xl text-charcoal/65">
          Authentication APIs are ready for email-password sessions, protected admin role checks,
          wishlists and order history.
        </p>
      </section>
      <section className="rounded-lg border border-primary/10 bg-white p-5 shadow-luxury">
        <div className="grid gap-3 sm:grid-cols-3">
          {accountTiles.map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-lg bg-cream p-4">
              <Icon className="h-5 w-5 text-gold-deep" />
              <p className="mt-2 font-semibold">{label}</p>
            </div>
          ))}
        </div>
        <form className="mt-5 grid gap-3">
          <input
            type="email"
            placeholder="Email address"
            className="h-11 rounded-full border border-primary/10 px-4 outline-none focus:ring-2 focus:ring-gold"
          />
          <input
            type="password"
            placeholder="Password"
            className="h-11 rounded-full border border-primary/10 px-4 outline-none focus:ring-2 focus:ring-gold"
          />
          <Button type="button">
            <LockKeyhole className="h-4 w-4" />
            Sign in
          </Button>
        </form>
      </section>
    </div>
  );
}
