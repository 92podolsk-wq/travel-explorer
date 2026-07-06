import type { Season } from "@/entities/poi/model/types";

export type Precipitation = "rain" | "snow";

export type MonthClimate = {
  month: number;
  avgTempC: number;
  precipitation?: Precipitation;
};

export const seasonMonths: Record<Season, number[]> = {
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  autumn: [9, 10, 11],
  winter: [12, 1, 2]
};

const kansaiClimate: MonthClimate[] = [
  { month: 1, avgTempC: 4, precipitation: "snow" },
  { month: 2, avgTempC: 5 },
  { month: 3, avgTempC: 9 },
  { month: 4, avgTempC: 15 },
  { month: 5, avgTempC: 20 },
  { month: 6, avgTempC: 23, precipitation: "rain" },
  { month: 7, avgTempC: 27, precipitation: "rain" },
  { month: 8, avgTempC: 29 },
  { month: 9, avgTempC: 26, precipitation: "rain" },
  { month: 10, avgTempC: 20 },
  { month: 11, avgTempC: 13 },
  { month: 12, avgTempC: 7 }
];

const climateByRegion: Record<string, MonthClimate[]> = {
  kyoto: kansaiClimate,
  osaka: kansaiClimate.map((entry) =>
    entry.month === 1 ? { ...entry, avgTempC: 6, precipitation: undefined } : { ...entry, avgTempC: entry.avgTempC + 1 }
  )
};

export function getClimateForRegion(regionId: string): MonthClimate[] {
  return climateByRegion[regionId] ?? kansaiClimate;
}

export function monthsForSeasons(selectedSeasons: Season[]): number[] {
  const order: Season[] = ["spring", "summer", "autumn", "winter"];
  const months: number[] = [];
  for (const season of order) {
    if (selectedSeasons.includes(season)) {
      months.push(...seasonMonths[season]);
    }
  }
  return months;
}
