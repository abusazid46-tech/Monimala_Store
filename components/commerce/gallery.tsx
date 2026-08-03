"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
  youtubeUrl
}: {
  images: string[];
  name: string;
  youtubeUrl?: string;
}) {
  const [active, setActive] = useState(images[0]);
  useEffect(() => setActive(images[0]), [images]);
  const activeIndex = Math.max(0, images.indexOf(active));
  const show = (offset: number) => {
    const next = (activeIndex + offset + images.length) % images.length;
    setActive(images[next]);
  };

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
        {images.length > 1 ? (
          <>
            <button type="button" aria-label="Previous product photo" onClick={() => show(-1)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-maroon shadow-lg hover:bg-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Next product photo" onClick={() => show(1)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-maroon shadow-lg hover:bg-white">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
        <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-maroon">
          Hover or tap to zoom
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-charcoal/55">Photo {activeIndex + 1} of {images.length}</p>
        {youtubeUrl ? <a href={youtubeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#ff0000] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#d90000]"><Youtube className="h-4 w-4" />Watch product video</a> : null}
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
