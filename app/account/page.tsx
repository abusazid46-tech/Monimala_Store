import type { Metadata } from "next";
import { AccountClient } from "@/components/account/account-client";

export const metadata: Metadata = { title: "Customer Account" };
export default function AccountPage() { return <AccountClient />; }
