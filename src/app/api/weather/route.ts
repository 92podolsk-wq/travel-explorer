import { NextResponse } from "next/server";

type DayPoint = { tempC: number; code: string };

type SevenTimerPoint = { timepoint: number; temp2m: number; weather: string };
type SevenTimerResponse = { init: string; dataseries: SevenTimerPoint[] };

function parseInitDate(init: string): Date {
  const year = Number(init.slice(0, 4));
  const month = Number(init.slice(4, 6)) - 1;
  const day = Number(init.slice(6, 8));
  const hour = Number(init.slice(8, 10));
  return new Date(Date.UTC(year, month, day, hour));
}

function closestPoint(points: SevenTimerPoint[], initMs: number, targetMs: number): SevenTimerPoint | null {
  let closest: SevenTimerPoint | null = null;
  let closestDiff = Infinity;
  for (const point of points) {
    const pointMs = initMs + point.timepoint * 60 * 60 * 1000;
    const diff = Math.abs(pointMs - targetMs);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = point;
    }
  }
  return closest;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const timeZoneOffsetHours = Number(searchParams.get("tz") ?? "0");

  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://www.7timer.info/bin/api.pl?lon=${lon}&lat=${lat}&product=civil&output=json`,
      { signal: AbortSignal.timeout(8000), next: { revalidate: 1800 } }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Weather service unavailable" }, { status: 502 });
    }

    const data = (await response.json()) as SevenTimerResponse;
    const initMs = parseInitDate(data.init).getTime();
    const nowMs = Date.now();

    const localNowMs = nowMs + timeZoneOffsetHours * 60 * 60 * 1000;
    const localTomorrowNoon = new Date(localNowMs);
    localTomorrowNoon.setUTCDate(localTomorrowNoon.getUTCDate() + 1);
    localTomorrowNoon.setUTCHours(12, 0, 0, 0);
    const tomorrowTargetMs = localTomorrowNoon.getTime() - timeZoneOffsetHours * 60 * 60 * 1000;

    const nowPoint = closestPoint(data.dataseries, initMs, nowMs);
    const tomorrowPoint = closestPoint(data.dataseries, initMs, tomorrowTargetMs);

    if (!nowPoint || !tomorrowPoint) {
      return NextResponse.json({ error: "Incomplete weather data" }, { status: 502 });
    }

    const now: DayPoint = { tempC: nowPoint.temp2m, code: nowPoint.weather };
    const tomorrow: DayPoint = { tempC: tomorrowPoint.temp2m, code: tomorrowPoint.weather };

    return NextResponse.json({ now, tomorrow });
  } catch {
    return NextResponse.json({ error: "Weather service unavailable" }, { status: 502 });
  }
}
