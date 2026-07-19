// src/app/stats/page.tsx

import {
  CalendarDays,
  CheckCircle2,
  Flame,
  Library,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  progressRepository,
  questionRepository,
  interviewRepository,
} from "@/lib/db/repositories";
import { getMasteryLevel } from "@/lib/algorithms/sm2";
import { formatCategory, getCategoryEmoji } from "@/lib/utils/question-format";
import type { QuestionCategory, ReviewRecord } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Sequential violet ramps for the reviews heatmap (magnitude = one hue,
 * light→dark). Validated against the app surfaces: lightness-monotonic,
 * CVD-separated; the low-contrast lightest step gets relief from cell
 * borders, per-cell tooltips, and the text summary below the chart.
 */
const HEAT_LIGHT = ["#ddd6fe", "#a78bfa", "#7c3aed", "#5b21b6"];
const HEAT_DARK = ["#4c1d95", "#6d28d9", "#8b5cf6", "#c4b5fd"];

const WEEKS = 16;

export default async function StatsPage() {
  const [progress, questions, dashboard, sessions] = await Promise.all([
    progressRepository.findAll(),
    questionRepository.findAll(),
    progressRepository.getDashboard(),
    interviewRepository.findAll(),
  ]);

  // ---- Review aggregates (from kept history: last 50 per card) ----
  const allReviews: ReviewRecord[] = progress.flatMap((p) => p.reviewHistory);
  const totalReviews = allReviews.length;
  const correctReviews = allReviews.filter((r) => r.quality >= 3).length;
  const retention =
    totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : null;

  const cutoff30 = Date.now() - 30 * 86_400_000;
  const recent = allReviews.filter((r) => new Date(r.date).getTime() >= cutoff30);
  const retention30 =
    recent.length > 0
      ? Math.round(
          (recent.filter((r) => r.quality >= 3).length / recent.length) * 100,
        )
      : null;

  // ---- Heatmap: reviews per local day, last WEEKS weeks ----
  const countByDay = new Map<string, number>();
  for (const review of allReviews) {
    const key = localDayKey(new Date(review.date));
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const gridStart = new Date(today);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay() - (WEEKS - 1) * 7);

  const weeks: Array<Array<{ key: string; count: number; future: boolean }>> = [];
  for (let w = 0; w < WEEKS; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + w * 7 + d);
      const key = localDayKey(date);
      days.push({
        key,
        count: countByDay.get(key) ?? 0,
        future: date > today,
      });
    }
    weeks.push(days);
  }

  const gridCounts = weeks.flat().filter((c) => !c.future);
  const maxCount = Math.max(0, ...gridCounts.map((c) => c.count));
  const activeDays = gridCounts.filter((c) => c.count > 0).length;
  const gridTotal = gridCounts.reduce((sum, c) => sum + c.count, 0);
  const busiest = gridCounts.reduce(
    (best, c) => (c.count > best.count ? c : best),
    { key: "", count: 0, future: false },
  );

  // ---- Per-category state ----
  const progressByQuestion = new Map(progress.map((p) => [p.questionId, p]));
  const byCategory = new Map<
    QuestionCategory,
    {
      total: number;
      mastered: number;
      reviewing: number;
      learning: number;
      unseen: number;
      easeSum: number;
      studied: number;
    }
  >();
  for (const q of questions) {
    let entry = byCategory.get(q.category);
    if (!entry) {
      entry = {
        total: 0,
        mastered: 0,
        reviewing: 0,
        learning: 0,
        unseen: 0,
        easeSum: 0,
        studied: 0,
      };
      byCategory.set(q.category, entry);
    }
    entry.total++;
    const p = progressByQuestion.get(q.id);
    if (!p || p.totalReviews === 0) {
      entry.unseen++;
      continue;
    }
    entry.studied++;
    entry.easeSum += p.sm2.easeFactor;
    const level = getMasteryLevel(p.sm2);
    if (level === "mastered") entry.mastered++;
    else if (level === "reviewing") entry.reviewing++;
    else entry.learning++;
  }
  const categories = [...byCategory.entries()].sort(
    (a, b) => b[1].studied / b[1].total - a[1].studied / a[1].total,
  );

  const completedInterviews = sessions.filter(
    (s) => s.status === "completed",
  ).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Stats</h1>
        <p className="text-muted-foreground">
          What your studying actually looks like.
        </p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatTile
          icon={<Library className="w-4 h-4" />}
          label="Total Reviews"
          value={String(totalReviews)}
          sub={`${completedInterviews} mock interview${completedInterviews === 1 ? "" : "s"}`}
        />
        <StatTile
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Retention"
          value={retention === null ? "—" : `${retention}%`}
          sub={
            retention30 === null
              ? "rated Good or better"
              : `${retention30}% last 30 days`
          }
        />
        <StatTile
          icon={<Flame className="w-4 h-4" />}
          label="Day Streak"
          value={String(dashboard.streakDays)}
          sub={
            dashboard.lastStudyDate
              ? `last studied ${dashboard.lastStudyDate}`
              : "no reviews yet"
          }
        />
        <StatTile
          icon={<TrendingUp className="w-4 h-4" />}
          label="Mastered"
          value={String(dashboard.totalMastered)}
          sub={`of ${questions.length} questions`}
        />
      </div>

      {/* Reviews heatmap */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            Reviews per Day
            <span className="text-xs font-normal text-muted-foreground">
              last {WEEKS} weeks
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-[3px] w-max">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day) => {
                    const bucket =
                      day.count === 0 || maxCount === 0
                        ? 0
                        : Math.min(
                            4,
                            Math.max(1, Math.ceil((day.count / maxCount) * 4)),
                          );
                    return (
                      <div
                        key={day.key}
                        title={
                          day.future
                            ? undefined
                            : `${day.key} — ${day.count} review${day.count === 1 ? "" : "s"}`
                        }
                        className={`w-3 h-3 rounded-[3px] border border-border/60 transition-transform hover:scale-125 ${
                          day.future ? "opacity-0" : ""
                        } ${bucket === 0 ? "bg-muted" : ""}`}
                        style={
                          bucket > 0
                            ? ({
                                backgroundColor: `var(--heat-${bucket})`,
                              } as React.CSSProperties)
                            : undefined
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted-foreground">
              {gridTotal} review{gridTotal === 1 ? "" : "s"} across {activeDays}{" "}
              active day{activeDays === 1 ? "" : "s"}
              {busiest.count > 0 &&
                ` · busiest: ${busiest.key} (${busiest.count})`}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              Less
              <span className="w-3 h-3 rounded-[3px] border border-border/60 bg-muted" />
              {[1, 2, 3, 4].map((b) => (
                <span
                  key={b}
                  className="w-3 h-3 rounded-[3px] border border-border/60"
                  style={{ backgroundColor: `var(--heat-${b})` }}
                />
              ))}
              More
            </div>
          </div>

          {/* Ramp values for both themes (validated sequential violet) */}
          <style>{`
            :root { ${HEAT_LIGHT.map((c, i) => `--heat-${i + 1}: ${c};`).join(" ")} }
            .dark { ${HEAT_DARK.map((c, i) => `--heat-${i + 1}: ${c};`).join(" ")} }
          `}</style>
        </CardContent>
      </Card>

      {/* Per-category progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Progress by Topic</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Legend — status colors match the app's chips */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-muted-foreground">
            <LegendSwatch className="bg-green-500/80" label="Mastered" />
            <LegendSwatch className="bg-blue-500/70" label="Reviewing" />
            <LegendSwatch className="bg-orange-500/70" label="Learning" />
            <LegendSwatch className="bg-muted-foreground/25" label="Unseen" />
          </div>

          <div className="space-y-3">
            {categories.map(([category, s]) => {
              const avgEase =
                s.studied > 0 ? (s.easeSum / s.studied).toFixed(2) : null;
              return (
                <div key={category}>
                  <div className="flex items-baseline justify-between text-sm mb-1 gap-3">
                    <span className="truncate">
                      {getCategoryEmoji(category)} {formatCategory(category)}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono tabular-nums shrink-0">
                      {s.studied}/{s.total} studied
                      {avgEase && ` · ease ${avgEase}`}
                    </span>
                  </div>
                  <div
                    className="flex h-2 rounded-full overflow-hidden gap-[2px]"
                    title={`${formatCategory(category)}: ${s.mastered} mastered, ${s.reviewing} reviewing, ${s.learning} learning, ${s.unseen} unseen`}
                  >
                    {s.mastered > 0 && (
                      <div
                        className="bg-green-500/80 rounded-full"
                        style={{ width: `${(s.mastered / s.total) * 100}%` }}
                      />
                    )}
                    {s.reviewing > 0 && (
                      <div
                        className="bg-blue-500/70 rounded-full"
                        style={{ width: `${(s.reviewing / s.total) * 100}%` }}
                      />
                    )}
                    {s.learning > 0 && (
                      <div
                        className="bg-orange-500/70 rounded-full"
                        style={{ width: `${(s.learning / s.total) * 100}%` }}
                      />
                    )}
                    {s.unseen > 0 && (
                      <div
                        className="bg-muted-foreground/25 rounded-full"
                        style={{ width: `${(s.unseen / s.total) * 100}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Ease is the SM-2 easiness factor (2.5 default; lower means the
            topic fights back). Retention counts reviews rated Good or better.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-2xl font-semibold font-mono tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}
