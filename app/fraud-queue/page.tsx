"use client";

import { useEffect, useState } from "react";

type FraudRow = {
  order_id: number;
  order_datetime: string;
  order_total: number;
  payment_method: string;
  ip_country: string;
  customer_name: string;
  customer_segment: string;
  fraud_probability: number;
  predicted_fraud: number;
  prediction_timestamp: string;
};

export default function FraudQueuePage() {
  const [rows, setRows] = useState<FraudRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [scoreMsg, setScoreMsg] = useState("");

  function loadQueue() {
    setLoading(true);
    fetch("/api/fraud-queue")
      .then((r) => r.json())
      .then((data) => {
        setRows(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadQueue();
  }, []);

  async function runScoring() {
    setScoring(true);
    setScoreMsg("");
    try {
      const res = await fetch("/api/run-scoring", { method: "POST" });
      const data = await res.json();
      setScoreMsg(data.message ?? "Scoring complete.");
      loadQueue();
    } catch {
      setScoreMsg("Failed to reach scoring API.");
    } finally {
      setScoring(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Fraud Review Queue</h1>
        <button
          onClick={runScoring}
          disabled={scoring}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 text-sm"
        >
          {scoring ? "Scoring..." : "Run Scoring"}
        </button>
      </div>

      {scoreMsg && (
        <p className="text-sm mb-3 text-slate-600 bg-slate-100 border border-slate-200 rounded px-3 py-2">
          {scoreMsg}
        </p>
      )}

      <p className="text-slate-600 text-sm mb-4">
        Top 50 orders predicted as fraudulent, sorted by probability (highest first).
      </p>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-slate-500">No fraud predictions found. Run scoring to generate predictions.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left">Order</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Customer</th>
                <th className="px-3 py-2 text-left">Segment</th>
                <th className="px-3 py-2 text-left">Payment</th>
                <th className="px-3 py-2 text-left">Country</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Fraud Prob</th>
                <th className="px-3 py-2 text-left">Scored At</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.order_id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{r.order_id}</td>
                  <td className="px-3 py-2">{new Date(r.order_datetime).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{r.customer_name}</td>
                  <td className="px-3 py-2">{r.customer_segment}</td>
                  <td className="px-3 py-2">{r.payment_method}</td>
                  <td className="px-3 py-2">{r.ip_country}</td>
                  <td className="px-3 py-2 text-right">${Number(r.order_total).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-red-600">
                    {(r.fraud_probability * 100).toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {new Date(r.prediction_timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
