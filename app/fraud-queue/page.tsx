"use client";

import { useEffect, useState } from "react";

const RAILWAY_URL = "https://mlprojectpipeline-production.up.railway.app";

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

function riskColor(prob: number) {
  if (prob > 0.7) return "bg-red-50 border-l-4 border-l-red-500";
  if (prob > 0.4) return "bg-yellow-50 border-l-4 border-l-yellow-500";
  return "bg-green-50 border-l-4 border-l-green-500";
}

function riskBadge(prob: number) {
  if (prob > 0.7) return "bg-red-100 text-red-800";
  if (prob > 0.4) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
}

export default function FraudQueuePage() {
  const [rows, setRows] = useState<FraudRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [scoreMsg, setScoreMsg] = useState("");
  const [scoreSuccess, setScoreSuccess] = useState<boolean | null>(null);

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
    setScoreSuccess(null);
    try {
      const res = await fetch(`${RAILWAY_URL}/score`, { method: "POST" });
      const data = await res.json();
      setScoreSuccess(data.success ?? false);
      if (data.success) {
        setScoreMsg(`Scoring complete in ${((data.duration_ms ?? 0) / 1000).toFixed(1)}s.`);
      } else {
        setScoreMsg(`Scoring failed: ${data.stderr ?? "Unknown error"}`);
      }
      loadQueue();
    } catch {
      setScoreMsg("Failed to reach scoring API. This can take 60-90 seconds — please try again.");
      setScoreSuccess(false);
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
          {scoring ? "Scoring (this may take 60s)..." : "Run Scoring"}
        </button>
      </div>

      {scoreMsg && (
        <div className={`text-sm mb-3 rounded px-3 py-2 border ${
          scoreSuccess === true
            ? "bg-green-50 border-green-200 text-green-800"
            : scoreSuccess === false
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-slate-100 border-slate-200 text-slate-600"
        }`}>
          {scoreMsg}
        </div>
      )}

      <p className="text-slate-600 text-sm mb-4">
        Top 50 unfulfilled orders sorted by fraud probability (highest risk first).
      </p>

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-slate-500">No fraud predictions found. Click &quot;Run Scoring&quot; to generate predictions.</p>
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
                <th className="px-3 py-2 text-center">Predicted</th>
                <th className="px-3 py-2 text-left">Scored At</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.order_id} className={`border-t border-slate-100 ${riskColor(r.fraud_probability)}`}>
                  <td className="px-3 py-2">{r.order_id}</td>
                  <td className="px-3 py-2">{new Date(r.order_datetime).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{r.customer_name}</td>
                  <td className="px-3 py-2">{r.customer_segment}</td>
                  <td className="px-3 py-2">{r.payment_method}</td>
                  <td className="px-3 py-2">{r.ip_country}</td>
                  <td className="px-3 py-2 text-right">${Number(r.order_total).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${riskBadge(r.fraud_probability)}`}>
                      {(r.fraud_probability * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {r.predicted_fraud ? (
                      <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded">Yes</span>
                    ) : (
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">No</span>
                    )}
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
