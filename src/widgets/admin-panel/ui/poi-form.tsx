"use client";

import { useRef, useState } from "react";
import { Languages, Plus, Star, Trash2 } from "lucide-react";
import { poiDifficulties, poiMainCategories, poiTags, seasons } from "@/entities/poi/model/constants";
import type { Difficulty, Poi, PoiInput, PoiMainCategory, PoiTag, Season } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import { getTranslations } from "@/shared/i18n/translations";
import { Button } from "@/shared/ui/button";
import { CityPicker } from "@/shared/ui/city-picker";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/cn";
import { translateFromRussian } from "@/shared/lib/admin-translate";
import { missingLanguages } from "@/shared/lib/translation-completeness";
import { LocationMapPicker } from "./location-map-picker";

const t = getTranslations("ru");

type PhotoFormState = {
  url: string;
  alt: string;
  author: string;
  season: Season | "";
};

type FormState = {
  regionId: string;
  name: string;
  nameEn: string;
  nameRu: string;
  nameJa: string;
  descriptionEn: string;
  descriptionRu: string;
  descriptionJa: string;
  lat: string;
  lng: string;
  rating: string;
  photoScore: string;
  importance: string;
  durationMinutes: string;
  difficulty: Difficulty;
  mustVisit: boolean;
  category: PoiMainCategory;
  tags: PoiTag[];
  seasons: string;
  bestTimeEn: string;
  bestTimeRu: string;
  bestTimeJa: string;
  photos: PhotoFormState[];
  status: "draft" | "published";
};

