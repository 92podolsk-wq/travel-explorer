import fs from "fs";
import path from "path";
import type { Country, CountryInput } from "@/entities/country/model/types";
import { readAreas } from "./areas-repository";

const dataFilePath = path.join(process.cwd(), "data", "countries.json");

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function readCountries(): Country[] {
  const raw = fs.readFileSync(dataFilePath, "utf-8");
  return JSON.parse(raw) as Country[];
}

function writeCountries(countries: Country[]) {
  fs.writeFileSync(dataFilePath, `${JSON.stringify(countries, null, 2)}\n`, "utf-8");
}

function generateUniqueId(name: string, existingIds: Set<string>) {
  const base = slugify(name) || "country";
  if (!existingIds.has(base)) {
    return base;
  }

  let suffix = 2;
  while (existingIds.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

export function createCountry(input: CountryInput): Country {
  const countries = readCountries();
  const existingIds = new Set(countries.map((country) => country.id));
  const id = input.id && !existingIds.has(input.id) ? input.id : generateUniqueId(input.name, existingIds);

  const country: Country = { ...input, id };
  countries.push(country);
  writeCountries(countries);

  return country;
}

export function updateCountry(id: string, input: CountryInput): Country | null {
  const countries = readCountries();
  const index = countries.findIndex((country) => country.id === id);

  if (index === -1) {
    return null;
  }

  const updated: Country = { ...input, id };
  countries[index] = updated;
  writeCountries(countries);

  return updated;
}

export type DeleteCountryResult =
  | { success: true }
  | { success: false; reason: "not-found" }
  | { success: false; reason: "in-use"; areaCount: number };

export function deleteCountry(id: string): DeleteCountryResult {
  const countries = readCountries();
  const next = countries.filter((country) => country.id !== id);

  if (next.length === countries.length) {
    return { success: false, reason: "not-found" };
  }

  const areaCount = readAreas().filter((area) => area.countryId === id).length;
  if (areaCount > 0) {
    return { success: false, reason: "in-use", areaCount };
  }

  writeCountries(next);
  return { success: true };
}
