"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Customer = { name: string; email: string; phone?: string | null; orders: { id: string; trackingCode: string; total: number; status: string }[] };

export function AccountClient() {
  const [user, setUser] = useState<Customer | null | undefined>(undefined);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const load = () => fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json()).then((data) => setUser(data.user));
  useEffect(() => { void load(); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return toast.error(data.error || "Unable to continue.");
    toast.success(mode === "login" ? "Welcome back" : "Account created"); await load();
  }

  if (user === undefined) return <div className="container min-h-[55vh] py-12">Loading your account…</div>;
  if (user) return <div className="container py-10"><div className="rounded-lg bg-white p-6 shadow-luxury"><p className="text-sm font-semibold uppercase tracking-widest text-gold-deep">Customer Account</p><h1 className="mt-2 font-heading text-4xl text-maroon">Welcome, {user.name}</h1><p className="mt-2 text-charcoal/60">{user.email}</p><div className="mt-8"><h2 className="font-heading text-2xl text-maroon">Recent orders</h2>{user.orders.length ? <div className="mt-3 grid gap-3">{user.orders.map((order) => <div key={order.id} className="flex justify-between rounded-lg bg-cream p-4"><span>{order.trackingCode}</span><strong>{order.status}</strong></div>)}</div> : <p className="mt-2 text-charcoal/60">No orders yet.</p>}</div><Button className="mt-8" variant="outline" onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});setUser(null)}}>Sign out</Button></div></div>;

  return <div className="container grid gap-8 py-10 lg:grid-cols-2"><section><p className="text-sm font-semibold uppercase tracking-widest text-gold-deep">Customer Account</p><h1 className="mt-3 font-heading text-5xl text-maroon">Your jewellery, orders and wishlist in one place.</h1><p className="mt-4 text-charcoal/65">Create a customer account or sign in securely. The store administration is operated separately and is never exposed here.</p></section><section className="rounded-lg bg-white p-6 shadow-luxury"><div className="mb-5 grid grid-cols-2 rounded-full bg-cream p-1"><button className={`rounded-full p-2 ${mode==='login'?'bg-primary text-white':''}`} onClick={()=>setMode('login')}>Sign in</button><button className={`rounded-full p-2 ${mode==='register'?'bg-primary text-white':''}`} onClick={()=>setMode('register')}>Create account</button></div><form className="grid gap-3" onSubmit={submit}>{mode==='register'&&<><Input name="name" placeholder="Full name" minLength={2} required/><Input name="phone" placeholder="Phone number"/></>}<Input name="email" type="email" placeholder="Email address" required/><Input name="password" type="password" placeholder="Password" minLength={mode==='register'?8:1} required/><Button disabled={busy}>{busy?'Please wait…':mode==='login'?'Sign in':'Create account'}</Button></form>{mode==='login'&&<Link href="/account/forgot-password" className="mt-4 block text-center text-sm text-primary hover:underline">Forgot password?</Link>}</section></div>;
}
