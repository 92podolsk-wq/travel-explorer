export type GeocodeResult = {
  label: string;
  lat: number;
  lng: number;
};

export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  const res = await fetch(`/api/admin/geocode?q=${encodeURIComponent(query)}`);

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Не удалось найти место.");
  }

  const data = (await res.json()) as { results: GeocodeResult[] };
  return data.results;
}
