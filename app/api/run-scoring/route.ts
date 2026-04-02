import { NextResponse } from "next/server";

export const maxDuration = 120;

export async function POST() {
  const railwayUrl = process.env.RAILWAY_API_URL;

  if (!railwayUrl) {
    return NextResponse.json({
      success: false,
      message: "RAILWAY_API_URL not configured. Scoring service unavailable.",
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    const res = await fetch(`${railwayUrl}/score`, {
      method: "POST",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({
        success: false,
        message: `Scoring API returned ${res.status}: ${text}`,
      });
    }

    const data = await res.json();
    return NextResponse.json({
      success: data.success ?? true,
      message: data.success
        ? `Scoring complete in ${((data.duration_ms ?? 0) / 1000).toFixed(1)}s.`
        : `Scoring failed. ${data.stderr ?? ""}`,
      stdout: data.stdout ?? "",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({
      success: false,
      message: `Could not reach scoring API: ${msg}`,
    });
  }
}
