import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { fetchMetaData } from "@/lib/meta-api";
import { buildMetaUserMessage, SYSTEM_PROMPT } from "@/lib/meta-prompt";
import type { AnalysisResult } from "@/lib/types";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY ?? "" });

export async function POST(req: NextRequest) {
  try {
    const { token, accountId } = await req.json();

    if (!token || !accountId) {
      return NextResponse.json(
        { error: "Access token and account ID are required." },
        { status: 400 }
      );
    }

    // Fetch real data from Meta Marketing API
    let metaData;
    try {
      metaData = await fetchMetaData(token, accountId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch Meta data";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const userMessage = buildMetaUserMessage(metaData);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userMessage,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    let rawText = (response.text ?? "").trim();
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
