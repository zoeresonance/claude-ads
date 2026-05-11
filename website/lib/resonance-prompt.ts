import type { MetaFullData, OrganicData, PagePost, IgMedia, PageInsightValue } from "./meta-api";

// ─── Ads Resonance ────────────────────────────────────────────────────────────

export const ADS_RESONANCE_SYSTEM_PROMPT = `You are an expert paid media strategist and audience analyst. You have deep expertise in evaluating Meta ad campaigns against psychographic persona profiles to determine how well the paid advertising is resonating with its intended audience.

You will be given:
1. A persona/audience audit document describing the target audience ("The One" and key personas)
2. Meta paid ad performance data (campaigns, ad sets, ads, account-level and campaign-level metrics)

Your job is to analyze whether the paid ads are resonating with the described personas, based on:
- CREATIVE RESONANCE: Do the ad names, formats, and creative approaches match what the persona responds to?
- MESSAGING ALIGNMENT: Does the ad copy and naming language reflect the persona's values, motivations, and communication preferences?
- AUDIENCE TARGETING: Does the performance data (CTR, frequency, ROAS) suggest the right people are seeing the ads?
- CONVERSION FIT: Do the campaign objectives and performance metrics align with how the persona makes decisions?

Return ONLY valid JSON matching this exact schema — no markdown, no explanation:

{
  "score": <number 0-100>,
  "grade": <"A"|"B"|"C"|"D"|"F">,
  "summary": <string: 2-3 sentence diagnosis of how well the paid ads are landing with the target persona>,
  "dimensions": {
    "creativeResonance": {
      "score": <0-100>,
      "finding": <string: do the ad creative formats and approaches match what the persona responds to>
    },
    "messagingAlignment": {
      "score": <0-100>,
      "finding": <string: how well the ad copy and naming language matches the persona's resonant themes vs. off-putting themes>
    },
    "audienceTargeting": {
      "score": <0-100>,
      "finding": <string: what CTR, frequency, and ROAS signals tell us about whether the right people are seeing the ads>
    },
    "conversionFit": {
      "score": <0-100>,
      "finding": <string: do the campaign objectives, spend allocation, and conversion metrics align with the persona's decision-making style>
    }
  },
  "topPerformers": [
    {
      "type": "ad",
      "identifier": <string: ad name>,
      "metric": <string: e.g. "4.2% CTR">,
      "whyItLands": <string: specific connection to the persona's motivations or communication preferences>
    }
  ],
  "bottomPerformers": [
    {
      "type": "ad",
      "identifier": <string: ad name or campaign name>,
      "metric": <string: e.g. "0.3% CTR">,
      "whyItMisses": <string: specific mismatch with the persona's needs or known turn-offs>
    }
  ],
  "recommendations": [
    {
      "type": <"ad"|"audience"|"creative"|"messaging">,
      "target": <string: specific ad name or campaign>,
      "currentState": <string: what it currently says or does>,
      "suggestion": <string: the specific change — e.g. exact new headline, new creative direction, new audience parameter>,
      "reasoning": <string: why this change will resonate better with the persona>,
      "impact": <"HIGH"|"MEDIUM"|"LOW">
    }
  ],
  "personaFit": {
    "primaryPersonaName": <string: e.g. "Gainesville Grace">,
    "matchScore": <0-100>,
    "strengths": [<string>],
    "gaps": [<string>]
  }
}

Grades: A=85+, B=70-84, C=55-69, D=40-54, F=<40
Top/bottom performers: 3 each max. Focus only on ads.
Recommendations: 5-8, sorted by impact (HIGH first). Be specific — actual headline rewrites, actual audience parameters, actual creative directions. Not vague advice.`;

// ─── Organic Resonance ────────────────────────────────────────────────────────

