"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  product_id: number;
  category: string;
  price: number;
};

type LineItem = {
  product_id: number;
  quantity: number;
};

export default function PlaceOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<LineItem[]>([{ product_id: 0, quantity: 1 }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  function addLine() {
    setItems([...items, { product_id: 0, quantity: 1 }]);
  }

  function removeLine(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  function updateLine(i: number, field: keyof LineItem, value: number) {
    const copy = [...items];
    copy[i] = { ...copy[i], [field]: value };
    setItems(copy);
  }

  function getTotal() {
    return items.reduce((sum, li) => {
      const p = products.find((pr) => pr.product_id === li.product_id);
      return sum + (p ? p.price * li.quantity : 0);
    }, 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const validItems = items.filter((li) => li.product_id > 0 && li.quantity > 0);
    if (validItems.length === 0) {
      setError("Add at least one item.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: validItems }),
    });
    if (res.ok) {
      router.push("/orders");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to place order.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Place Order</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <table className="w-full text-sm border border-slate-200 mb-4">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-left w-24">Qty</th>
              <th className="px-3 py-2 text-right w-24">Price</th>
              <th className="px-3 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((li, i) => {
              const p = products.find((pr) => pr.product_id === li.product_id);
              return (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <select
                      value={li.product_id}
                      onChange={(e) => updateLine(i, "product_id", Number(e.target.value))}
                      className="border border-slate-300 rounded px-2 py-1 w-full"
                    >
                      <option value={0}>-- select --</option>
                      {products.map((pr) => (
                        <option key={pr.product_id} value={pr.product_id}>
                          {pr.category} (#{pr.product_id}) - ${pr.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      value={li.quantity}
                      onChange={(e) => updateLine(i, "quantity", Number(e.target.value))}
                      className="border border-slate-300 rounded px-2 py-1 w-full"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    ${p ? (p.price * li.quantity).toFixed(2) : "0.00"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeLine(i)} className="text-red-500 hover:text-red-700">
                        &times;
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={addLine}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add another item
          </button>
          <p className="font-semibold">Total: ${getTotal().toFixed(2)}</p>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-slate-800 text-white px-6 py-2 rounded hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? "Placing..." : "Place Order"}
        </button>
      </form>
    </div>
  );
}
