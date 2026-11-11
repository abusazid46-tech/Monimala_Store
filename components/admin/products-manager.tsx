"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Link2,
  Loader2,
  PackageCheck,
  Plus,
  Search,
  Star,
  Tag,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { compressImageToWebP, formatFileSize } from "@/lib/image-compressor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  compareAt: number | null;
  stock: number;
  lowStockAt: number;
  images: string;
  active: boolean;
  isFeatured: boolean;
  isNew: boolean;
  position: number;
  metal: string | null;
  occasion: string | null;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
};

const DEFAULT_GALLERY_IMAGES = [
  "/uploads/products/royal-circular-gold-set-1.jpg",
  "/uploads/products/golden-floral-bangles-1.jpg",
  "/uploads/products/assamese-crescent-blue.jpg",
  "/uploads/products/copper-assamese-stone-necklace-green-gold.jpg",
  "/uploads/products/leaf-pendant-set-white.jpg",
  "/uploads/products/oxidised-hexagon-drop-earrings-yellow.jpg",
  "/uploads/products/red-gold-statement-ring-1.jpg",
  "/uploads/products/assamese-leaf-red-1.jpg",
  "/images/monimala-hero.png"
];

export function ProductsManager({
  initialProducts,
  categories
}: {
  initialProducts: AdminProduct[];
  categories: Array<{ id: string; name: string }>;
}) {
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "LIVE" | "HIDDEN" | "LOW_STOCK">("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productToDelete, setProductToDelete] = useState<AdminProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New Product Form State
  const [newName, setNewName] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newCatId, setNewCatId] = useState(categories[0]?.id || "");
  const [newPrice, setNewPrice] = useState<number>(1999);
  const [newCompareAt, setNewCompareAt] = useState<number | undefined>(undefined);
  const [newStock, setNewStock] = useState<number>(10);
  const [newLowStockAt, setNewLowStockAt] = useState<number>(5);
  const [newMetal, setNewMetal] = useState("Gold Finish");
  const [newOccasion, setNewOccasion] = useState("Festive");
  const [newDesc, setNewDesc] = useState("");

  // Media Desk State
  const [activeMediaTab, setActiveMediaTab] = useState<"gallery" | "upload" | "url">("gallery");
  const [galleryList, setGalleryList] = useState<string[]>(DEFAULT_GALLERY_IMAGES);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Fetch available gallery images on mount
  useEffect(() => {
    async function loadGallery() {
      try {
        const res = await fetch("/api/admin/media");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.gallery) && data.gallery.length > 0) {
            setGalleryList(data.gallery);
          }
        }
      } catch {
        // Fallback to default gallery images
      }
    }
    loadGallery();
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = products.length;
    const live = products.filter((p) => p.active).length;
    const hidden = total - live;
    const lowStock = products.filter((p) => p.stock <= p.lowStockAt && p.stock > 0).length;
    const outOfStock = products.filter((p) => p.stock === 0).length;
    return { total, live, hidden, lowStock, outOfStock };
  }, [products]);

  // Filtered Products
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = categoryFilter === "ALL" || p.categoryId === categoryFilter;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.metal && p.metal.toLowerCase().includes(q)) ||
        (p.occasion && p.occasion.toLowerCase().includes(q)) ||
        p.category.name.toLowerCase().includes(q);

      let matchStatus = true;
      if (statusFilter === "LIVE") matchStatus = p.active;
      else if (statusFilter === "HIDDEN") matchStatus = !p.active;
      else if (statusFilter === "LOW_STOCK") matchStatus = p.stock <= p.lowStockAt;

      return matchCat && matchSearch && matchStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  // Toggle Visibility
  async function toggleActive(id: string, current: boolean) {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !current })
      });
      if (!res.ok) throw new Error("Failed to update status");
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, active: !current } : p))
      );
      toast.success(!current ? "Product is now Live on storefront" : "Product hidden from storefront");
    } catch {
      toast.error("Failed to update visibility");
    }
  }

  // Toggle Featured
  async function toggleFeatured(id: string, current: boolean) {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isFeatured: !current })
      });
      if (!res.ok) throw new Error("Failed to update featured status");
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isFeatured: !current } : p))
      );
      toast.success(!current ? "Marked as Featured Piece" : "Unmarked from Featured");
    } catch {
      toast.error("Failed to update featured flag");
    }
  }

  // Delete Product Handler
  async function handleDeleteProduct() {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(productToDelete.id)}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete product");

      if (data.archived) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productToDelete.id ? { ...p, active: false, stock: 0 } : p))
        );
        toast.warning(data.message);
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
        toast.success(data.message || `Deleted product "${productToDelete.name}"`);
      }
      setProductToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error deleting product");
    } finally {
      setIsDeleting(false);
    }
  }

  // Media Desk Handlers
  function toggleGallerySelection(url: string) {
    setAttachedImages((prev) => {
      if (prev.includes(url)) {
        return prev.filter((u) => u !== url);
      } else {
        return [...prev, url];
      }
    });
  }

  function removeAttachedImage(url: string) {
    setAttachedImages((prev) => prev.filter((u) => u !== url));
  }

  function handleAddUrl() {
    const raw = urlInput.trim();
    if (!raw) return;
    const urls = raw
      .split(/[\r\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    setAttachedImages((prev) => Array.from(new Set([...prev, ...urls])));
    setUrlInput("");
    toast.success(`Added ${urls.length} URL${urls.length === 1 ? "" : "s"} to preview`);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      let originalBytes = 0;
      let compressedBytes = 0;

      // Client-Side Hybrid Compression to WebP
      for (let i = 0; i < rawFiles.length; i++) {
        const file = rawFiles[i];
        originalBytes += file.size;
        try {
          const result = await compressImageToWebP(file, {
            maxDimension: 1600,
            quality: 0.82
          });
          formData.append("files", result.file);
          compressedBytes += result.compressedSize;
        } catch {
          // Fallback to original file if client canvas unsupported
          formData.append("files", file);
          compressedBytes += file.size;
        }
      }

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.urls) {
        setAttachedImages((prev) => Array.from(new Set([...prev, ...data.urls])));
        setGalleryList((prev) => Array.from(new Set([...data.urls, ...prev])));
        const savings = Math.max(0, Math.round(((originalBytes - compressedBytes) / originalBytes) * 100));
        toast.success(
          `⚡ Auto-compressed ${data.urls.length} photo(s) to WebP: ${formatFileSize(originalBytes)} ➔ ${formatFileSize(compressedBytes)} (${savings}% saved)`
        );
      } else {
        // Fallback: Read as local data URLs for preview
        for (let i = 0; i < rawFiles.length; i++) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setAttachedImages((prev) => [...prev, event.target!.result as string]);
            }
          };
          reader.readAsDataURL(rawFiles[i]);
        }
        toast.info("Image added to preview");
      }
    } catch {
      toast.error("Upload error. Please try again or use direct URLs.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  // Create Product Submit
  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // Merge any remaining URLs from the input textarea if not yet added
    let finalImages = [...attachedImages];
    if (urlInput.trim()) {
      const remainingUrls = urlInput
        .split(/[\r\n,]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 5);
      finalImages = Array.from(new Set([...finalImages, ...remainingUrls]));
    }

    if (finalImages.length === 0) {
      finalImages = ["/images/monimala-hero.png"];
    }

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          slug: slug || `prod-${Date.now()}`,
          sku: newSku,
          categoryId: newCatId,
          price: newPrice,
          compareAt: newCompareAt || null,
          stock: newStock,
          lowStockAt: newLowStockAt,
          metal: newMetal,
          occasion: newOccasion,
          description: newDesc,
          images: finalImages
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");

      const cat = categories.find((c) => c.id === newCatId);
      setProducts((prev) => [
        {
          ...data.product,
          category: { id: newCatId, name: cat?.name || "Catalog" }
        },
        ...prev
      ]);

      toast.success(`Created product "${newName}" with ${finalImages.length} image(s)`);
      setIsCreateOpen(false);
      setNewName("");
      setNewSku("");
      setNewDesc("");
      setAttachedImages([]);
      setUrlInput("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error creating product");
    } finally {
      setSubmitting(false);
    }
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
      {/* 1. Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-primary/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-maroon/10 text-maroon flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-charcoal/60">Total Catalog</div>
            <div className="text-xl font-bold font-heading text-maroon">{metrics.total}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-emerald-700/80">Live on Store</div>
            <div className="text-xl font-bold font-heading text-emerald-800">{metrics.live}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-charcoal/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-charcoal/5 text-charcoal/70 flex items-center justify-center shrink-0">
            <EyeOff className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-charcoal/60">Hidden / Draft</div>
            <div className="text-xl font-bold font-heading text-charcoal">{metrics.hidden}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-amber-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-amber-700/80">Low Stock</div>
            <div className="text-xl font-bold font-heading text-amber-800">{metrics.lowStock}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-rose-100 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <X className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-rose-700/80">Out of Stock</div>
            <div className="text-xl font-bold font-heading text-rose-800">{metrics.outOfStock}</div>
          </div>
        </div>
      </div>

      {/* 2. Controls & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-primary/10 shadow-xs flex flex-col md:flex-row gap-3.5 justify-between items-center">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, SKU, finish..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-xl border border-primary/20 bg-white px-3 text-xs font-semibold text-charcoal focus:ring-2 focus:ring-gold"
          >
            <option value="ALL">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "LIVE" | "HIDDEN" | "LOW_STOCK")}
            className="h-9 rounded-xl border border-primary/20 bg-white px-3 text-xs font-semibold text-charcoal focus:ring-2 focus:ring-gold"
          >
            <option value="ALL">All Statuses</option>
            <option value="LIVE">Live on Store</option>
            <option value="HIDDEN">Hidden / Draft</option>
            <option value="LOW_STOCK">Low Stock Alert</option>
          </select>
        </div>

        <Button
          onClick={() => {
            setAttachedImages([]);
            setIsCreateOpen(true);
          }}
          variant="gold"
          className="w-full md:w-auto shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Product
        </Button>
      </div>

      {/* 3. Professional Product Catalog Table */}
      <div className="bg-white rounded-2xl border border-primary/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-charcoal/60 bg-cream/40 border-b border-primary/10">
              <tr>
                <th className="py-3.5 px-5 font-semibold">Product & Details</th>
                <th className="font-semibold">Category</th>
                <th className="font-semibold">Pricing & Value</th>
                <th className="font-semibold text-center">Stock Level</th>
                <th className="font-semibold text-center">Featured</th>
                <th className="font-semibold text-right px-5">Storefront Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/5">
              {filtered.map((product) => {
                const discount =
                  product.compareAt && product.compareAt > product.price
                    ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
                    : null;

                return (
                  <tr key={product.id} className="hover:bg-cream/15 transition-colors">
                    {/* Product Cell */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-cream overflow-hidden relative shrink-0 border border-primary/15 group">
                          <Image
                            src={getFirstImage(product.images)}
                            alt={product.name}
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="font-semibold text-xs text-charcoal block line-clamp-1">
                            {product.name}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-maroon bg-maroon/5 px-1.5 py-0.5 rounded border border-maroon/10">
                              {product.sku}
                            </span>
                            {product.metal && (
                              <span className="inline-flex items-center text-[9px] font-medium text-charcoal/70 bg-gray-100 px-1.5 py-0.5 rounded">
                                {product.metal}
                              </span>
                            )}
                            {product.occasion && (
                              <span className="inline-flex items-center text-[9px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                {product.occasion}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category Cell */}
                    <td className="text-xs">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cream/70 text-charcoal/80 font-medium text-[11px] border border-primary/10">
                        <Tag className="w-3 h-3 text-gold" />
                        {product.category.name}
                      </span>
                    </td>

                    {/* Pricing Cell */}
                    <td>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-charcoal">
                            {formatPrice(product.price)}
                          </span>
                          {discount ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                              -{discount}% OFF
                            </span>
                          ) : null}
                        </div>
                        {product.compareAt ? (
                          <span className="text-[10px] text-charcoal/40 line-through block">
                            {formatPrice(product.compareAt)}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Stock Cell */}
                    <td className="text-center">
                      {product.stock === 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Out of Stock
                        </span>
                      ) : product.stock <= product.lowStockAt ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Low Stock ({product.stock})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          In Stock ({product.stock})
                        </span>
                      )}
                    </td>

                    {/* Featured Star */}
                    <td className="text-center">
                      <button
                        type="button"
                        onClick={() => toggleFeatured(product.id, product.isFeatured)}
                        title={product.isFeatured ? "Featured item" : "Click to feature"}
                        className={`p-1.5 rounded-lg transition-colors ${
                          product.isFeatured
                            ? "text-amber-500 bg-amber-50 shadow-xs"
                            : "text-charcoal/25 hover:text-amber-500 hover:bg-amber-50/50"
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </td>

                    {/* Actions Cell */}
                    <td className="text-right px-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleActive(product.id, product.active)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            product.active
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                          }`}
                        >
                          {product.active ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              Live
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              Hidden
                            </>
                          )}
                        </button>
                        <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0 text-charcoal/60 hover:text-maroon">
                          <Link href={`/products/${product.slug}`} target="_blank" title="View product in storefront">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                        <button
                          type="button"
                          onClick={() => setProductToDelete(product)}
                          title="Delete product"
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-charcoal/50 text-xs">
                    No products found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Executive Add Product Modal with Dual Media Desk */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-primary/20 shadow-2xl max-w-2xl w-full p-6 sm:p-7 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-primary/10 pb-4">
              <div>
                <h3 className="font-heading text-xl font-bold text-maroon">Create Storefront Product</h3>
                <p className="text-xs text-charcoal/60">Publish a handcrafted Assamese heritage item to your catalog.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-full bg-cream flex items-center justify-center text-charcoal/60 hover:text-charcoal transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-charcoal mb-1">Product Title *</label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    placeholder="e.g. Royal Jonbiri Bridal Necklace"
                    className="h-10 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">SKU Code *</label>
                  <Input
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    required
                    placeholder="e.g. MONI-JB01"
                    className="h-9 text-xs font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Collection / Category *</label>
                  <select
                    value={newCatId}
                    onChange={(e) => setNewCatId(e.target.value)}
                    className="w-full h-9 rounded-xl border border-primary/20 bg-white px-2.5 text-xs font-medium text-charcoal focus:ring-2 focus:ring-gold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Selling Price (₹) *</label>
                  <Input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseInt(e.target.value) || 0)}
                    required
                    className="h-9 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Compare-At Price (₹, Optional)</label>
                  <Input
                    type="number"
                    value={newCompareAt || ""}
                    onChange={(e) => setNewCompareAt(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Original price for strikethrough"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Initial Stock Units *</label>
                  <Input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                    required
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Low-Stock Alert Level</label>
                  <Input
                    type="number"
                    value={newLowStockAt}
                    onChange={(e) => setNewLowStockAt(parseInt(e.target.value) || 5)}
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Finish / Metal</label>
                  <Input
                    value={newMetal}
                    onChange={(e) => setNewMetal(e.target.value)}
                    placeholder="e.g. Gold Plated, Copper / Brass"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Occasion / Theme</label>
                  <Input
                    value={newOccasion}
                    onChange={(e) => setNewOccasion(e.target.value)}
                    placeholder="e.g. Bridal, Festive, Daily Heritage"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Craftsmanship Description *</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  required
                  rows={2}
                  placeholder="Detailed artisanal craftsmanship, materials, dimensions, and styling notes..."
                  className="w-full rounded-xl border border-primary/20 p-2.5 text-xs font-sans focus:ring-2 focus:ring-gold"
                />
              </div>

              {/* 5. DUAL MEDIA MANAGER: GALLERY + UPLOAD + KEEP URL */}
              <div className="rounded-2xl border border-primary/15 bg-cream/20 p-4 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-primary/10 pb-2.5">
                  <div>
                    <h4 className="text-xs font-bold text-maroon flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-gold" />
                      Product Imagery & Media Desk
                    </h4>
                    <p className="text-[11px] text-charcoal/60">
                      Select photos from your Store Gallery, upload directly from your device, or paste external URLs.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-maroon bg-white px-2 py-0.5 rounded-full border border-primary/15 self-start sm:self-center">
                    {attachedImages.length} attached
                  </span>
                </div>

                {/* Media Tabs */}
                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-primary/15 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab("gallery")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold transition-all ${
                      activeMediaTab === "gallery"
                        ? "bg-maroon text-white shadow-xs"
                        : "text-charcoal/70 hover:bg-cream/40"
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Store Gallery
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMediaTab("upload")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold transition-all ${
                      activeMediaTab === "upload"
                        ? "bg-maroon text-white shadow-xs"
                        : "text-charcoal/70 hover:bg-cream/40"
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Device Upload
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMediaTab("url")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-semibold transition-all ${
                      activeMediaTab === "url"
                        ? "bg-maroon text-white shadow-xs"
                        : "text-charcoal/70 hover:bg-cream/40"
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    Keep / Add URL
                  </button>
                </div>

                {/* TAB 1: STORE MEDIA GALLERY */}
                {activeMediaTab === "gallery" && (
                  <div className="space-y-2">
                    <div className="text-[11px] text-charcoal/60 flex items-center justify-between">
                      <span>Click any photo to select or deselect for this product:</span>
                      <span className="text-[10px] text-charcoal/50 font-mono">
                        {galleryList.length} photos available
                      </span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 border border-primary/10 rounded-xl bg-white">
                      {galleryList.map((imgUrl) => {
                        const isSelected = attachedImages.includes(imgUrl);
                        return (
                          <div
                            key={imgUrl}
                            onClick={() => toggleGallerySelection(imgUrl)}
                            className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                              isSelected
                                ? "border-emerald-600 ring-2 ring-emerald-500/30 scale-95"
                                : "border-transparent hover:border-primary/30"
                            }`}
                          >
                            <Image
                              src={imgUrl}
                              alt="Gallery item"
                              fill
                              unoptimized
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-emerald-700/30 flex items-center justify-center">
                                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shadow-sm">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: DEVICE UPLOAD */}
                {activeMediaTab === "upload" && (
                  <div className="space-y-2">
                    <label className="border-2 border-dashed border-primary/30 hover:border-maroon bg-white rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <div className="w-10 h-10 rounded-full bg-cream text-maroon flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-charcoal">
                        {isUploading ? "Uploading photos..." : "Click or Drag photos from device"}
                      </span>
                      <span className="text-[10px] text-charcoal/50 mt-0.5">
                        High resolution JPG, PNG, or WebP (up to 5 MB each)
                      </span>
                    </label>
                  </div>
                )}

                {/* TAB 3: KEEP URL / ADD URL */}
                {activeMediaTab === "url" && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold text-charcoal">
                      Paste external image URLs (one per line or comma-separated):
                    </label>
                    <textarea
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      rows={3}
                      placeholder="https://images.unsplash.com/...&#10;https://.../photo.jpg"
                      className="w-full rounded-xl border border-primary/20 p-2.5 text-xs font-mono focus:ring-2 focus:ring-gold bg-white"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddUrl}
                        disabled={!urlInput.trim()}
                        className="h-8 text-xs font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add URLs to Tray
                      </Button>
                    </div>
                  </div>
                )}

                {/* ATTACHED IMAGES PREVIEW TRAY */}
                <div className="border-t border-primary/10 pt-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-charcoal">
                    <span>Currently Attached Images:</span>
                    <span className="text-maroon font-semibold">
                      {attachedImages.length} photo{attachedImages.length === 1 ? "" : "s"} attached
                    </span>
                  </div>

                  {attachedImages.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-2 bg-white rounded-xl border border-primary/10 max-h-36 overflow-y-auto">
                      {attachedImages.map((imgUrl, idx) => (
                        <div
                          key={`${imgUrl}-${idx}`}
                          className="relative w-14 h-14 rounded-lg overflow-hidden border border-primary/20 shrink-0 group bg-cream"
                        >
                          <Image
                            src={imgUrl}
                            alt={`Preview ${idx + 1}`}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeAttachedImage(imgUrl)}
                            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center text-[10px] hover:bg-rose-600 transition-colors opacity-90 group-hover:opacity-100"
                            title="Remove image"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-white/70 rounded-xl border border-dashed border-primary/15 text-center text-[11px] text-charcoal/50">
                      No photos selected yet. Use the tabs above to select from Store Gallery, upload, or paste URLs.
                    </div>
                  )}
                </div>
              </div>

              {/* Form Submission Actions */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-primary/10">
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold" disabled={submitting}>
                  {submitting ? "Saving Product..." : "Create Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-primary/20 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-charcoal font-heading">Delete Product</h3>
                <p className="text-xs text-charcoal/60">Remove this item from your active catalog.</p>
              </div>
            </div>

            <div className="bg-[#fbf8f4] p-3.5 rounded-2xl border border-primary/10 text-xs space-y-1">
              <div className="font-semibold text-charcoal">{productToDelete.name}</div>
              <div className="text-charcoal/60 flex items-center gap-2">
                <span>SKU: {productToDelete.sku}</span>
                <span>•</span>
                <span>{formatPrice(productToDelete.price)}</span>
                <span>•</span>
                <span>Stock: {productToDelete.stock}</span>
              </div>
            </div>

            <p className="text-xs text-charcoal/70 leading-relaxed">
              Are you sure you want to delete this piece? If this product is part of past customer orders, it will be safely deactivated and archived instead of deleted to protect order and invoice records.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Confirm Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