export const ORGANIC_RESONANCE_SYSTEM_PROMPT = `You are an expert organic social media strategist and audience analyst. You have deep expertise in evaluating Facebook and Instagram organic content against psychographic persona profiles to determine how well the brand's posts are resonating with its intended audience.

You will be given:
1. A persona/audience audit document describing the target audience ("The One" and key personas)
2. Facebook page metrics and recent organic posts (with engagement data)
3. Instagram account metrics, recent posts (with engagement data), and audience demographics

Your job is to analyze whether the organic content is resonating with the described personas, based on:
- AUDIENCE RECEPTION: What does the engagement data reveal about who is actually responding, and does that match the persona?
- CONTENT PERFORMANCE: Which content types (video, photo, carousel, reel) and themes are performing best vs. worst, and why?
- MESSAGING ALIGNMENT: Does the caption language, tone, and storytelling match what the persona responds to?
- PLATFORM CONSISTENCY: Is the brand showing up consistently and effectively across both Facebook and Instagram?

IMPORTANT DATA CAVEAT: Instagram audience demographics (age, gender, location) are always LIFETIME aggregates, not date-range specific. They represent all followers ever accumulated. Do not interpret demographic shifts from these numbers as recent changes; treat them as a snapshot of the cumulative follower base. All other metrics respect the selected date range.

Return ONLY valid JSON matching this exact schema — no markdown, no explanation:

{
  "score": <number 0-100>,
  "grade": <"A"|"B"|"C"|"D"|"F">,
  "summary": <string: 2-3 sentence diagnosis of how well the organic content is landing with the target persona>,
  "dimensions": {
    "audienceReception": {
      "score": <0-100>,
      "finding": <string: what the engagement data reveals about who is actually responding and whether that matches the persona>
    },
    "contentPerformance": {
      "score": <0-100>,
      "finding": <string: which content types and themes are performing best vs. worst and why>
    },
    "messagingAlignment": {
      "score": <0-100>,
      "finding": <string: how well the actual captions and storytelling match the persona's resonant themes vs. off-putting themes>
    },
    "platformConsistency": {
      "score": <0-100>,
      "finding": <string: how consistently and effectively the brand shows up across Facebook and Instagram organic>
    }
  },
  "topPerformers": [
    {
      "type": <"facebook_post"|"instagram_post">,
      "identifier": <string: post caption snippet>,
      "metric": <string: e.g. "4.2% engagement rate">,
      "whyItLands": <string: specific connection to the persona's motivations or communication preferences>
    }
  ],
  "bottomPerformers": [
    {
      "type": <"facebook_post"|"instagram_post">,
      "identifier": <string: post caption snippet>,
      "metric": <string: e.g. "0.3% engagement rate">,
      "whyItMisses": <string: specific mismatch with the persona's needs or known turn-offs>
    }
  ],
  "recommendations": [
    {
      "type": <"post"|"creative"|"messaging">,
      "target": <string: specific post type, platform, or content theme>,
      "currentState": <string: what it currently looks like or says>,
      "suggestion": <string: the specific change — e.g. exact new caption approach, new content format, new posting cadence>,
      "reasoning": <string: why this change will resonate better with the persona>,
      "impact": <"HIGH"|"MEDIUM"|"LOW">
    }
  ],
  "personaFit": {
    "primaryPersonaName": <string: e.g. "Gainesville Grace">,
    "matchScore": <0-100>,
    "strengths": [<string>],
    "gaps": [<string>]
  }
}

Grades: A=85+, B=70-84, C=55-69, D=40-54, F=<40
Top/bottom performers: 3 each max. Focus only on organic posts (no ads).
Recommendations: 5-8, sorted by impact (HIGH first). Be specific — actual caption rewrites, actual content formats, actual posting strategies. Not vague advice.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInsightValue(insights: PageInsightValue[], name: string): string {
  const item = insights.find((i) => i.name === name);
  if (!item) return "N/A";
  const vals = item.values ?? [];
  if (!vals.length) return "N/A";
  const last = vals[vals.length - 1]?.value;
  if (typeof last === "number") return last.toLocaleString();
  if (typeof last === "object") {
    return Object.entries(last)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  }
  return "N/A";
}

function summarizePost(post: PagePost, index: number): string {
  const text = post.message || post.story || "(no caption)";
  const snippet = text.slice(0, 120) + (text.length > 120 ? "…" : "");
  const metrics: string[] = [];
  if (post.insights?.data) {
    for (const m of post.insights.data) {
      const val = m.values?.[0]?.value;
      if (typeof val === "number") metrics.push(`${m.name}: ${val.toLocaleString()}`);
    }
  }
  const type = post.attachments?.data?.[0]?.media_type ?? "text";
  const date = new Date(post.created_time).toLocaleDateString();
  return `  FB Post ${index + 1} [${type}, ${date}]: "${snippet}" | ${metrics.join(", ") || "no metrics"}`;
}

function summarizeIgPost(post: IgMedia, index: number): string {
  const text = post.caption || "(no caption)";
  const snippet = text.slice(0, 120) + (text.length > 120 ? "…" : "");
  const metrics: string[] = [];
  if (post.insights?.data) {
    for (const m of post.insights.data) {
      const val = m.values?.[0]?.value;
      if (typeof val === "number") metrics.push(`${m.name}: ${val.toLocaleString()}`);
    }
  }
  if (post.like_count != null) metrics.push(`likes: ${post.like_count}`);
  if (post.comments_count != null) metrics.push(`comments: ${post.comments_count}`);
  const date = new Date(post.timestamp).toLocaleDateString();
  return `  IG Post ${index + 1} [${post.media_type}, ${date}]: "${snippet}" | ${metrics.join(", ") || "no metrics"}`;
}

// ─── Message Builders ─────────────────────────────────────────────────────────

export function buildAdsResonanceMessage(auditDoc: string, adData: MetaFullData): string {
  const sections: string[] = [];

  sections.push(`## PERSONA & AUDIENCE AUDIT DOCUMENT\n\n${auditDoc}`);

  const adSections: string[] = [];
  const activeCampaigns = adData.campaigns.filter((c) => c.effective_status === "ACTIVE" || c.effective_status === "PAUSED");
  adSections.push(`Active/Paused Campaigns: ${activeCampaigns.length}`);
  activeCampaigns.forEach((c) => adSections.push(`  • "${c.name}" | ${c.objective} | ${c.effective_status}`));

  if (adData.accountInsights) {
    const ai = adData.accountInsights;
    adSections.push(`\n30-Day Paid Performance:`);
    adSections.push(`  Spend: $${parseFloat(ai.spend ?? "0").toLocaleString()}`);
    adSections.push(`  CTR: ${ai.ctr ? (parseFloat(ai.ctr) * 100).toFixed(2) + "%" : "N/A"}`);
    adSections.push(`  CPM: $${parseFloat(ai.cpm ?? "0").toFixed(2)}`);
    adSections.push(`  CPC: $${parseFloat(ai.cpc ?? "0").toFixed(2)}`);
    adSections.push(`  Frequency: ${parseFloat(ai.frequency ?? "0").toFixed(2)}`);
  }

  if (adData.campaignInsights.length) {
    adSections.push("\nTop Campaigns by Spend:");
    adData.campaignInsights
      .sort((a, b) => parseFloat(b.spend ?? "0") - parseFloat(a.spend ?? "0"))
      .slice(0, 5)
      .forEach((c) => {
        const ctr = c.ctr ? (parseFloat(c.ctr) * 100).toFixed(2) + "%" : "N/A";
        adSections.push(`  • "${c.campaign_name}" | Spend: $${parseFloat(c.spend ?? "0").toFixed(0)} | CTR: ${ctr} | CPM: $${parseFloat(c.cpm ?? "0").toFixed(2)}`);
      });
  }

  if (adData.ads.length) {
    const activeAds = adData.ads.filter((a) => a.effective_status === "ACTIVE" || a.effective_status === "PAUSED");
    adSections.push(`\nActive/Paused Ads (${activeAds.length}):`);
    activeAds.slice(0, 15).forEach((a) => adSections.push(`  • "${a.name}" | ${a.effective_status}`));
  }

  sections.push(`## PAID ADS DATA\n${adSections.join("\n")}`);
  sections.push(`Please analyze how well this account's paid ads are resonating with the described personas. Focus on what the ad names, campaign objectives, and performance metrics tell us about creative and messaging fit. Return the complete JSON ads resonance analysis.`);

  return sections.join("\n\n");
}

