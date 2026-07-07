import type { Language } from "@/shared/i18n/types";
import type { Country, CountryInput } from "@/entities/country/model/types";
import { prisma } from "./prisma-client";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

type CountryRow = Awaited<ReturnType<typeof prisma.country.findFirstOrThrow>>;

function toCountry(row: CountryRow): Country {
  return {
    id: row.id,
    name: row.name,
    nameByLanguage: row.nameByLanguage as Record<Language, string>
  };
}

export async function readCountries(): Promise<Country[]> {
  const rows = await prisma.country.findMany();
  return rows.map(toCountry);
}

export async function createCountry(input: CountryInput): Promise<Country> {
  const existingIds = new Set((await prisma.country.findMany({ select: { id: true } })).map((row) => row.id));
  const id = input.id && !existingIds.has(input.id) ? input.id : generateUniqueId(input.name, existingIds);

  const row = await prisma.country.create({ data: { id, name: input.name, nameByLanguage: input.nameByLanguage } });
  return toCountry(row);
}

export async function updateCountry(id: string, input: CountryInput): Promise<Country | null> {
  const existing = await prisma.country.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  const row = await prisma.country.update({ where: { id }, data: { name: input.name, nameByLanguage: input.nameByLanguage } });
  return toCountry(row);
}

export type DeleteCountryResult =
  | { success: true }
  | { success: false; reason: "not-found" }
  | { success: false; reason: "in-use"; areaCount: number };

export async function deleteCountry(id: string): Promise<DeleteCountryResult> {
  const existing = await prisma.country.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, reason: "not-found" };
  }

  const areaCount = await prisma.area.count({ where: { countryId: id } });
  if (areaCount > 0) {
    return { success: false, reason: "in-use", areaCount };
  }

  await prisma.country.delete({ where: { id } });
  return { success: true };
}
