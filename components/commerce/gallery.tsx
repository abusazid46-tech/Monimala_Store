"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(images[0]);
  useEffect(() => setActive(images[0]), [images]);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-white shadow-luxury">
        <Image
          src={active}
          alt={name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition duration-500 hover:scale-110"
        />
        <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-maroon">
          Hover or tap to zoom
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((image) => (
          <button
            key={image}
            type="button"
            onClick={() => setActive(image)}
            className={cn(
              "relative aspect-square overflow-hidden rounded-md border bg-white",
              active === image ? "border-gold shadow-gold" : "border-primary/10"
            )}
          >
            <Image src={image} alt={name} fill sizes="25vw" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
