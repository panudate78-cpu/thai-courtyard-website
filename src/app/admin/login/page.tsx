import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAdmin } from "@/lib/auth";
import { getRestaurantConfigSafe } from "@/lib/restaurant";

export const metadata: Metadata = { title: "Staff sign in" };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  const config = await getRestaurantConfigSafe();
  return (
    <main className="brand-pattern grid min-h-svh place-items-center bg-charcoal px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mx-auto w-fit rounded-2xl bg-charcoal p-3">
          <Image src={config.logoUrl} alt={config.name} width={84} height={84} unoptimized className="h-16 w-16 rounded-full object-cover" />
        </div>
        <h1 className="mt-5 text-center font-serif text-3xl font-semibold">Staff sign in</h1>
        <p className="mt-1 text-center text-sm text-black/55">Orders, menu, bookings &amp; settings</p>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-black/45">
          <Link href="/" className="hover:underline">
            ← Back to website
          </Link>
        </p>
      </div>
    </main>
  );
}
