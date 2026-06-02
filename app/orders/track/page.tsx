import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Track Order"
};

export default function TrackOrderPage() {
  return (
    <div className="container grid min-h-[60vh] place-items-center py-8">
      <section className="w-full max-w-xl rounded-lg border border-primary/10 bg-white p-6 text-center shadow-luxury">
        <PackageSearch className="mx-auto h-10 w-10 text-gold-deep" />
        <h1 className="mt-4 font-heading text-4xl text-maroon">Track Your Order</h1>
        <p className="mt-3 text-sm leading-6 text-charcoal/65">
          Enter your Monimala tracking code to see payment, packing, shipping and delivery
          status.
        </p>
        <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            placeholder="MONI-ABCDE-12345"
            className="h-11 rounded-full border border-primary/10 px-4 text-center outline-none focus:ring-2 focus:ring-gold sm:text-left"
          />
          <Button type="button">Track</Button>
        </form>
      </section>
    </div>
  );
}
