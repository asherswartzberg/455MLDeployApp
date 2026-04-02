"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Customer = {
  customer_id: number;
  full_name: string;
  customer_segment: string;
  loyalty_tier: string;
};

export default function SelectCustomerPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      });
  }, []);

  const filtered = customers.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase())
  );

  async function selectCustomer(id: number) {
    document.cookie = `customer_id=${id}; path=/; max-age=${60 * 60 * 24 * 30}`;
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Select a Customer</h1>
      <p className="text-slate-600 mb-4">
        Choose a customer to act as. No login required for this demo.
      </p>
      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md border border-slate-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-slate-400"
      />
      {loading ? (
        <p className="text-slate-500">Loading customers...</p>
      ) : (
        <div className="grid gap-2 max-w-2xl">
          {filtered.map((c) => (
            <button
              key={c.customer_id}
              onClick={() => selectCustomer(c.customer_id)}
              className="text-left border border-slate-200 rounded p-3 hover:bg-slate-100 transition-colors flex justify-between items-center"
            >
              <div>
                <span className="font-medium">{c.full_name}</span>
                <span className="text-slate-500 text-sm ml-2">
                  ID: {c.customer_id}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {c.customer_segment} &middot; {c.loyalty_tier}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-slate-500">No customers found.</p>
          )}
        </div>
      )}
    </div>
  );
}
