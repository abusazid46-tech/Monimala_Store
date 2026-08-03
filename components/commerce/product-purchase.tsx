"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Heart, MessageCircle, RotateCcw, ShieldCheck, ShoppingBag, Star, Truck, Zap } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useCommerceStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductGallery } from "@/components/commerce/gallery";

const deliveryNotes = [
  { icon: Truck, text: "Free tracked shipping across India" },
  { icon: ShieldCheck, text: "Razorpay secure payment gateway" },
  { icon: RotateCcw, text: "Easy return support on eligible orders" },
  { icon: CheckCircle2, text: "Quality checked before dispatch" }
];

export function ProductPurchase({ product }: { product: Product }) {
  const [color, setColor] = useState(product.colors[0] || "");
  const [size, setSize] = useState(product.sizes[0] || "");
  const addToCart = useCommerceStore((state) => state.addToCart);
  const toggleWishlist = useCommerceStore((state) => state.toggleWishlist);
  const wished = useCommerceStore((state) => state.wishlist.includes(product.id));
  const whatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919999999999";
  const gallery = useMemo(() => {
    const selected = color ? product.colorImages[color] : "";
    return selected ? [selected, ...product.images.filter((image) => image !== selected)] : product.images;
  }, [color, product.colorImages, product.images]);
  const options = { color: color || undefined, size: size || undefined };

  const add = () => {
    addToCart(product.id, 1, options);
    toast.success(`Added to cart${color ? ` · ${color}` : ""}${size ? ` · ${size}` : ""}`);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
      <ProductGallery images={gallery} name={product.name} youtubeUrl={product.youtubeUrl} />
      <div className="lg:sticky lg:top-28 lg:h-fit">
        <Badge>{product.category}</Badge>
        <h1 className="mt-4 font-heading text-3xl leading-tight text-maroon md:text-4xl">{product.name}</h1>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1 text-gold-deep"><Star className="h-4 w-4 fill-gold text-gold-deep" />{product.rating}</span>
          <span className="text-charcoal/45">|</span>
          <span className="text-charcoal/60">{product.reviews} reviews</span>
          <span className="text-charcoal/45">|</span>
          <span className="text-emerald-700">{product.stock} in stock</span>
        </div>
        <div className="mt-5 flex items-end gap-3">
          <p className="text-3xl font-bold text-maroon">{formatPrice(product.price)}</p>
          {product.compareAt ? <p className="pb-1 text-lg text-charcoal/40 line-through">{formatPrice(product.compareAt)}</p> : null}
        </div>
        <p className="mt-5 leading-7 text-charcoal/68">{product.description}</p>

        {product.colors.length ? (
          <fieldset className="mt-6">
            <legend className="mb-3 text-sm font-semibold">Colour: <span className="text-maroon">{color}</span></legend>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((item) => (
                <button key={item} type="button" onClick={() => setColor(item)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${color === item ? "border-maroon bg-maroon text-white" : "border-charcoal/15 bg-white"}`}>
                  {item}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {product.sizes.length ? (
          <fieldset className="mt-6">
            <legend className="mb-3 text-sm font-semibold">Select size: <span className="text-maroon">{size}</span></legend>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((item) => (
                <button key={item} type="button" onClick={() => setSize(item)} className={`min-w-12 rounded-lg border px-3 py-2 text-sm font-semibold ${size === item ? "border-maroon bg-maroon text-white" : "border-charcoal/15 bg-white"}`}>
                  {item}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button onClick={add}><ShoppingBag className="h-4 w-4" />Add to cart</Button>
          <Button variant="gold" onClick={() => { add(); window.location.href = "/cart"; }}><Zap className="h-4 w-4" />Buy now</Button>
          <Button variant="outline" onClick={() => toggleWishlist(product.id)}><Heart className={wished ? "h-4 w-4 fill-primary text-primary" : "h-4 w-4"} />{wished ? "Wishlisted" : "Wishlist"}</Button>
          <Button variant="outline" asChild><a href={`https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(`Hi Monimala Store, I want to know more about ${product.name}${color ? ` in ${color}` : ""}${size ? `, size ${size}` : ""}.`)}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" />WhatsApp inquiry</a></Button>
        </div>

        <div className="mt-6 grid gap-3 rounded-lg border border-primary/10 bg-white p-4 text-sm">
          {deliveryNotes.map(({ icon: Icon, text }) => <div key={text} className="flex items-center gap-3"><Icon className="h-5 w-5 text-gold-deep" /><span>{text}</span></div>)}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[65px] z-50 grid grid-cols-2 gap-2 border-t border-primary/10 bg-white/95 p-3 shadow-[0_-12px_30px_rgba(0,0,0,0.12)] backdrop-blur-lg lg:hidden">
        <Button onClick={add} className="h-12 rounded-xl">
          <ShoppingBag className="h-5 w-5" />Add to cart
        </Button>
        <Button variant="outline" className="h-12 rounded-xl border-emerald-600 text-emerald-700 hover:bg-emerald-50" asChild>
          <a href={`https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(`Hi Monimala Store, I want to know more about ${product.name}${color ? ` in ${color}` : ""}${size ? `, size ${size}` : ""}.`)}`} target="_blank" rel="noreferrer">
            <MessageCircle className="h-5 w-5" />WhatsApp enquiry
          </a>
        </Button>
      </div>
    </div>
  );
}
