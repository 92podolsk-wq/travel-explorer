import { Droplet, Snowflake } from "lucide-react";
import type { Season } from "@/entities/poi/model/types";
import { getClimateForRegion, monthsForSeasons } from "@/entities/region/model/climate";
import type { Language } from "@/shared/i18n/types";
import { getTempColor } from "@/shared/lib/temp-color";

type SeasonWeatherStripProps = {
  regionId: string;
  selectedSeasons: Season[];
  language: Language;
};

function getMonthLabel(month: number, language: Language) {
  const date = new Date(Date.UTC(2024, month - 1, 1));
  return new Intl.DateTimeFormat(language, { month: "short", timeZone: "UTC" }).format(date);
}

function getMonthFullName(month: number, language: Language) {
  const date = new Date(Date.UTC(2024, month - 1, 1));
  return new Intl.DateTimeFormat(language, { month: "long", timeZone: "UTC" }).format(date);
}

export function SeasonWeatherStrip({ regionId, selectedSeasons, language }: SeasonWeatherStripProps) {
  if (selectedSeasons.length === 0) {
    return null;
  }

  const climate = getClimateForRegion(regionId);
  const months = monthsForSeasons(selectedSeasons);

  return (
    <div className="mt-2 flex gap-[3px]">
      {months.map((month) => {
        const entry = climate.find((item) => item.month === month);
        if (!entry) {
          return null;
        }
        const { bg, text } = getTempColor(entry.avgTempC);
        return (
          <div
            key={month}
            title={`${getMonthFullName(month, language)}: ${entry.avgTempC}°C`}
            className="relative min-w-0 flex-1 rounded py-1 text-center"
            style={{ backgroundColor: bg }}
          >
            {entry.precipitation && (
              <span className="absolute right-0.5 top-0.5" style={{ color: text, opacity: 0.75 }}>
                {entry.precipitation === "snow" ? (
                  <Snowflake className="h-1.5 w-1.5" />
                ) : (
                  <Droplet className="h-1.5 w-1.5" />
                )}
              </span>
            )}
            <p
              className="overflow-hidden text-ellipsis whitespace-nowrap px-px text-[8px] font-medium leading-tight"
              style={{ color: text, opacity: 0.8 }}
            >
              {getMonthLabel(month, language)}
            </p>
            <p className="text-[10px] font-semibold leading-tight" style={{ color: text }}>
              {entry.avgTempC}°
            </p>
          </div>
        );
      })}
    </div>
  );
}
