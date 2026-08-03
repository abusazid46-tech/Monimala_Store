import type { Category, Product } from "@/lib/types";

const imageBase =
  "https://images.unsplash.com/photo-";

export const categories: Category[] = [
  {
    name: "Assamese Jewellery", slug: "assamese-jewellery", description: "Traditional Assamese designs.", image: "/images/category-placeholder.svg"
  },
  {
    name: "AD Jewellery", slug: "ad-jewellery", description: "Contemporary AD jewellery.", image: "/images/category-placeholder.svg"
  },
  {
    name: "Finger Rings", slug: "finger-rings", description: "Statement and everyday rings.", image: "/images/category-placeholder.svg"
  },
  {
    name: "Hair Accessories", slug: "hair-accessories", description: "Premium hair accessories.", image: "/images/category-placeholder.svg"
  },
  {
    name: "Bangles", slug: "bangles", description: "Bangles in multiple sizes.", image: "/images/category-placeholder.svg"
  },
  {
    name: "Pendant Set", slug: "pendant-set", description: "Pendant and earrings sets.", image: "/images/category-placeholder.svg"
  },
  { name: "Nails", slug: "nails", description: "Press-on nail collections.", image: "/images/category-placeholder.svg" },
  { name: "Earrings", slug: "earrings", description: "Earrings in premium finishes.", image: "/images/category-placeholder.svg" },
  { name: "Gold Plated Jewellery", slug: "gold-plated-jewellery", description: "Gold-plated statement jewellery.", image: "/images/category-placeholder.svg" }
];

const baseProducts: Array<Omit<Product, "colors" | "sizes" | "colorImages" | "position">> = [
  {
    id: "p1",
    name: "Royal Jonbiri Bridal Necklace",
    slug: "royal-jonbiri-bridal-necklace",
    category: "Jonbiri",
    description:
      "A ceremonial Jonbiri necklace with carved moon forms, ruby enamel notes and hand-polished gold finish.",
    price: 5499,
    compareAt: 6999,
    rating: 4.9,
    reviews: 128,
    stock: 14,
    isFeatured: true,
    occasion: "Bridal",
    metal: "Gold Plated",
    images: [
      "/images/monimala-hero.png",
      `${imageBase}1611591437281-460bfbe1220a?auto=format&fit=crop&w=1200&q=90`,
      `${imageBase}1606760227091-3dd870d97f1d?auto=format&fit=crop&w=1200&q=90`
    ]
  },
  {
    id: "p2",
    name: "Gamkharu Heritage Bangle Pair",
    slug: "gamkharu-heritage-bangle-pair",
    category: "Gamkharu",
    description:
      "A sculptural pair of Gamkharu bangles with traditional Assamese relief work and premium clasp comfort.",
    price: 3299,
    compareAt: 3999,
    rating: 4.8,
    reviews: 92,
    stock: 21,
    isFeatured: true,
    occasion: "Heritage",
    metal: "Gold Finish",
    images: [
      `${imageBase}1603974372039-adc49044b6bd?auto=format&fit=crop&w=1200&q=90`,
      `${imageBase}1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=90`
    ]
  },
  {
    id: "p3",
    name: "Lokaparo Gold Drop Earrings",
    slug: "lokaparo-gold-drop-earrings",
    category: "Lokaparo",
    description:
      "Bird-motif Lokaparo earrings with lightweight construction for festive days and long celebrations.",
    price: 1699,
    compareAt: 2199,
    rating: 4.7,
    reviews: 77,
    stock: 36,
    isNew: true,
    occasion: "Festive",
    metal: "Artificial",
    images: [
      `${imageBase}1630019852942-f89202989a59?auto=format&fit=crop&w=1200&q=90`,
      `${imageBase}1615655096345-61a54750068d?auto=format&fit=crop&w=1200&q=90`
    ]
  },
  {
    id: "p4",
    name: "Assamese Bridal Layered Set",
    slug: "assamese-bridal-layered-set",
    category: "Bridal Collection",
    description:
      "A complete bridal edit with necklace, earrings and tikli-inspired detailing for an heirloom look.",
    price: 8999,
    compareAt: 10999,
    rating: 5,
    reviews: 61,
    stock: 8,
    isFeatured: true,
    occasion: "Bridal",
    metal: "Gold Plated",
    images: [
      `${imageBase}1606760227091-3dd870d97f1d?auto=format&fit=crop&w=1200&q=90`,
      `${imageBase}1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1200&q=90`
    ]
  },
  {
    id: "p5",
    name: "Festival Kemp Necklace",
    slug: "festival-kemp-necklace",
    category: "Traditional Necklaces",
    description:
      "A red-and-gold festive necklace made for Bihu, puja styling and cultural gatherings.",
    price: 2499,
    rating: 4.6,
    reviews: 44,
    stock: 25,
    isNew: true,
    occasion: "Festive",
    metal: "Gold Finish",
    images: [
      `${imageBase}1611591437281-460bfbe1220a?auto=format&fit=crop&w=1200&q=90`,
      `${imageBase}1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=90`
    ]
  },
  {
    id: "p6",
    name: "Everyday Pearl Japi Studs",
    slug: "everyday-pearl-japi-studs",
    category: "Earrings",
    description:
      "Minimal pearl studs with subtle japi-inspired curves for modern Assamese everyday wear.",
    price: 999,
    rating: 4.5,
    reviews: 39,
    stock: 54,
    isNew: true,
    occasion: "Daily",
    metal: "Artificial",
    images: [
      `${imageBase}1615655096345-61a54750068d?auto=format&fit=crop&w=1200&q=90`,
      `${imageBase}1630019852942-f89202989a59?auto=format&fit=crop&w=1200&q=90`
    ]
  }
];

export const products: Product[] = baseProducts.map((product, position) => ({
  ...product,
  colors: [],
  sizes: [],
  colorImages: {},
  position
}));

export const reviews = [
  {
    name: "Madhurima D.",
    location: "Guwahati",
    rating: 5,
    body: "The Jonbiri looked regal with my mekhela sador. Packaging felt like a gift box from a premium jewellery house."
  },
  {
    name: "Rima B.",
    location: "London",
    rating: 5,
    body: "Ordered for Bihu abroad. Delivery updates were clear and the finish is beautiful for the price."
  },
  {
    name: "Ankita S.",
    location: "Bengaluru",
    rating: 4,
    body: "The Gamkharu pair is bold but comfortable. Loved the WhatsApp help before purchase."
  }
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function searchProducts(query?: string, filters?: { category?: string; occasion?: string }) {
  return products.filter((product) => {
    const matchesQuery = query
      ? [product.name, product.category, product.description]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())
      : true;
    const matchesCategory = filters?.category
      ? product.category.toLowerCase().includes(filters.category.toLowerCase())
      : true;
    const matchesOccasion = filters?.occasion
      ? product.occasion.toLowerCase() === filters.occasion.toLowerCase()
      : true;
    return matchesQuery && matchesCategory && matchesOccasion;
  });
}
