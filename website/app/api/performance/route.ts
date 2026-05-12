import { NextRequest, NextResponse } from "next/server";
import { fetchDailyAdsInsights, fetchOrganicData } from "@/lib/meta-api";
import { getClientForAccount } from "@/lib/clients";
import type { PerformanceData, DailyMetric } from "@/lib/types";
import type { PageInsightValue, DateRange } from "@/lib/meta-api";

function extractDailySeries(insights: PageInsightValue[], metricName: string): DailyMetric[] {
  const item = insights.find((i) => i.name === metricName);
  if (!item) return [];
  return item.values
    .filter((v) => typeof v.value === "number")
    .map((v) => ({
      date: v.end_time.slice(0, 10),
      value: v.value as number,
    }));
}

export async function POST(req: NextRequest) {
  try {
    const { accountId, dateRange } = await req.json();
    const token = process.env.META_SYSTEM_TOKEN;

    if (!token) return NextResponse.json({ error: "META_SYSTEM_TOKEN not configured." }, { status: 500 });
    if (!accountId) return NextResponse.json({ error: "Account ID is required." }, { status: 400 });

    const client = getClientForAccount(accountId);

    const [dailyAds, organic] = await Promise.all([
      fetchDailyAdsInsights(token, accountId, dateRange as DateRange | undefined),
      client?.facebookPageId && client?.instagramAccountId
        ? fetchOrganicData(token, client.facebookPageId, client.instagramAccountId, dateRange as DateRange | undefined)
        : Promise.resolve(null),
    ]);

    const performance: PerformanceData = {
      ads: {
        spend:       dailyAds.map((d) => ({ date: d.date_start, value: parseFloat(d.spend ?? "0") })),
        impressions: dailyAds.map((d) => ({ date: d.date_start, value: parseInt(d.impressions ?? "0") })),
        clicks:      dailyAds.map((d) => ({ date: d.date_start, value: parseInt(d.clicks ?? "0") })),
        ctr:         dailyAds.map((d) => ({ date: d.date_start, value: parseFloat(d.ctr ?? "0") * 100 })),
        cpm:         dailyAds.map((d) => ({ date: d.date_start, value: parseFloat(d.cpm ?? "0") })),
        frequency:   dailyAds.map((d) => ({ date: d.date_start, value: parseFloat(d.frequency ?? "0") })),
      },
      organic: organic
        ? {
            fb: {
              reach:      extractDailySeries(organic.pageInsights, "page_impressions_unique"),
              engagements:extractDailySeries(organic.pageInsights, "page_post_engagements"),
            },
            ig: {
              reach:        extractDailySeries(organic.igInsights, "reach"),
              followerCount:extractDailySeries(organic.igInsights, "follower_count"),
            },
          }
        : { fb: { reach: [], engagements: [] }, ig: { reach: [], followerCount: [] } },
    };

    return NextResponse.json({ performance });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Performance fetch failed: ${msg}` }, { status: 500 });
  }
}
