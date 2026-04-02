import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customer_id")?.value;
  if (!customerId) redirect("/");

  const id = Number(customerId);

  const { data: customer } = await supabase
    .from("customers")
    .select("customer_id, full_name, gender, customer_segment, loyalty_tier")
    .eq("customer_id", id)
    .single();

  const { data: orders } = await supabase
    .from("orders")
    .select("order_id, order_datetime, order_total, is_fraud")
    .eq("customer_id", id)
    .order("order_datetime", { ascending: false });

  const allOrders = orders ?? [];
  const totalOrders = allOrders.length;
  const totalSpend = allOrders.reduce((s, o) => s + (o.order_total ?? 0), 0);
  const recentOrders = allOrders.slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Customer Dashboard</h1>

      {customer && (
        <div className="bg-white border border-slate-200 rounded p-4 mb-6 max-w-lg">
          <p className="text-lg font-semibold">{customer.full_name}</p>
          <p className="text-sm text-slate-500">
            {customer.customer_segment} &middot; {customer.loyalty_tier} &middot; {customer.gender}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 max-w-lg mb-6">
        <div className="bg-white border border-slate-200 rounded p-4 text-center">
          <p className="text-3xl font-bold">{totalOrders}</p>
          <p className="text-sm text-slate-500">Total Orders</p>
        </div>
        <div className="bg-white border border-slate-200 rounded p-4 text-center">
          <p className="text-3xl font-bold">${totalSpend.toFixed(2)}</p>
          <p className="text-sm text-slate-500">Total Spend</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-2">Recent Orders</h2>
      {recentOrders.length === 0 ? (
        <p className="text-slate-500">No orders yet. <Link href="/place-order" className="text-blue-600 underline">Place one</Link>.</p>
      ) : (
        <table className="w-full max-w-2xl text-sm border border-slate-200">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left">Order ID</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-center">Fraud Flag</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.order_id} className="border-t border-slate-100">
                <td className="px-3 py-2">{o.order_id}</td>
                <td className="px-3 py-2">{new Date(o.order_datetime).toLocaleDateString()}</td>
                <td className="px-3 py-2 text-right">${Number(o.order_total).toFixed(2)}</td>
                <td className="px-3 py-2 text-center">
                  {o.is_fraud ? (
                    <span className="text-red-600 font-semibold">Yes</span>
                  ) : (
                    <span className="text-green-600">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
