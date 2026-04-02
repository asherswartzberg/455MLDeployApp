import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data: predictions, error: predErr } = await supabase
    .from("order_predictions")
    .select("order_id, fraud_probability, predicted_fraud, prediction_timestamp")
    .order("fraud_probability", { ascending: false })
    .limit(50);

  if (predErr) {
    return NextResponse.json({ error: predErr.message }, { status: 500 });
  }

  if (!predictions || predictions.length === 0) {
    return NextResponse.json([]);
  }

  const orderIds = predictions.map((p) => p.order_id);

  const { data: orders } = await supabase
    .from("orders")
    .select("order_id, customer_id, order_datetime, order_total, payment_method, ip_country, fulfilled")
    .in("order_id", orderIds);

  const unfulfilledOrderIds = new Set(
    (orders ?? []).filter((o) => o.fulfilled === 0).map((o) => o.order_id)
  );

  const customerIds = [...new Set((orders ?? []).map((o) => o.customer_id))];

  const { data: customers } = await supabase
    .from("customers")
    .select("customer_id, full_name, customer_segment")
    .in("customer_id", customerIds);

  const orderMap = new Map((orders ?? []).map((o) => [o.order_id, o]));
  const custMap = new Map((customers ?? []).map((c) => [c.customer_id, c]));

  const rows = predictions
    .filter((p) => unfulfilledOrderIds.has(p.order_id))
    .map((p) => {
      const o = orderMap.get(p.order_id);
      const c = o ? custMap.get(o.customer_id) : null;
      return {
        order_id: p.order_id,
        order_datetime: o?.order_datetime ?? "",
        order_total: o?.order_total ?? 0,
        payment_method: o?.payment_method ?? "",
        ip_country: o?.ip_country ?? "",
        customer_name: c?.full_name ?? "Unknown",
        customer_segment: c?.customer_segment ?? "",
        fraud_probability: p.fraud_probability,
        predicted_fraud: p.predicted_fraud,
        prediction_timestamp: p.prediction_timestamp,
      };
    });

  return NextResponse.json(rows);
}
