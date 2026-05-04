import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { fetchMetaData } from "@/lib/meta-api";
import { buildMetaUserMessage, SYSTEM_PROMPT } from "@/lib/meta-prompt";
import type { AnalysisResult } from "@/lib/types";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY ?? "" });

async function generateWithRetry(contents: string, retries = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: { systemInstruction: SYSTEM_PROMPT },
      });
      return (response.text ?? "").trim();
    } catch (err) {
      const isRetryable =
        err instanceof Error &&
        (err.message.includes("503") || err.message.includes("UNAVAILABLE") || err.message.includes("overloaded"));
      if (!isRetryable || attempt === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw new Error("Max retries exceeded");
}

export async function POST(req: NextRequest) {
  try {
    const { token, accountId } = await req.json();

    if (!token || !accountId) {
      return NextResponse.json(
        { error: "Access token and account ID are required." },
        { status: 400 }
      );
    }

    let metaData;
    try {
      metaData = await fetchMetaData(token, accountId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch Meta data";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const userMessage = buildMetaUserMessage(metaData);

    let rawText = await generateWithRetry(userMessage);
    rawText = rawText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");

    const result: AnalysisResult = JSON.parse(rawText);

    return NextResponse.json({
      result,
      account: {
        name: metaData.account.name,
        id: metaData.account.id,
        currency: metaData.account.currency,
        campaigns: metaData.campaigns.length,
        adsets: metaData.adsets.length,
        ads: metaData.ads.length,
        spend: metaData.accountInsights?.spend,
        fetchedAt: metaData.fetchedAt,
      },
    });
  } catch (error) {
    console.error("Meta analyze error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse analysis. Please try again." },
        { status: 500 }
      );
    }

    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Analysis failed: ${msg}` },
      { status: 500 }
    );
  }
}
