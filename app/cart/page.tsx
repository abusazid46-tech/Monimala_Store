import type { Metadata } from "next";
import { CartView } from "@/components/commerce/cart-view";
import { getCatalogProducts } from "@/lib/catalog-db";

export const metadata: Metadata = {
  title: "Cart"
};

export const revalidate = 60;

export default async function CartPage() {
  return <CartView products={await getCatalogProducts()} />;
}