function toFormState(poi: Poi | undefined, defaultRegionId: string): FormState {
  if (!poi) {
    return {
      regionId: defaultRegionId,
      name: "",
      nameEn: "",
      nameRu: "",
      nameJa: "",
      descriptionEn: "",
      descriptionRu: "",
      descriptionJa: "",
      lat: "",
      lng: "",
      rating: "4.5",
      photoScore: "80",
      importance: "70",
      durationMinutes: "60",
      difficulty: "easy",
      mustVisit: true,
      category: "unique",
      tags: [],
      seasons: "all year",
      bestTimeEn: "",
      bestTimeRu: "Утро",
      bestTimeJa: "",
      photos: [{ url: "", alt: "", author: "", season: "" }],
      status: "draft"
    };
  }

  return {
    regionId: poi.regionId,
    name: poi.name,
    nameEn: poi.nameByLanguage.en,
    nameRu: poi.nameByLanguage.ru,
    nameJa: poi.nameByLanguage.ja,
    descriptionEn: poi.descriptionByLanguage.en,
    descriptionRu: poi.descriptionByLanguage.ru,
    descriptionJa: poi.descriptionByLanguage.ja,
    lat: String(poi.coordinates.lat),
    lng: String(poi.coordinates.lng),
    rating: String(poi.rating),
    photoScore: String(poi.photoScore),
    importance: String(poi.importance),
    durationMinutes: String(poi.durationMinutes),
    difficulty: poi.difficulty,
    mustVisit: poi.mustVisit,
    category: poi.category,
    tags: poi.tags,
    seasons: poi.seasons.join(", "),
    bestTimeEn: poi.bestTimeByLanguage.en.join(", "),
    bestTimeRu: poi.bestTimeByLanguage.ru.join(", "),
    bestTimeJa: poi.bestTimeByLanguage.ja.join(", "),
    photos:
      poi.photos.length > 0
        ? poi.photos.map((p) => ({ url: p.url, alt: p.alt, author: p.author ?? "", season: p.season ?? "" }))
        : [{ url: "", alt: "", author: "", season: "" }],
    status: poi.status
  };
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toPoiInput(form: FormState): PoiInput | { error: string } {
  if (!form.name.trim()) return { error: "Укажите название." };
  if (!form.descriptionRu.trim()) return { error: "Укажите описание (на русском)." };

  const lat = Number(form.lat);
  const lng = Number(form.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return { error: "Координаты должны быть числами." };
  if (lat < -90 || lat > 90) return { error: "Широта должна быть от -90 до 90." };
  if (lng < -180 || lng > 180) return { error: "Долгота должна быть от -180 до 180." };

  const rating = Number(form.rating);
  const photoScore = Number(form.photoScore);
  const durationMinutes = Number(form.durationMinutes);
  const importance = Number(form.importance);

  if ([rating, photoScore, durationMinutes, importance].some((value) => Number.isNaN(value))) {
    return { error: "Рейтинг, оценка фото, длительность и важность должны быть числами." };
  }
  if (rating < 0 || rating > 5) return { error: "Рейтинг должен быть от 0 до 5." };
  if (photoScore < 0 || photoScore > 100) return { error: "Оценка фото должна быть от 0 до 100." };
  if (importance < 0 || importance > 100) return { error: "Важность должна быть от 0 до 100." };
  if (durationMinutes < 0) return { error: "Длительность не может быть отрицательной." };

  const photos = form.photos
    .filter((photo) => photo.url.trim())
    .map((photo, index) => ({
      id: `${photo.url}-${index}`.slice(0, 60),
      url: photo.url.trim(),
      alt: photo.alt.trim() || form.name,
      ...(photo.author.trim() ? { author: photo.author.trim() } : {}),
      ...(photo.season ? { season: photo.season } : {})
    }));

  if (photos.length === 0) return { error: "Добавьте хотя бы одну ссылку на фото." };

  const name = form.name.trim();
  const descriptionRu = form.descriptionRu.trim();
  const bestTimeRu = splitList(form.bestTimeRu);
  const bestTimeEn = splitList(form.bestTimeEn);
  const bestTimeJa = splitList(form.bestTimeJa);

  return {
    regionId: form.regionId,
    name,
    nameByLanguage: {
      en: form.nameEn.trim() || name,
      ru: form.nameRu.trim() || name,
      ja: form.nameJa.trim() || name
    },
    description: descriptionRu,
    descriptionByLanguage: {
      en: form.descriptionEn.trim() || descriptionRu,
      ru: descriptionRu,
      ja: form.descriptionJa.trim() || descriptionRu
    },
    coordinates: { lat, lng },
    rating,
    photos,
    category: form.category,
    tags: form.tags,
    seasons: splitList(form.seasons),
    photoScore,
    mustVisit: form.mustVisit,
    bestTime: bestTimeRu,
    bestTimeByLanguage: {
      en: bestTimeEn.length > 0 ? bestTimeEn : bestTimeRu,
      ru: bestTimeRu,
      ja: bestTimeJa.length > 0 ? bestTimeJa : bestTimeRu
    },
    difficulty: form.difficulty,
    durationMinutes,
    importance,
    status: form.status
  };
}

const fieldLabel = "mb-1.5 block cursor-help text-xs font-semibold uppercase tracking-wide text-muted-foreground";
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
  frequentRegionIds?: string[];
  defaultRegionId?: string;
  onCancel: () => void;
  onSubmit: (input: PoiInput) => Promise<void> | void;
};

export function PoiForm({ poi, regions, frequentRegionIds = [], defaultRegionId, onCancel, onSubmit }: PoiFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(poi, defaultRegionId ?? regions[0]?.id ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState<number | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const photoFileInputs = useRef<Array<HTMLInputElement | null>>([]);

  const missingName = missingLanguages([{ en: form.nameEn, ja: form.nameJa }]);
  const missingDescription = missingLanguages([{ en: form.descriptionEn, ja: form.descriptionJa }]);
  const missingBestTime = missingLanguages([{ en: form.bestTimeEn, ja: form.bestTimeJa }]);

  const handleAutoTranslate = async () => {
    const items = [
      ...(form.nameRu.trim() ? [{ key: "name", text: form.nameRu.trim() }] : []),
      ...(form.descriptionRu.trim() ? [{ key: "description", text: form.descriptionRu.trim() }] : []),
      ...(form.bestTimeRu.trim() ? [{ key: "bestTime", text: form.bestTimeRu.trim() }] : [])
    ];

    if (items.length === 0) {
      setTranslateError("Сначала заполните название и описание на русском.");
      return;
    }

    setTranslateError(null);
    setIsTranslating(true);
    try {
      const translations = await translateFromRussian(items);
      setForm((p) => ({
        ...p,
        ...(translations.name
          ? { nameEn: translations.name.en ?? p.nameEn, nameJa: translations.name.ja ?? p.nameJa }
          : {}),
        ...(translations.description
          ? { descriptionEn: translations.description.en ?? p.descriptionEn, descriptionJa: translations.description.ja ?? p.descriptionJa }
          : {}),
        ...(translations.bestTime
          ? { bestTimeEn: translations.bestTime.en ?? p.bestTimeEn, bestTimeJa: translations.bestTime.ja ?? p.bestTimeJa }
          : {})
      }));
    } catch (err) {
      setTranslateError(err instanceof Error ? err.message : "Не удалось перевести текст.");
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleListValue = <T extends string>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const updatePhoto = (index: number, patch: Partial<PhotoFormState>) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.map((photo, i) => (i === index ? { ...photo, ...patch } : photo))
    }));
  };

  const uploadPhotoFile = async (index: number, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setPhotoUploadError("Файл слишком большой (максимум 10 МБ).");
      return;
    }

    setPhotoUploadError(null);
    setUploadingPhotoIndex(index);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/photos/upload", { method: "POST", body });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { url: string };
      updatePhoto(index, { url: data.url });
    } catch {
      setPhotoUploadError("Не удалось загрузить фото. Попробуйте другой файл.");
    } finally {
      setUploadingPhotoIndex(null);
    }
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

  const submitForm = async (status: FormState["status"]) => {
    const result = toPoiInput({ ...form, status });

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await submitForm(form.status);
  };

  const handlePublish = async () => {
    setForm((p) => ({ ...p, status: "published" }));
    await submitForm("published");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={fieldLabel} title="К какому городу относится эта локация — определяет, на карте какого города она появится.">
          Город
        </label>
        <CityPicker
          options={regions.map((region) => ({ id: region.id, name: region.name }))}
          value={form.regionId}
          onChange={(regionId) => setForm((p) => ({ ...p, regionId }))}
          frequentIds={frequentRegionIds}
        />
      </div>

      <div>
        <label className={fieldLabel} title="Базовое название места — используется как запасной вариант, если для какого-то языка не задано отдельное название ниже.">
          Название
        </label>
        <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nanzen-ji" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Заполните название и описание на русском, затем нажмите «Перевести», чтобы автоматически подставить EN и JA.
        </p>
        <Button type="button" variant="outline" onClick={handleAutoTranslate} disabled={isTranslating} className="shrink-0 gap-1.5">
          <Languages className="h-3.5 w-3.5" />
          {isTranslating ? "Перевод…" : "Перевести с русского"}
        </Button>
      </div>
      {translateError && <p className="text-sm font-medium text-red-600">{translateError}</p>}

      <div>
        <label
          className={fieldLabel}
          title="Название места на разных языках сайта — именно эти значения показываются на карте, в списке и в карточке места в зависимости от выбранного языка интерфейса."
        >
          Названия по языкам
        </label>
        <div className="grid grid-cols-3 gap-3">
          <Input value={form.nameEn} onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))} placeholder="EN — Nanzen-ji" />
          <Input value={form.nameRu} onChange={(e) => setForm((p) => ({ ...p, nameRu: e.target.value }))} placeholder="RU — Нандзэн-дзи" />
          <Input value={form.nameJa} onChange={(e) => setForm((p) => ({ ...p, nameJa: e.target.value }))} placeholder="JA — 南禅寺" />
        </div>
        {missingName.length > 0 && (
          <p className="mt-1 text-xs font-medium text-amber-600">
            Похоже, не переведено: {missingName.map((lang) => lang.toUpperCase()).join(", ")}
          </p>
        )}
      </div>

      <div>
        <label
          className={fieldLabel}
          title="Описание места на разных языках сайта — показывается в боковой панели и в карточке места в зависимости от выбранного языка интерфейса."
        >
          Описания по языкам
        </label>
        <div className="grid grid-cols-3 gap-3">
          <textarea
            className={textareaClass}
            rows={3}
            value={form.descriptionEn}
            onChange={(e) => setForm((p) => ({ ...p, descriptionEn: e.target.value }))}
            placeholder="EN — short description"
          />
          <textarea
            className={textareaClass}
            rows={3}
            value={form.descriptionRu}
            onChange={(e) => setForm((p) => ({ ...p, descriptionRu: e.target.value }))}
            placeholder="RU — короткое описание"
          />
          <textarea
            className={textareaClass}
            rows={3}
            value={form.descriptionJa}
            onChange={(e) => setForm((p) => ({ ...p, descriptionJa: e.target.value }))}
            placeholder="JA — 短い説明"
          />
        </div>
        {missingDescription.length > 0 && (
          <p className="mt-1 text-xs font-medium text-amber-600">
            Похоже, не переведено: {missingDescription.map((lang) => lang.toUpperCase()).join(", ")}
          </p>
        )}
      </div>

      <div>
        <label className={fieldLabel} title="Найдите место на карте, чтобы точно указать координаты, вместо того чтобы вводить их вручную.">
          Расположение на карте
        </label>
        <LocationMapPicker
          lat={form.lat}
          lng={form.lng}
          onChange={(lat, lng) => setForm((p) => ({ ...p, lat: lat.toFixed(6), lng: lng.toFixed(6) }))}
          fallbackCenter={
            regions.find((region) => region.id === form.regionId)?.center ?? { lat: 35.0116, lng: 135.7681 }
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={fieldLabel} title="Географическая широта — определяет положение метки места на карте.">
            Широта
          </label>
          <Input
            type="number"
            step="any"
            min="-90"
            max="90"
            value={form.lat}
            onChange={(e) => setForm((p) => ({ ...p, lat: e.target.value }))}
            placeholder="35.0116"
          />
        </div>
        <div>
          <label className={fieldLabel} title="Географическая долгота — определяет положение метки места на карте.">
            Долгота
          </label>
          <Input
            type="number"
            step="any"
            min="-180"
            max="180"
            value={form.lng}
            onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value }))}
            placeholder="135.7681"
          />
        </div>
      </div>

      <div>
        <label className={fieldLabel} title="Примерное время посещения в минутах — показывается в карточке места как метрика «Время».">
          Длительность (мин)
        </label>
        <Input type="number" min="0" value={form.durationMinutes} onChange={(e) => setForm((p) => ({ ...p, durationMinutes: e.target.value }))} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={fieldLabel} title="Физическая сложность посещения — отображается значком и текстом в карточке места.">
            Сложность
          </label>
          <select
            className={selectClass}
            value={form.difficulty}
            onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value as Difficulty }))}
          >
            {poiDifficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {t.difficulty[difficulty]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-2.5">
          <label
            className="inline-flex cursor-help items-center gap-2 text-sm font-medium"
            title="Показывает бейдж «Обязательно», добавляет бонус к очкам в режиме «Первое посещение» и гарантирует, что место всегда отображается на карте вне зависимости от порога плотности."
          >
            <input
              type="checkbox"
              checked={form.mustVisit}
              onChange={(e) => setForm((p) => ({ ...p, mustVisit: e.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            Обязательно к посещению
          </label>
        </div>
      </div>

      <div>
        <label
          className={fieldLabel}
          title="Черновик не показывается на сайте — виден только в админ-панели. Опубликуйте место, когда оно будет готово."
        >
          Статус публикации
        </label>
        <select
          className={selectClass}
          value={form.status}
          onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "draft" | "published" }))}
        >
          <option value="draft">Черновик (скрыт на сайте)</option>
          <option value="published">Опубликован</option>
        </select>
      </div>

      <div>
        <label className={fieldLabel} title="Категория места — определяет иконку маркера на карте и бейдж категории в карточке места. Выбирается ровно одна.">
          Категория
        </label>
        <div className="flex flex-wrap gap-2">
          {poiMainCategories.map((category) => (
            <button
              key={category}
              type="button"
              className={chipClass(form.category === category)}
              onClick={() => setForm((p) => ({ ...p, category }))}
            >
              {t.category[category]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          className={fieldLabel}
          title="Дополнительные метки — влияют на то, в какие режимы (Фотограф, Природа, Осень, Сакура, Первое посещение) попадает место, участвуют в поиске и показываются как бейджи в карточке."
        >
          Теги
        </label>
        <div className="flex flex-wrap gap-2">
          {poiTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={chipClass(form.tags.includes(tag))}
              onClick={() => setForm((p) => ({ ...p, tags: toggleListValue(p.tags, tag) }))}
            >
              {t.tag[tag]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          className={fieldLabel}
          title="Сезоны, характерные для места. Сейчас это поле не используется в интерфейсе сайта (фильтр сезонов слева работает по фото, см. ниже) — оставлено для будущего использования."
        >
          Сезоны (через запятую)
        </label>
        <Input value={form.seasons} onChange={(e) => setForm((p) => ({ ...p, seasons: e.target.value }))} placeholder="весна, осень" />
      </div>

      <div>
        <label
          className={fieldLabel}
          title="Лучшее время суток или периода для посещения на разных языках сайта — показывается в карточке места (метрика «Лучшее» и раздел «Лучшее время») в зависимости от выбранного языка интерфейса. Несколько значений через запятую, первое используется как основное."
        >
          Лучшее время по языкам (через запятую)
        </label>
        <div className="grid grid-cols-3 gap-3">
          <Input
            value={form.bestTimeEn}
            onChange={(e) => setForm((p) => ({ ...p, bestTimeEn: e.target.value }))}
            placeholder="EN — Morning, Sunset"
          />
          <Input
            value={form.bestTimeRu}
            onChange={(e) => setForm((p) => ({ ...p, bestTimeRu: e.target.value }))}
            placeholder="RU — Утро, Закат"
          />
          <Input
            value={form.bestTimeJa}
            onChange={(e) => setForm((p) => ({ ...p, bestTimeJa: e.target.value }))}
            placeholder="JA — 朝, 夕方"
          />
        </div>
        {missingBestTime.length > 0 && (
          <p className="mt-1 text-xs font-medium text-amber-600">
            Похоже, не переведено: {missingBestTime.map((lang) => lang.toUpperCase()).join(", ")}
          </p>
        )}
      </div>

      <div>
        <label className={fieldLabel} title="Фотографии места. Первая фотография (со звёздочкой) используется как главная в карточке и в списке.">
          Фотографии
        </label>
        <div className="space-y-2">
          {form.photos.map((photo, index) => (
            <div
              key={index}
              className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-2.5"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) void uploadPhotoFile(index, file);
              }}
            >
              <input
                ref={(el) => {
                  photoFileInputs.current[index] = el;
                }}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadPhotoFile(index, file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => photoFileInputs.current[index]?.click()}
                title="Кликните или перетащите файл, чтобы загрузить фото"
                className="relative h-16 w-16 shrink-0"
              >
                {uploadingPhotoIndex === index ? (
                  <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-primary/50 bg-primary/5 text-[9px] font-medium text-primary">
                    Загрузка…
                  </div>
                ) : photo.url.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.url}
                    alt=""
                    className="h-16 w-16 rounded-md border border-border bg-white object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-border p-1 text-center text-[9px] leading-tight text-muted-foreground">
                    Перетащите фото
                  </div>
                )}
                {index === 0 && (
                  <span className="absolute -left-1 -top-1 rounded bg-amber-400 px-1 text-[9px] font-semibold uppercase text-amber-950 shadow-sm">
                    Главная
                  </span>
                )}
              </button>
              <div className="grid flex-1 grid-cols-3 gap-2">
                <Input
                  value={photo.url}
                  onChange={(e) => updatePhoto(index, { url: e.target.value })}
                  placeholder="/photos/place/1.jpg или https://..."
                  className="col-span-3"
                />
                <Input value={photo.alt} onChange={(e) => updatePhoto(index, { alt: e.target.value })} placeholder="Альтернативный текст" />
                <Input
                  value={photo.author}
                  onChange={(e) => updatePhoto(index, { author: e.target.value })}
                  placeholder="Автор (необязательно)"
                />
                <select
                  className={selectClass}
                  value={photo.season}
                  onChange={(e) => updatePhoto(index, { season: e.target.value as Season | "" })}
                  title="Если указан сезон, это фото будет показываться в карточке места только когда в фильтре сезонов слева выбран этот сезон (или не выбран ни один)."
                >
                  <option value="">Любой сезон</option>
                  {seasons.map((season) => (
                    <option key={season} value={season}>
                      {t.season[season]}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                aria-label={index === 0 ? "Главное фото" : "Сделать главным фото"}
                title={index === 0 ? "Главное фото" : "Сделать главным фото"}
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
                aria-label="Удалить фото"
                onClick={() => setForm((p) => ({ ...p, photos: p.photos.filter((_, i) => i !== index) }))}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, photos: [...p.photos, { url: "", alt: "", author: "", season: "" }] }))}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            Добавить фото
          </button>
          {photoUploadError && <p className="text-xs font-medium text-red-600">{photoUploadError}</p>}
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="sticky -bottom-5 -mx-5 z-10 flex justify-end gap-2 border-t border-border bg-white px-5 py-4 shadow-[0_-6px_12px_-8px_rgba(15,23,42,0.15)]">
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        {form.status === "draft" && (
          <Button
            type="button"
            variant="outline"
            onClick={handlePublish}
            disabled={isSaving}
            title="Сохранить и сразу опубликовать место на сайте."
          >
            {isSaving ? "Публикация…" : "Опубликовать"}
          </Button>
        )}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
