import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { buildUserMessage, SYSTEM_PROMPT } from "@/lib/prompt";
import type { AdMetrics, AnalysisResult } from "@/lib/types";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY ?? "" });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const metrics: AdMetrics = body.metrics;

    if (!metrics) {
      return NextResponse.json({ error: "Missing metrics data" }, { status: 400 });
    }

    const userMessage = buildUserMessage(metrics);

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: userMessage,
      config: { systemInstruction: SYSTEM_PROMPT },
    });

    let rawText = (response.text ?? "").trim();
    rawText = rawText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");

    const result: AnalysisResult = JSON.parse(rawText);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("Analysis error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse analysis response. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Analysis failed. Please check your API key and try again." },
      { status: 500 }
    );
  }
}
