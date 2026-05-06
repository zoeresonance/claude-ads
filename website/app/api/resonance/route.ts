import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { fetchMetaData, fetchOrganicData } from "@/lib/meta-api";
import { buildResonanceUserMessage, RESONANCE_SYSTEM_PROMPT } from "@/lib/resonance-prompt";
import { getClientForAccount, readAuditDoc } from "@/lib/clients";
import type { ResonanceResult } from "@/lib/types";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY ?? "" });

async function generateWithRetry(contents: string, retries = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction: RESONANCE_SYSTEM_PROMPT,
          maxOutputTokens: 65536,
          thinkingConfig: { thinkingBudget: 0 },
        },
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
    const { accountId, dateRange } = await req.json();
    const token = process.env.META_SYSTEM_TOKEN;

    if (!token) {
      return NextResponse.json({ error: "META_SYSTEM_TOKEN is not configured." }, { status: 500 });
    }
    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required." }, { status: 400 });
    }

    const client = getClientForAccount(accountId);
    if (!client) {
      return NextResponse.json(
        { error: "No client config found for this account. Add a config in website/clients/." },
        { status: 404 }
      );
    }
    if (!client.facebookPageId || !client.instagramAccountId) {
      return NextResponse.json(
        { error: `Client "${client.name}" is missing facebookPageId or instagramAccountId in config.json.` },
        { status: 422 }
      );
    }

    const auditDoc = readAuditDoc(client);
    if (!auditDoc || auditDoc.length < 100) {
      return NextResponse.json(
        { error: `Audit document for "${client.name}" is missing or too short. Add it to website/clients/${client.name}/audit.md.` },
        { status: 422 }
      );
    }

    // Fetch ad data + organic data in parallel
    const [adData, organic] = await Promise.all([
      fetchMetaData(token, accountId, dateRange).catch((err) => {
        throw new Error(`Ad data: ${err instanceof Error ? err.message : "fetch failed"}`);
      }),
      fetchOrganicData(token, client.facebookPageId, client.instagramAccountId, dateRange).catch((err) => {
        throw new Error(`Organic data: ${err instanceof Error ? err.message : "fetch failed"}`);
      }),
    ]);

    const userMessage = buildResonanceUserMessage(auditDoc, organic, adData);

    let rawText = await generateWithRetry(userMessage);
    rawText = rawText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "");

    const result: ResonanceResult = JSON.parse(rawText);
    return NextResponse.json({ result, clientName: client.name });
  } catch (error) {
    console.error("Resonance error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse resonance analysis. Please try again." },
        { status: 500 }
      );
    }

    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Resonance analysis failed: ${msg}` }, { status: 500 });
  }
}
