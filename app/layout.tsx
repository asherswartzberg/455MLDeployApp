import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fraud Detection App",
  description: "Order tracking and ML fraud detection pipeline",
};

const navLinks = [
  { href: "/", label: "Select Customer" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/place-order", label: "Place Order" },
  { href: "/orders", label: "Order History" },
  { href: "/fraud-queue", label: "Fraud Queue" },
];

async function getCustomerName(customerId: string | undefined) {
  if (!customerId) return null;
  const { data } = await supabase
    .from("customers")
    .select("full_name")
    .eq("customer_id", Number(customerId))
    .single();
  return data?.full_name ?? null;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customer_id")?.value;
  const customerName = await getCustomerName(customerId);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="bg-slate-800 text-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold tracking-tight">
              FraudWatch
            </Link>
            <nav className="flex gap-4 text-sm">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-slate-300 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          {customerName && (
            <div className="bg-slate-700 text-slate-300 text-xs text-center py-1">
              Acting as: <span className="font-semibold text-white">{customerName}</span>
              {" "}(ID: {customerId})
            </div>
          )}
        </header>
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
