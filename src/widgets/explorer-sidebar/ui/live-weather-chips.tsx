"use client";

import { useEffect, useState } from "react";
import { getLocalTimeNow } from "@/shared/lib/sun-times";
import { mapSevenTimerCode, weatherConditionIcons } from "@/shared/lib/weather-condition";

type WeatherPoint = { tempC: number; code: string };
type WeatherResponse = { now: WeatherPoint; tomorrow: WeatherPoint };

type LiveWeatherChipsProps = {
  regionId: string;
  latitude: number;
  longitude: number;
  timeZoneOffsetHours: number;
  nowLabel: string;
  tomorrowLabel: string;
};

export function LiveWeatherChips({
  regionId,
  latitude,
  longitude,
  timeZoneOffsetHours,
  nowLabel,
  tomorrowLabel
}: LiveWeatherChipsProps) {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [localTime, setLocalTime] = useState(() => getLocalTimeNow(new Date(), timeZoneOffsetHours));

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/weather?lat=${latitude}&lon=${longitude}&tz=${timeZoneOffsetHours}`)
      .then((response) => (response.ok ? (response.json() as Promise<WeatherResponse>) : null))
      .then((data) => {
        if (!cancelled) setWeather(data);
      })
      .catch(() => {
        if (!cancelled) setWeather(null);
      });

    return () => {
      cancelled = true;
    };
  }, [regionId, latitude, longitude, timeZoneOffsetHours]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTime(getLocalTimeNow(new Date(), timeZoneOffsetHours));
    }, 30_000);
    return () => clearInterval(interval);
  }, [timeZoneOffsetHours]);

  useEffect(() => {
    setLocalTime(getLocalTimeNow(new Date(), timeZoneOffsetHours));
  }, [timeZoneOffsetHours]);

  if (!weather) {
    return null;
  }

  const NowIcon = weatherConditionIcons[mapSevenTimerCode(weather.now.code)];
  const TomorrowIcon = weatherConditionIcons[mapSevenTimerCode(weather.tomorrow.code)];

  return (
    <>
      <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card px-1.5 py-1 text-xs font-medium text-muted-foreground shadow-sm">
        <span>{nowLabel}</span>
        <span>{localTime}</span>
        <NowIcon className="h-3 w-3 text-sky-700" />
        <span className="font-semibold text-foreground">{Math.round(weather.now.tempC)}°</span>
      </div>
      <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card px-1.5 py-1 text-xs font-medium text-muted-foreground shadow-sm">
        <span>{tomorrowLabel}</span>
        <TomorrowIcon className="h-3 w-3 text-sky-700" />
        <span className="font-semibold text-foreground">{Math.round(weather.tomorrow.tempC)}°</span>
      </div>
    </>
  );
}
