export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  compareAt?: number;
  rating: number;
  reviews: number;
  stock: number;
  isFeatured?: boolean;
  isNew?: boolean;
  occasion: "Bridal" | "Festive" | "Daily" | "Heritage";
  metal: "Gold Finish" | "Gold Plated" | "Oxidised" | "Artificial";
  images: string[];
};

export type Category = {
  name: string;
  slug: string;
  description: string;
  image: string;
};

export type CartLine = {
  productId: string;
  quantity: number;
};
