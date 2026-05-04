const BASE = "https://graph.facebook.com/v21.0";

async function gql<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}${path}?${qs}`);
  const json = await res.json();
  if (json.error) throw new Error(`Meta API: ${json.error.message} (code ${json.error.code})`);
  return json as T;
}

// Paginate through all results
async function paginate<T>(
  path: string,
  params: Record<string, string>
): Promise<T[]> {
  const results: T[] = [];
  const firstUrl = `${BASE}${path}?${new URLSearchParams(params).toString()}`;
  const queue: string[] = [firstUrl];

  while (queue.length > 0 && results.length < 500) {
    const nextUrl = queue.shift() as string;
    const r = await fetch(nextUrl);
    const json = await r.json();
    if (json.error) throw new Error(`Meta API: ${json.error.message}`);
    results.push(...(json.data ?? []));
    if (json.paging?.next) queue.push(json.paging.next as string);
  }

  return results;
}

export interface MetaAccount {
  id: string;
  name: string;
  currency: string;
  account_status: number;
  timezone_name: string;
  amount_spent: string;
  balance: string;
  business?: { id: string; name: string };
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  budget_rebalance_flag?: boolean;
  created_time: string;
}

export interface MetaAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
  effective_status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  optimization_goal: string;
  billing_event: string;
  bid_strategy?: string;
  targeting?: Record<string, unknown>;
  learning_stage_info?: {
    status: string;
    attribution_windows: string[];
    conversions: { action_type: string; value: string }[];
  };
  attribution_spec?: { event_type: string; window_days: number }[];
  promoted_object?: Record<string, string>;
  created_time: string;
}

export interface MetaAd {
  id: string;
  name: string;
  adset_id: string;
  campaign_id: string;
  status: string;
  effective_status: string;
  creative?: {
    id: string;
    name?: string;
    object_type?: string;
    thumbnail_url?: string;
  };
  created_time: string;
  updated_time: string;
}

export interface MetaInsights {
  spend: string;
  impressions: string;
  reach: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cpm: string;
  frequency: string;
  cpp: string;
  actions?: { action_type: string; value: string }[];
  action_values?: { action_type: string; value: string }[];
  purchase_roas?: { action_type: string; value: string }[];
  cost_per_action_type?: { action_type: string; value: string }[];
  date_start: string;
  date_stop: string;
}

export interface MetaCampaignInsights extends MetaInsights {
  campaign_id: string;
  campaign_name: string;
  objective: string;
}

export interface MetaAdSetInsights extends MetaInsights {
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
}

export interface MetaPixel {
  id: string;
  name: string;
  last_fired_time?: string;
  is_unavailable?: boolean;
  code?: string;
}

export interface MetaCustomAudience {
  id: string;
  name: string;
  subtype: string;
  approximate_count_lower_bound?: number;
  approximate_count_upper_bound?: number;
  time_updated: number;
  data_source?: { type: string; sub_type: string };
  rule?: string;
}

export interface MetaFullData {
  account: MetaAccount;
  campaigns: MetaCampaign[];
  adsets: MetaAdSet[];
  ads: MetaAd[];
  accountInsights: MetaInsights | null;
  campaignInsights: MetaCampaignInsights[];
  adsetInsights: MetaAdSetInsights[];
  pixels: MetaPixel[];
  customAudiences: MetaCustomAudience[];
  fetchedAt: string;
}

const INSIGHT_FIELDS = [
  "spend",
  "impressions",
  "reach",
  "clicks",
  "ctr",
  "cpc",
  "cpm",
  "frequency",
  "cpp",
  "actions",
  "action_values",
  "purchase_roas",
  "cost_per_action_type",
].join(",");

export async function fetchMetaData(
  token: string,
  accountId: string
): Promise<MetaFullData> {
  const actId = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
  const t = token.trim();

  const [
    account,
    campaigns,
    adsets,
    ads,
    accountInsightsRaw,
    campaignInsightsRaw,
    adsetInsightsRaw,
    pixels,
    customAudiences,
  ] = await Promise.all([
    // Account
    gql<MetaAccount>(`/${actId}`, {
      fields: "id,name,currency,account_status,timezone_name,amount_spent,balance,business",
      access_token: t,
    }),

    // Campaigns
    paginate<MetaCampaign>(`/${actId}/campaigns`, {
      fields:
        "id,name,status,effective_status,objective,daily_budget,lifetime_budget,budget_rebalance_flag,created_time",
      effective_status: '["ACTIVE","PAUSED","ARCHIVED"]',
      limit: "100",
      access_token: t,
    }),

    // Ad Sets
    paginate<MetaAdSet>(`/${actId}/adsets`, {
      fields:
        "id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget,optimization_goal,billing_event,bid_strategy,targeting,learning_stage_info,attribution_spec,promoted_object,created_time",
      effective_status: '["ACTIVE","PAUSED","LEARNING","LEARNING_LIMITED"]',
      limit: "100",
      access_token: t,
    }),

    // Ads
    paginate<MetaAd>(`/${actId}/ads`, {
      fields:
        "id,name,adset_id,campaign_id,status,effective_status,creative{id,name,object_type,thumbnail_url},created_time,updated_time",
      effective_status: '["ACTIVE","PAUSED","ARCHIVED"]',
      limit: "100",
      access_token: t,
    }),

    // Account-level insights (last 30 days)
    gql<{ data: MetaInsights[] }>(`/${actId}/insights`, {
      fields: INSIGHT_FIELDS,
      date_preset: "last_30d",
      level: "account",
      access_token: t,
    }).then((r) => r.data?.[0] ?? null).catch(() => null),

    // Campaign-level insights
    paginate<MetaCampaignInsights>(`/${actId}/insights`, {
      fields: `campaign_id,campaign_name,objective,${INSIGHT_FIELDS}`,
      date_preset: "last_30d",
      level: "campaign",
      limit: "50",
      access_token: t,
    }).catch(() => []),

    // Ad set-level insights (for frequency per ad set)
    paginate<MetaAdSetInsights>(`/${actId}/insights`, {
      fields: `adset_id,adset_name,campaign_id,campaign_name,${INSIGHT_FIELDS}`,
      date_preset: "last_30d",
      level: "adset",
      limit: "100",
      access_token: t,
    }).catch(() => []),

    // Pixels
    paginate<MetaPixel>(`/${actId}/adspixels`, {
      fields: "id,name,last_fired_time,is_unavailable",
      limit: "10",
      access_token: t,
    }).catch(() => []),

    // Custom Audiences
    paginate<MetaCustomAudience>(`/${actId}/customaudiences`, {
      fields:
        "id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,time_updated,data_source",
      limit: "100",
      access_token: t,
    }).catch(() => []),
  ]);

  return {
    account,
    campaigns,
    adsets,
    ads,
    accountInsights: accountInsightsRaw,
    campaignInsights: campaignInsightsRaw,
    adsetInsights: adsetInsightsRaw,
    pixels,
    customAudiences,
    fetchedAt: new Date().toISOString(),
  };
}
