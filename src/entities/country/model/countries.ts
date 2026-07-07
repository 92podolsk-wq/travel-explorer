import { japanCountry } from "./japan";
import type { Country } from "./types";

export const seedCountries: Country[] = [japanCountry];

export const defaultCountry = japanCountry;

export function findCountryById(countries: Country[], id: string): Country | undefined {
  return countries.find((country) => country.id === id);
}
