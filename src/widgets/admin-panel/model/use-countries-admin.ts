import { useState } from "react";
import type { Country, CountryInput } from "@/entities/country/model/types";
import type { Selection } from "./types";

export function useCountriesAdmin(setSelection: (selection: Selection) => void) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/countries");
    if (!res.ok) throw new Error("Failed to load countries");
    setCountries((await res.json()) as Country[]);
  }

  async function handleCreate(input: CountryInput) {
    setError(null);
    const res = await fetch("/api/countries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setError("Не удалось создать страну.");
      return;
    }

    const created = (await res.json()) as Country;
    await load();
    setSelection({ mode: "edit", id: created.id });
  }

  async function handleUpdate(id: string, input: CountryInput) {
    setError(null);
    const res = await fetch(`/api/countries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setError("Не удалось сохранить изменения.");
      return;
    }

    await load();
  }

  async function handleDelete(country: Country) {
    if (!window.confirm(`Удалить «${country.name}»? Это действие нельзя отменить.`)) {
      return;
    }

    setError(null);
    const res = await fetch(`/api/countries/${country.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Не удалось удалить страну.");
      return;
    }

    setSelection({ mode: "empty" });
    await load();
  }

  return { countries, error, load, handleCreate, handleUpdate, handleDelete };
}
