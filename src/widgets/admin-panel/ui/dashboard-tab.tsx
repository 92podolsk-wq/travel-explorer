"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";

type TopPoiStat = { poiId: string; poiName: string; regionId: string; count: number };
type DayCount = { date: string; count: number };
type ActivitySummary = {
  periodDays: number;
  newUsers: number;
  totalUsers: number;
  totalPois: number;
  viewedEvents: number;
  favoritedEvents: number;
  visitedEvents: number;
};

type AnalyticsResponse = {
  topViewed: TopPoiStat[];
  topFavorited: TopPoiStat[];
  userGrowth: DayCount[];
  activity: ActivitySummary;
};

const statCardClass = "rounded-lg border border-border bg-white p-4 shadow-sm";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={statCardClass}>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function TopList({ title, items }: { title: string; items: TopPoiStat[] }) {
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <div className={statCardClass}>
      <p className="mb-3 text-sm font-semibold text-foreground">{title}</p>
      {items.length === 0 && <p className="text-sm text-muted-foreground">Пока нет данных.</p>}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.poiId} className="flex items-center gap-2">
            <span className="w-4 shrink-0 text-xs font-semibold text-muted-foreground">{index + 1}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate font-medium text-foreground">{item.poiName}</span>
                <span className="ml-2 shrink-0 text-xs text-muted-foreground">{item.count}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GrowthChart({ data }: { data: DayCount[] }) {
  const max = Math.max(1, ...data.map((day) => day.count));

  return (
    <div className={statCardClass}>
      <p className="mb-3 text-sm font-semibold text-foreground">Новые пользователи за 30 дней</p>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Пока нет данных.</p>
      ) : (
        <div className="flex h-24 items-end gap-0.5 overflow-x-auto">
          {data.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.count}`}
              className={cn("w-2 shrink-0 rounded-t bg-primary/70 transition hover:bg-primary", day.count === 0 && "bg-muted")}
              style={{ height: `${Math.max(4, (day.count / max) * 100)}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DashboardTab() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) {
        setError("Не удалось загрузить аналитику.");
        return;
      }
      setData((await res.json()) as AnalyticsResponse);
    })();
  }, []);

  if (error) {
    return <p className="text-sm font-medium text-red-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>;
  }

  const { activity, topViewed, topFavorited, userGrowth } = data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Всего пользователей" value={activity.totalUsers} />
        <StatCard label={`Новых за ${activity.periodDays} дн.`} value={activity.newUsers} />
        <StatCard label={`Просмотров за ${activity.periodDays} дн.`} value={activity.viewedEvents} />
        <StatCard label={`В избранном за ${activity.periodDays} дн.`} value={activity.favoritedEvents} />
      </div>

      <GrowthChart data={userGrowth} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TopList title="Топ локаций по просмотрам" items={topViewed} />
        <TopList title="Топ локаций по избранному" items={topFavorited} />
      </div>
    </div>
  );
}
