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
  occasion: string;
  metal: string;
  youtubeUrl?: string;
  images: string[];
  colors: string[];
  sizes: string[];
  colorImages: Record<string, string>;
  position: number;
};

export type Category = {
  name: string;
  slug: string;
  description: string;
  image: string;
  position?: number;
};

export type CartLine = {
  productId: string;
  quantity: number;
  color?: string;
  size?: string;
};
