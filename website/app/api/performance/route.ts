import { NextRequest, NextResponse } from "next/server";
import { fetchDailyAdsInsights, fetchOrganicData } from "@/lib/meta-api";
import { getClientForAccount } from "@/lib/clients";
import type { PerformanceData, DailyMetric } from "@/lib/types";
import type { PageInsightValue, DateRange } from "@/lib/meta-api";

const META_BASE = "https://graph.facebook.com/v21.0";

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

async function probeInsightsError(token: string, pageId: string): Promise<string> {
  try {
    const params = new URLSearchParams({
      metric: "page_reach",
      period: "day",
      since: String(Math.floor(Date.now() / 1000) - 86400 * 7),
      until: String(Math.floor(Date.now() / 1000)),
      access_token: token,
    });
    const res = await fetch(`${META_BASE}/${pageId}/insights?${params}`);
    const json = await res.json();
    if (json.error) return `Meta API error: ${json.error.message} (code ${json.error.code})`;
    const metrics = json.data?.length ?? 0;
    const points = json.data?.[0]?.values?.length ?? 0;
    const first = json.data?.[0]?.values?.[0];
    if (metrics === 0) return "API returned 0 metrics — page may have no insights data or the page ID is incorrect.";
    return `Debug: ${metrics} metric(s), ${points} data point(s). First value: ${JSON.stringify(first?.value)} (type: ${typeof first?.value}) at ${first?.end_time}`;
  } catch (e) {
    return `Probe exception: ${e instanceof Error ? e.message : "unknown"}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { accountId, dateRange } = await req.json();
    const token = process.env.META_SYSTEM_TOKEN;

    if (!token) return NextResponse.json({ error: "META_SYSTEM_TOKEN not configured." }, { status: 500 });
    if (!accountId) return NextResponse.json({ error: "Account ID is required." }, { status: 400 });

    const client = getClientForAccount(accountId);

    // Fetch daily ads data + organic data in parallel (organic only if client config exists)
    const [dailyAds, organic] = await Promise.all([
      fetchDailyAdsInsights(token, accountId, dateRange as DateRange | undefined),
      client?.facebookPageId && client?.instagramAccountId
        ? fetchOrganicData(token, client.facebookPageId, client.instagramAccountId, dateRange as DateRange | undefined)
        : Promise.resolve(null),
    ]);

    // If page insights are empty, probe the API to get diagnostic info
    let organicError: string | null = null;
    if (organic && organic.pageInsights.length === 0 && client?.facebookPageId) {
      organicError = await probeInsightsError(token, client.facebookPageId);
    }

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
              reach:        extractDailySeries(organic.pageInsights, "page_reach"),
              impressions:  extractDailySeries(organic.pageInsights, "page_impressions"),
              engagements:  extractDailySeries(organic.pageInsights, "page_post_engagements"),
              engagedUsers: extractDailySeries(organic.pageInsights, "page_engaged_users"),
              newFollowers: extractDailySeries(organic.pageInsights, "page_fan_adds_unique"),
            },
            ig: {
              reach:          extractDailySeries(organic.igInsights, "reach"),
              impressions:    extractDailySeries(organic.igInsights, "impressions"),
              accountsEngaged:extractDailySeries(organic.igInsights, "accounts_engaged"),
              profileViews:   extractDailySeries(organic.igInsights, "profile_views"),
              follows:        extractDailySeries(organic.igInsights, "follows"),
            },
          }
        : { fb: { reach: [], impressions: [], engagements: [], engagedUsers: [], newFollowers: [] }, ig: { reach: [], impressions: [], accountsEngaged: [], profileViews: [], follows: [] } },
    };

    return NextResponse.json({ performance, organicError });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Performance fetch failed: ${msg}` }, { status: 500 });
  }
}
