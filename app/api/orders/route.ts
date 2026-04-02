import { supabase } from "@/lib/supabase";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customer_id")?.value;
  if (!customerId) {
    return NextResponse.json({ error: "No customer selected" }, { status: 401 });
  }

  const { items } = await req.json();
  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items provided" }, { status: 400 });
  }

  const { data: products } = await supabase
    .from("products")
    .select("product_id, price, cost");

  const productMap = new Map(
    (products ?? []).map((p) => [p.product_id, p])
  );

  let orderTotal = 0;
  const lineItems: { product_id: number; quantity: number; unit_price: number; line_total: number }[] = [];

  for (const item of items) {
    const product = productMap.get(item.product_id);
    if (!product) {
      return NextResponse.json({ error: `Product ${item.product_id} not found` }, { status: 400 });
    }
    const lineTotal = product.price * item.quantity;
    orderTotal += lineTotal;
    lineItems.push({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: product.price,
      line_total: lineTotal,
    });
  }

  const shippingFee = 5.99;
  const taxAmount = Math.round(orderTotal * 0.08 * 100) / 100;
  const totalWithExtras = Math.round((orderTotal + shippingFee + taxAmount) * 100) / 100;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      customer_id: Number(customerId),
      order_datetime: new Date().toISOString(),
      order_subtotal: orderTotal,
      shipping_fee: shippingFee,
      tax_amount: taxAmount,
      order_total: totalWithExtras,
      shipping_state: "UT",
      payment_method: "card",
      device_type: "desktop",
      ip_country: "US",
      billing_zip: "00000",
      shipping_zip: "00000",
      promo_used: 0,
      risk_score: 0,
      is_fraud: 0,
      fulfilled: 0,
    })
    .select("order_id")
    .single();

  if (orderErr) {
    return NextResponse.json({ error: orderErr.message }, { status: 500 });
  }

  const orderItemsToInsert = lineItems.map((li) => ({
    order_id: order.order_id,
    product_id: li.product_id,
    quantity: li.quantity,
    unit_price: li.unit_price,
    line_total: li.line_total,
  }));

  const { error: itemsErr } = await supabase
    .from("order_items")
    .insert(orderItemsToInsert);

  if (itemsErr) {
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  return NextResponse.json({ order_id: order.order_id });
}
