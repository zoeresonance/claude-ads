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
    // Exchange system token for page token first
    const ptRes = await fetch(`${META_BASE}/${pageId}?fields=access_token&access_token=${encodeURIComponent(token)}`);
    const ptJson = await ptRes.json();
    const pageToken: string = ptJson.access_token ?? token;

    const params = new URLSearchParams({
      metric: "page_impressions_unique",
      period: "day",
      since: String(Math.floor(Date.now() / 1000) - 86400 * 7),
      until: String(Math.floor(Date.now() / 1000)),
      access_token: pageToken,
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

    // Diagnose when organic charts will be empty (regardless of reason)
    let organicError: string | null = null;
    if (organic && client?.facebookPageId) {
      const fbReach = extractDailySeries(organic.pageInsights, "page_impressions_unique");
      if (fbReach.length === 0) {
        if (organic.pageInsights.length === 0) {
          // API returned no metric objects at all
          organicError = await probeInsightsError(token, client.facebookPageId);
        } else {
          // Metric objects came back but values are empty or wrong type
          const first = organic.pageInsights[0];
          const sample = first.values.slice(0, 2);
          organicError = `pageInsights has ${organic.pageInsights.length} metric(s) [${organic.pageInsights.map(i => i.name).join(", ")}] but page_impressions_unique has 0 usable values. "${first.name}" sample values: ${JSON.stringify(sample)}`;
        }
      }
    }

    const debugInfo = {
      accountId,
      clientFound: !!client,
      clientName: client?.name ?? null,
      hasFbPageId: !!client?.facebookPageId,
      hasIgId: !!client?.instagramAccountId,
      organicIsNull: organic === null,
      pageTokenSource: organic?.pageTokenSource ?? null,
      pageInsightsCount: organic?.pageInsights.length ?? -1,
      pageInsightsNames: organic?.pageInsights.map(i => i.name) ?? [],
      fbMetricErrors: organic?.fbMetricErrors ?? {},
      igMetricErrors: organic?.igMetricErrors ?? {},
      organicErrorMsg: organicError,
      fbMetricCounts: organic ? {
        reach: extractDailySeries(organic.pageInsights, "page_impressions_unique").length,
        engagements: extractDailySeries(organic.pageInsights, "page_post_engagements").length,
      } : null,
      igMetricCounts: organic ? {
        reach: extractDailySeries(organic.igInsights, "reach").length,
        followerCount: extractDailySeries(organic.igInsights, "follower_count").length,
      } : null,
      sampleFbReach: organic?.pageInsights.find(i => i.name === "page_impressions_unique")?.values.slice(0, 2) ?? [],
    };

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

    return NextResponse.json({ performance, organicError, debugInfo });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Performance fetch failed: ${msg}` }, { status: 500 });
  }
}
