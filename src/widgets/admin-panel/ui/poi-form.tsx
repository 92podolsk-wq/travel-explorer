"use client";

import { useState } from "react";
import { Plus, Star, Trash2 } from "lucide-react";
import { poiCategories, poiDifficulties, poiTags } from "@/entities/poi/model/constants";
import type { Difficulty, Poi, PoiCategory, PoiInput, PoiTag, PoiVisibilityMode } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/cn";

type PhotoFormState = {
  url: string;
  alt: string;
  author: string;
};

type FormState = {
  regionId: string;
  name: string;
  description: string;
  lat: string;
  lng: string;
  rating: string;
  photoScore: string;
  importance: string;
  durationMinutes: string;
  difficulty: Difficulty;
  mustVisit: boolean;
  visibilityMode: PoiVisibilityMode;
  categories: PoiCategory[];
  tags: PoiTag[];
  seasons: string;
  bestTime: string;
  photos: PhotoFormState[];
};

function toFormState(poi: Poi | undefined, defaultRegionId: string): FormState {
  if (!poi) {
    return {
      regionId: defaultRegionId,
      name: "",
      description: "",
      lat: "",
      lng: "",
      rating: "4.5",
      photoScore: "80",
      importance: "70",
      durationMinutes: "60",
      difficulty: "easy",
      mustVisit: false,
      visibilityMode: "default",
      categories: [],
      tags: [],
      seasons: "all year",
      bestTime: "Morning",
      photos: [{ url: "", alt: "", author: "" }]
    };
  }

  return {
    regionId: poi.regionId,
    name: poi.name,
    description: poi.description,
    lat: String(poi.coordinates.lat),
    lng: String(poi.coordinates.lng),
    rating: String(poi.rating),
    photoScore: String(poi.photoScore),
    importance: String(poi.importance),
    durationMinutes: String(poi.durationMinutes),
    difficulty: poi.difficulty,
    mustVisit: poi.mustVisit,
    visibilityMode: poi.visibilityMode ?? "default",
    categories: poi.categories,
    tags: poi.tags,
    seasons: poi.seasons.join(", "),
    bestTime: poi.bestTime.join(", "),
    photos: poi.photos.length > 0 ? poi.photos.map((p) => ({ url: p.url, alt: p.alt, author: p.author ?? "" })) : [{ url: "", alt: "", author: "" }]
  };
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toPoiInput(form: FormState): PoiInput | { error: string } {
  if (!form.name.trim()) return { error: "Name is required." };
  if (!form.description.trim()) return { error: "Description is required." };

  const lat = Number(form.lat);
  const lng = Number(form.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return { error: "Coordinates must be valid numbers." };

  if (form.categories.length === 0) return { error: "Pick at least one category." };

  const photos = form.photos
    .filter((photo) => photo.url.trim())
    .map((photo, index) => ({
      id: `${photo.url}-${index}`.slice(0, 60),
      url: photo.url.trim(),
      alt: photo.alt.trim() || form.name,
      ...(photo.author.trim() ? { author: photo.author.trim() } : {})
    }));

  if (photos.length === 0) return { error: "Add at least one photo URL." };

  return {
    regionId: form.regionId,
    name: form.name.trim(),
    description: form.description.trim(),
    coordinates: { lat, lng },
    rating: Number(form.rating) || 0,
    photos,
    categories: form.categories,
    tags: form.tags,
    seasons: splitList(form.seasons),
    photoScore: Number(form.photoScore) || 0,
    mustVisit: form.mustVisit,
    visibilityMode: form.visibilityMode,
    bestTime: splitList(form.bestTime),
    difficulty: form.difficulty,
    durationMinutes: Number(form.durationMinutes) || 0,
    importance: Number(form.importance) || 0
  };
}

const fieldLabel = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const textareaClass =
  "w-full rounded-md border border-border bg-white/[0.78] px-3 py-2 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-ring/25";
const selectClass =
  "h-11 w-full rounded-md border border-border bg-white/[0.78] px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-ring/25";
const chipClass = (active: boolean) =>
  cn(
    "cursor-pointer select-none rounded-md border px-2.5 py-1 text-xs font-medium transition",
    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-muted-foreground hover:bg-muted"
  );

type PoiFormProps = {
  poi?: Poi;
  regions: Region[];
  onCancel: () => void;
  onSubmit: (input: PoiInput) => Promise<void> | void;
};

export function PoiForm({ poi, regions, onCancel, onSubmit }: PoiFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(poi, regions[0]?.id ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toggleListValue = <T extends string>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const updatePhoto = (index: number, patch: Partial<PhotoFormState>) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.map((photo, i) => (i === index ? { ...photo, ...patch } : photo))
    }));
  };

  const setMainPhoto = (index: number) => {
    setForm((prev) => {
      if (index === 0) {
        return prev;
      }

      const photos = [...prev.photos];
      const [selected] = photos.splice(index, 1);
      photos.unshift(selected);

      return { ...prev, photos };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = toPoiInput(form);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSubmit(result);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-white p-5 shadow-sm">
      <div>
        <label className={fieldLabel}>Region</label>
        <select
          className={selectClass}
          value={form.regionId}
          onChange={(e) => setForm((p) => ({ ...p, regionId: e.target.value }))}
        >
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={fieldLabel}>Name</label>
        <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nanzen-ji" />
      </div>

      <div>
        <label className={fieldLabel}>Description</label>
        <textarea
          className={textareaClass}
          rows={3}
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="A short description shown in the sidebar and details panel."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={fieldLabel}>Latitude</label>
          <Input
            type="number"
            step="0.0001"
            value={form.lat}
            onChange={(e) => setForm((p) => ({ ...p, lat: e.target.value }))}
            placeholder="35.0116"
          />
        </div>
        <div>
          <label className={fieldLabel}>Longitude</label>
          <Input
            type="number"
            step="0.0001"
            value={form.lng}
            onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value }))}
            placeholder="135.7681"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className={fieldLabel}>Rating</label>
          <Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))} />
        </div>
        <div>
          <label className={fieldLabel}>Photo score</label>
          <Input type="number" min="0" max="100" value={form.photoScore} onChange={(e) => setForm((p) => ({ ...p, photoScore: e.target.value }))} />
        </div>
        <div>
          <label className={fieldLabel}>Importance</label>
          <Input type="number" min="0" max="100" value={form.importance} onChange={(e) => setForm((p) => ({ ...p, importance: e.target.value }))} />
        </div>
        <div>
          <label className={fieldLabel}>Duration (min)</label>
          <Input type="number" min="0" value={form.durationMinutes} onChange={(e) => setForm((p) => ({ ...p, durationMinutes: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={fieldLabel}>Difficulty</label>
          <select
            className={selectClass}
            value={form.difficulty}
            onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value as Difficulty }))}
          >
            {poiDifficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-2.5">
          <label className="inline-flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.mustVisit}
              onChange={(e) => setForm((p) => ({ ...p, mustVisit: e.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            Must visit
          </label>
        </div>
      </div>

      <div>
        <label className={fieldLabel}>Map visibility</label>
        <select
          className={selectClass}
          value={form.visibilityMode}
          onChange={(e) => setForm((p) => ({ ...p, visibilityMode: e.target.value as PoiVisibilityMode }))}
        >
          <option value="default">Show by default (visible at any zoom)</option>
          <option value="zoomed-in">Show only when zoomed in (zoom above 12)</option>
        </select>
      </div>

      <div>
        <label className={fieldLabel}>Categories</label>
        <div className="flex flex-wrap gap-2">
          {poiCategories.map((category) => (
            <button
              key={category}
              type="button"
              className={chipClass(form.categories.includes(category))}
              onClick={() => setForm((p) => ({ ...p, categories: toggleListValue(p.categories, category) }))}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={fieldLabel}>Tags</label>
        <div className="flex flex-wrap gap-2">
          {poiTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={chipClass(form.tags.includes(tag))}
              onClick={() => setForm((p) => ({ ...p, tags: toggleListValue(p.tags, tag) }))}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={fieldLabel}>Seasons (comma separated)</label>
          <Input value={form.seasons} onChange={(e) => setForm((p) => ({ ...p, seasons: e.target.value }))} placeholder="spring, autumn" />
        </div>
        <div>
          <label className={fieldLabel}>Best time (comma separated)</label>
          <Input value={form.bestTime} onChange={(e) => setForm((p) => ({ ...p, bestTime: e.target.value }))} placeholder="Morning, Dusk" />
        </div>
      </div>

      <div>
        <label className={fieldLabel}>Photos</label>
        <div className="space-y-2">
          {form.photos.map((photo, index) => (
            <div key={index} className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-2.5">
              <div className="relative h-16 w-16 shrink-0">
                {photo.url.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.url}
                    alt=""
                    className="h-16 w-16 rounded-md border border-border bg-white object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-border text-[10px] text-muted-foreground">
                    Preview
                  </div>
                )}
                {index === 0 && (
                  <span className="absolute -left-1 -top-1 rounded bg-amber-400 px-1 text-[9px] font-semibold uppercase text-amber-950 shadow-sm">
                    Main
                  </span>
                )}
              </div>
              <div className="grid flex-1 grid-cols-3 gap-2">
                <Input
                  value={photo.url}
                  onChange={(e) => updatePhoto(index, { url: e.target.value })}
                  placeholder="/photos/place/1.jpg or https://..."
                  className="col-span-3"
                />
                <Input value={photo.alt} onChange={(e) => updatePhoto(index, { alt: e.target.value })} placeholder="Alt text" />
                <Input
                  value={photo.author}
                  onChange={(e) => updatePhoto(index, { author: e.target.value })}
                  placeholder="Author (optional)"
                  className="col-span-2"
                />
              </div>
              <button
                type="button"
                aria-label={index === 0 ? "Main photo" : "Set as main photo"}
                title={index === 0 ? "Main photo" : "Set as main photo"}
                disabled={index === 0}
                onClick={() => setMainPhoto(index)}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition",
                  index === 0
                    ? "cursor-default border-amber-300 bg-amber-50 text-amber-500"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                <Star className={cn("h-4 w-4", index === 0 && "fill-current")} />
              </button>
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => setForm((p) => ({ ...p, photos: p.photos.filter((_, i) => i !== index) }))}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, photos: [...p.photos, { url: "", alt: "", author: "" }] }))}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            Add photo
          </button>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
