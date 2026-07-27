"use client";
import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="container py-12">Loading…</div>}><ResetPasswordForm /></Suspense>;
}

function ResetPasswordForm() {
  const token = useSearchParams().get("token") || "";
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get("password");
    const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    const data = await response.json();
    setDone(response.ok);
    setMessage(response.ok ? "Password changed successfully." : data.error);
  }
  return <div className="container grid min-h-[60vh] place-items-center py-10"><form onSubmit={submit} className="w-full max-w-md rounded-lg bg-white p-6 shadow-luxury"><h1 className="font-heading text-4xl text-maroon">Choose new password</h1>{!done && <><Input className="mt-5" name="password" type="password" minLength={10} required placeholder="At least 10 characters" /><Button className="mt-3 w-full" disabled={!token}>Update password</Button></>}{message && <p className="mt-4 rounded-lg bg-cream p-3 text-sm">{message}</p>}{done && <Link href="/account" className="mt-4 block text-primary">Return to sign in</Link>}</form></div>;
}
