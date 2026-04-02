import { NextResponse } from "next/server";

export async function POST() {
  const railwayUrl = process.env.RAILWAY_API_URL;

  if (!railwayUrl) {
    return NextResponse.json({
      message: "RAILWAY_API_URL not configured. Scoring service unavailable.",
    });
  }

  try {
    const res = await fetch(`${railwayUrl}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({
        message: `Scoring API returned ${res.status}: ${text}`,
      });
    }

    const data = await res.json();
    return NextResponse.json({
      message: `Scoring complete. ${data.scored ?? data.count ?? ""} orders processed.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({
      message: `Could not reach scoring API: ${msg}`,
    });
  }
}
