"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  FolderTree,
  Layers,
  Loader2,
  Package,
  Plus,
  Search,
  Tag,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { compressImageToWebP, formatFileSize } from "@/lib/image-compressor";

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  active: boolean;
  position: number;
  parent?: { id: string; name: string; slug: string } | null;
  children?: Array<{ id: string; name: string; slug: string }>;
  _count: {
    products: number;
  };
};

export function CategoriesManager({
  initialCategories
}: {
  initialCategories: AdminCategory[];
}) {
  const [categories, setCategories] = useState<AdminCategory[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "TOP_LEVEL" | "SUBCATEGORY" | "ACTIVE">("ALL");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newParentId, setNewParentId] = useState<string>("");
  const [newImage, setNewImage] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editParentId, setEditParentId] = useState<string>("");
  const [editImage, setEditImage] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete State
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  async function handleCategoryImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const comp = await compressImageToWebP(file, {
        maxDimension: 1200,
        quality: 0.85
      });
      const fd = new FormData();
      fd.append("files", comp.file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd
      });
      const data = await res.json();
      if (res.ok && data.urls?.[0]) {
        if (isEdit) {
          setEditImage(data.urls[0]);
        } else {
          setNewImage(data.urls[0]);
        }
        toast.success(
          `⚡ Auto-compressed category icon: ${formatFileSize(comp.originalSize)} ➔ ${formatFileSize(comp.compressedSize)} (${comp.savedPercent}% saved)`
        );
      } else {
        toast.error("Failed to upload category icon.");
      }
    } catch {
      toast.error("Failed to compress or upload image.");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  }

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.active).length;
    const topLevel = categories.filter((c) => !c.parentId).length;
    const subcats = categories.filter((c) => Boolean(c.parentId)).length;
    const totalProducts = categories.reduce((sum, c) => sum + c._count.products, 0);
    return { total, active, topLevel, subcats, totalProducts };
  }, [categories]);

  // Filtered List
  const filtered = useMemo(() => {
    return categories.filter((c) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.parent && c.parent.name.toLowerCase().includes(q));

      let matchFilter = true;
      if (filterType === "TOP_LEVEL") matchFilter = !c.parentId;
      else if (filterType === "SUBCATEGORY") matchFilter = Boolean(c.parentId);
      else if (filterType === "ACTIVE") matchFilter = c.active;

      return matchSearch && matchFilter;
    });
  }, [categories, search, filterType]);

  // Toggle Category Active Status
  async function toggleActive(id: string, current: boolean) {
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !current })
      });
      if (!res.ok) throw new Error("Failed to update status");
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, active: !current } : c))
      );
      toast.success(!current ? "Category visible on store" : "Category hidden from store");
    } catch {
      toast.error("Failed to update category visibility");
    }
  }

  // Handle Create Category
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const slug = (newSlug || newName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          slug,
          parentId: newParentId || null,
          image: newImage || null,
          description: newDesc || null,
          active: true
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create category");

      setCategories((prev) => [...prev, data.category]);
      toast.success(`Category "${newName}" created successfully.`);
      setIsCreateOpen(false);
      setNewName("");
      setNewSlug("");
      setNewParentId("");
      setNewImage("");
      setNewDesc("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error creating category");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Open Edit Modal
  function startEdit(category: AdminCategory) {
    setEditingCategory(category);
    setEditName(category.name);
    setEditSlug(category.slug);
    setEditParentId(category.parentId || "");
    setEditImage(category.image || "");
    setEditDesc(category.description || "");
  }

  // Handle Save Edit
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategory) return;
    setIsSavingEdit(true);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editName,
          slug: editSlug,
          parentId: editParentId || null,
          image: editImage || null,
          description: editDesc || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update category");

      setCategories((prev) =>
        prev.map((c) => (c.id === editingCategory.id ? { ...c, ...data.category } : c))
      );
      toast.success(`Category "${editName}" updated.`);
      setEditingCategory(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error saving category");
    } finally {
      setIsSavingEdit(false);
    }
  }

  // Handle Delete Category
  async function handleDelete() {
    if (!categoryToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(categoryToDelete.id)}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete category");
      }

      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      toast.success(data.message || `Deleted category "${categoryToDelete.name}"`);
      setCategoryToDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error deleting category");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Metrics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-primary/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-maroon/10 text-maroon flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-charcoal/60">Total Categories</div>
            <div className="text-xl font-bold font-heading text-maroon">{metrics.total}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-emerald-700/80">Active on Store</div>
            <div className="text-xl font-bold font-heading text-emerald-800">{metrics.active}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-amber-700/80">Subcategories</div>
            <div className="text-xl font-bold font-heading text-amber-800">{metrics.subcats}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-primary/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/20 text-maroon flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-charcoal/60">Assigned Pieces</div>
            <div className="text-xl font-bold font-heading text-charcoal">{metrics.totalProducts}</div>
          </div>
        </div>
      </div>

      {/* 2. Controls & Search */}
      <div className="bg-white p-4 rounded-2xl border border-primary/10 shadow-xs flex flex-col md:flex-row gap-3.5 justify-between items-center">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category or slug..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#fbf8f4] p-1 rounded-xl border border-primary/10 text-xs">
            {(["ALL", "TOP_LEVEL", "SUBCATEGORY", "ACTIVE"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  filterType === t
                    ? "bg-maroon text-white shadow-xs"
                    : "text-charcoal/70 hover:text-charcoal"
                }`}
              >
                {t === "ALL"
                  ? "All"
                  : t === "TOP_LEVEL"
                  ? "Top Level"
                  : t === "SUBCATEGORY"
                  ? "Subcategories"
                  : "Active"}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="w-full md:w-auto h-9 bg-maroon hover:bg-maroon-dark text-white text-xs gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {/* 3. Categories Table */}
      <div className="bg-white rounded-2xl border border-primary/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-primary/10 bg-[#fbf8f4] text-charcoal/60 uppercase font-semibold text-[10px] tracking-wider">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Hierarchy Level</th>
                <th className="py-3 px-4 text-center">Assigned Pieces</th>
                <th className="py-3 px-4 text-center">Store Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {filtered.map((cat) => (
                <tr key={cat.id} className="hover:bg-primary/[0.015] transition-colors">
                  {/* Category Name & Thumbnail */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-cream border border-primary/10 shrink-0 relative flex items-center justify-center text-charcoal/40">
                        {cat.image ? (
                          <Image
                            src={cat.image}
                            alt={cat.name}
                            fill
                            className="object-cover"
                            sizes="36px"
                            unoptimized
                          />
                        ) : (
                          <Tag className="w-4 h-4 text-maroon/50" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-charcoal text-xs">{cat.name}</div>
                        {cat.description && (
                          <div className="text-[11px] text-charcoal/50 line-clamp-1 max-w-xs">
                            {cat.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Slug */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-charcoal/70">
                    /{cat.slug}
                  </td>

                  {/* Hierarchy Level */}
                  <td className="py-3.5 px-4">
                    {cat.parent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <FolderTree className="w-3 h-3" />
                        Child of {cat.parent.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-maroon/5 text-maroon border border-maroon/15">
                        Top-Level Collection
                      </span>
                    )}
                  </td>

                  {/* Products Count */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        cat._count.products > 0
                          ? "bg-cream text-maroon border border-gold/30"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {cat._count.products} item{cat._count.products === 1 ? "" : "s"}
                    </span>
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleActive(cat.id, cat.active)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        cat.active
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                      }`}
                    >
                      {cat.active ? (
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
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(cat)}
                        className="h-8 px-2.5 text-xs text-charcoal/70 hover:text-maroon"
                      >
                        Edit
                      </Button>
                      <button
                        type="button"
                        onClick={() => setCategoryToDelete(cat)}
                        title="Delete category"
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-charcoal/50 text-xs">
                    No categories found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Create Category Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-primary/20 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-primary/10">
              <div>
                <h3 className="font-heading text-lg font-bold text-maroon">Add Category / Subcategory</h3>
                <p className="text-xs text-charcoal/60">Create a cultural collection or hierarchy branch.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg text-charcoal/40 hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-charcoal block mb-1">Category Name *</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Traditional Necklaces, Jonbiri, Gamkharu"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-charcoal block mb-1">Slug (optional)</label>
                  <Input
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div>
                  <label className="font-semibold text-charcoal block mb-1">Parent Category</label>
                  <select
                    value={newParentId}
                    onChange={(e) => setNewParentId(e.target.value)}
                    className="w-full h-9 rounded-xl border border-primary/20 bg-white px-3 text-xs font-semibold text-charcoal"
                  >
                    <option value="">Top-Level Category</option>
                    {categories
                      .filter((c) => !c.parentId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Icon / Banner Image</label>
                <div className="flex gap-2">
                  <Input
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="e.g. /images/categories/jonbiri.png or upload file"
                    className="flex-1"
                  />
                  <label className="relative inline-flex items-center justify-center px-3 py-2 bg-cream hover:bg-gold/10 border border-gold/40 text-maroon text-xs font-bold rounded-xl cursor-pointer transition-colors shrink-0">
                    <UploadCloud className="w-4 h-4 mr-1.5" />
                    <span>{isUploadingImage ? "Compressing..." : "Upload & WebP"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={isUploadingImage}
                      onChange={(e) => handleCategoryImageUpload(e, false)}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-primary/20 bg-white p-2.5 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-gold"
                  placeholder="Brief heritage background or buyer guidance for this collection..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-primary/10">
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Save Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-primary/20 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-primary/10">
              <div>
                <h3 className="font-heading text-lg font-bold text-maroon">Edit Category</h3>
                <p className="text-xs text-charcoal/60">Update details for &quot;{editingCategory.name}&quot;.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="p-1.5 rounded-lg text-charcoal/40 hover:text-charcoal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-charcoal block mb-1">Category Name *</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-charcoal block mb-1">Slug</label>
                  <Input
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-charcoal block mb-1">Parent Category</label>
                  <select
                    value={editParentId}
                    onChange={(e) => setEditParentId(e.target.value)}
                    className="w-full h-9 rounded-xl border border-primary/20 bg-white px-3 text-xs font-semibold text-charcoal"
                  >
                    <option value="">Top-Level Category</option>
                    {categories
                      .filter((c) => !c.parentId && c.id !== editingCategory.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Icon / Banner Image</label>
                <div className="flex gap-2">
                  <Input
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    placeholder="/images/... or upload file"
                    className="flex-1"
                  />
                  <label className="relative inline-flex items-center justify-center px-3 py-2 bg-cream hover:bg-gold/10 border border-gold/40 text-maroon text-xs font-bold rounded-xl cursor-pointer transition-colors shrink-0">
                    <UploadCloud className="w-4 h-4 mr-1.5" />
                    <span>{isUploadingImage ? "Compressing..." : "Upload & WebP"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={isUploadingImage}
                      onChange={(e) => handleCategoryImageUpload(e, true)}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="font-semibold text-charcoal block mb-1">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-primary/20 bg-white p-2.5 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-primary/10">
                <Button type="button" variant="ghost" onClick={() => setEditingCategory(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="gold" disabled={isSavingEdit}>
                  {isSavingEdit ? "Saving..." : "Update Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Category Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-primary/20 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-charcoal font-heading">Delete Category</h3>
                <p className="text-xs text-charcoal/60">Remove category from your catalog structure.</p>
              </div>
            </div>

            <div className="bg-[#fbf8f4] p-3.5 rounded-2xl border border-primary/10 text-xs space-y-1">
              <div className="font-semibold text-charcoal">{categoryToDelete.name}</div>
              <div className="text-charcoal/60 flex items-center gap-2">
                <span>Slug: /{categoryToDelete.slug}</span>
                <span>•</span>
                <span>
                  {categoryToDelete._count.products} assigned piece{categoryToDelete._count.products === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            {categoryToDelete._count.products > 0 ? (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-xs space-y-1.5 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Cannot delete active collection:</span> There are currently{" "}
                  <strong>{categoryToDelete._count.products} products</strong> assigned to this category. To protect
                  your store catalog from orphaned products, you must reassign or delete these products first.
                </div>
              </div>
            ) : (
              <p className="text-xs text-charcoal/70 leading-relaxed">
                Are you sure you want to permanently delete category &quot;<strong>{categoryToDelete.name}</strong>&quot;?
                Any subcategories belonging to this category will automatically be moved to the top level.
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCategoryToDelete(null)}
                disabled={isDeleting}
              >
                {categoryToDelete._count.products > 0 ? "Understood" : "Cancel"}
              </Button>
              {categoryToDelete._count.products === 0 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

