"use client";

interface Props {
  posts: { timestamp: string; engagement: number }[];
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DAYPARTS: { label: string; range: string; hours: number[] }[] = [
  { label: "Night",     range: "12–5am",  hours: [0, 1, 2, 3, 4, 5] },
  { label: "Morning",   range: "6–11am",  hours: [6, 7, 8, 9, 10, 11] },
  { label: "Afternoon", range: "12–4pm",  hours: [12, 13, 14, 15, 16] },
  { label: "Evening",   range: "5–11pm",  hours: [17, 18, 19, 20, 21, 22, 23] },
];

interface Bucket {
  label: string;
  sublabel?: string;
  postCount: number;
  avgEngagement: number;
}

function bucketStats(
  posts: { timestamp: string; engagement: number }[],
  groups: { label: string; sublabel?: string; test: (d: Date) => boolean }[]
): Bucket[] {
  return groups.map(({ label, sublabel, test }) => {
    const matched = posts.filter((p) => test(new Date(p.timestamp)));
    const postCount = matched.length;
    const avgEngagement = postCount > 0
      ? matched.reduce((sum, p) => sum + p.engagement, 0) / postCount
      : 0;
    return { label, sublabel, postCount, avgEngagement };
  });
}

function BarList({ title, buckets }: { title: string; buckets: Bucket[] }) {
  const withPosts = buckets.filter((b) => b.postCount > 0);
  const maxAvg = Math.max(1, ...withPosts.map((b) => b.avgEngagement));
  // A bucket only "wins" if it has at least 2 posts — one post isn't a pattern.
  const confident = withPosts.filter((b) => b.postCount >= 2);
  const best = (confident.length > 0 ? confident : withPosts).reduce(
    (top, b) => (b.avgEngagement > (top?.avgEngagement ?? -1) ? b : top),
    null as Bucket | null
  );

  return (
    <div>
      <h5 className="text-xs font-semibold text-slate-300 mb-3">{title}</h5>
      <div className="space-y-2">
        {buckets.map((b) => {
          const isBest = best && b.label === best.label && b.postCount > 0;
          const widthPct = b.postCount > 0 ? Math.max(6, (b.avgEngagement / maxAvg) * 100) : 0;
          return (
            <div key={b.label} className="flex items-center gap-2 text-xs">
              <div className="w-20 shrink-0 text-slate-400">
                {b.label}
                {b.sublabel && <span className="text-slate-500"> · {b.sublabel}</span>}
              </div>
              <div className="flex-1 h-5 bg-[#252525] rounded-md overflow-hidden relative">
                {b.postCount > 0 && (
                  <div
                    className={`h-full rounded-md ${isBest ? "bg-[#e1306c]" : "bg-[#3a3a4a]"}`}
                    style={{ width: `${widthPct}%` }}
                  />
                )}
              </div>
              <div className="w-20 shrink-0 text-right text-slate-500">
                {b.postCount > 0 ? (
                  <>
                    {b.avgEngagement.toFixed(1)} avg
                    {isBest && <span className="ml-1 text-[#e1306c]">★</span>}
                  </>
                ) : (
                  "—"
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BestPostingTimes({ posts }: Props) {
  const MIN_POSTS = 3;

  if (posts.length < MIN_POSTS) {
    return (
      <div className="bg-[#1e1e1e] rounded-2xl border border-[#2d2d2d] shadow-sm p-5">
        <h4 className="font-semibold text-slate-100 text-sm mb-1">📅 Best Times to Post</h4>
        <p className="text-xs text-slate-500">
          Not enough Instagram posts in this date range yet ({posts.length} found) to identify a
          reliable day/time pattern. This fills in as more posts are published.
        </p>
      </div>
    );
  }

  const byDay = bucketStats(
    posts,
    DAY_NAMES.map((label, i) => ({ label, test: (d) => d.getUTCDay() === i }))
  );
  const byDaypart = bucketStats(
    posts,
    DAYPARTS.map(({ label, range, hours }) => ({
      label,
      sublabel: range,
      test: (d) => hours.includes(d.getUTCHours()),
    }))
  );

  const bestDay = byDay.filter((b) => b.postCount >= 2).sort((a, b) => b.avgEngagement - a.avgEngagement)[0]
    ?? byDay.filter((b) => b.postCount > 0).sort((a, b) => b.avgEngagement - a.avgEngagement)[0];
  const bestDaypart = byDaypart.filter((b) => b.postCount >= 2).sort((a, b) => b.avgEngagement - a.avgEngagement)[0]
    ?? byDaypart.filter((b) => b.postCount > 0).sort((a, b) => b.avgEngagement - a.avgEngagement)[0];

  return (
    <div className="bg-[#1e1e1e] rounded-2xl border border-[#2d2d2d] shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
        <h4 className="font-semibold text-slate-100 text-sm">📅 Best Times to Post</h4>
        {bestDay && bestDaypart && (
          <div className="text-xs text-slate-300">
            <span className="text-[#e1306c] font-semibold">{bestDay.label}</span>
            {" · "}
            <span className="text-[#e1306c] font-semibold">{bestDaypart.label}</span>
            {" (" + bestDaypart.sublabel + ")"}
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Average engagement (likes + comments) per post, grouped by when it was published. ★ marks
        the strongest day/window with at least 2 posts to back it up.
      </p>
      <div className="grid sm:grid-cols-2 gap-6">
        <BarList title="By Day of Week" buckets={byDay} />
        <BarList title="By Time of Day" buckets={byDaypart} />
      </div>
      <p className="text-xs text-slate-500 mt-4">
        Based on {posts.length} Instagram post{posts.length === 1 ? "" : "s"} in the selected range.
        Facebook isn&apos;t included — Meta&apos;s API doesn&apos;t expose per-post engagement for
        Page posts without additional permissions. Times are shown in UTC.
      </p>
    </div>
  );
}
