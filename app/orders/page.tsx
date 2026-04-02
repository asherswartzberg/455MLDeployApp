import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default async function OrderHistoryPage() {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customer_id")?.value;
  if (!customerId) redirect("/");

  const id = Number(customerId);

  const { data: orders } = await supabase
    .from("orders")
    .select("order_id, order_datetime, order_total, payment_method, is_fraud")
    .eq("customer_id", id)
    .order("order_datetime", { ascending: false });

  const allOrders = orders ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Order History</h1>
      {allOrders.length === 0 ? (
        <p className="text-slate-500">No orders found for this customer.</p>
      ) : (
        <table className="w-full text-sm border border-slate-200">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left">Order ID</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Payment</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-center">Fraud</th>
            </tr>
          </thead>
          <tbody>
            {allOrders.map((o) => (
              <tr key={o.order_id} className="border-t border-slate-100">
                <td className="px-3 py-2">{o.order_id}</td>
                <td className="px-3 py-2">
                  {new Date(o.order_datetime).toLocaleDateString()}
                </td>
                <td className="px-3 py-2">{o.payment_method}</td>
                <td className="px-3 py-2 text-right">
                  ${Number(o.order_total).toFixed(2)}
                </td>
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