export function buildOrganicResonanceMessage(auditDoc: string, organic: OrganicData): string {
  const sections: string[] = [];

  sections.push(`## PERSONA & AUDIENCE AUDIT DOCUMENT\n\n${auditDoc}`);

  // Facebook organic
  const fbSections: string[] = [];
  if (organic.page) {
    fbSections.push(`Page: ${organic.page.name} | Followers: ${organic.page.followers_count?.toLocaleString() ?? "N/A"} | Likes: ${organic.page.fan_count?.toLocaleString() ?? "N/A"}`);
  }
  if (organic.pageInsights.length) {
    fbSections.push("28-Day Page Metrics:");
    fbSections.push(`  Reach: ${getInsightValue(organic.pageInsights, "page_reach")}`);
    fbSections.push(`  Impressions: ${getInsightValue(organic.pageInsights, "page_impressions")}`);
    fbSections.push(`  Engaged Users: ${getInsightValue(organic.pageInsights, "page_engaged_users")}`);
    fbSections.push(`  Post Engagements: ${getInsightValue(organic.pageInsights, "page_post_engagements")}`);
    fbSections.push(`  Page Views: ${getInsightValue(organic.pageInsights, "page_views_total")}`);
    fbSections.push(`  New Followers: ${getInsightValue(organic.pageInsights, "page_fan_adds_unique")}`);
  }
  if (organic.pagePosts.length) {
    fbSections.push(`\nRecent Posts (${organic.pagePosts.length}):`);
    organic.pagePosts.forEach((p, i) => fbSections.push(summarizePost(p, i)));
  }
  sections.push(`## FACEBOOK ORGANIC DATA\n${fbSections.join("\n")}`);

  // Instagram organic
  const igSections: string[] = [];
  if (organic.igInsights.length) {
    igSections.push("28-Day Instagram Metrics:");
    igSections.push(`  Reach: ${getInsightValue(organic.igInsights, "reach")}`);
    igSections.push(`  Impressions: ${getInsightValue(organic.igInsights, "impressions")}`);
    igSections.push(`  Profile Views: ${getInsightValue(organic.igInsights, "profile_views")}`);
    igSections.push(`  Accounts Engaged: ${getInsightValue(organic.igInsights, "accounts_engaged")}`);
  }
  if (organic.igAudienceDemographics.length) {
    igSections.push("\nAudience Demographics (LIFETIME — represents all-time follower base, NOT this date range):");
    for (const dim of organic.igAudienceDemographics) {
      const last = dim.values?.[dim.values.length - 1]?.value;
      if (typeof last === "object" && last !== null) {
        const top = Object.entries(last)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 8)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        igSections.push(`  ${dim.name}: ${top}`);
      }
    }
  }
  if (organic.igMedia.length) {
    igSections.push(`\nRecent Posts (${organic.igMedia.length}):`);
    organic.igMedia.forEach((p, i) => igSections.push(summarizeIgPost(p, i)));
  }
  sections.push(`## INSTAGRAM ORGANIC DATA\n${igSections.join("\n")}`);

  sections.push(`Please analyze how well this account's organic Facebook and Instagram content is resonating with the described personas. Focus on what the post engagement data, content formats, and caption language tell us about audience fit. Return the complete JSON organic resonance analysis.`);

  return sections.join("\n\n");
}
