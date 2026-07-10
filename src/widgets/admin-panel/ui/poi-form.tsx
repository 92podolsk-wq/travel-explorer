"use client";

import { useState } from "react";
import { Languages, Plus, Star, Trash2 } from "lucide-react";
import { poiCategories, poiDifficulties, poiTags, seasons } from "@/entities/poi/model/constants";
import type { Difficulty, Poi, PoiCategory, PoiInput, PoiTag, PoiVisibilityMode, Season } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import { getTranslations } from "@/shared/i18n/translations";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/cn";
import { translateFromRussian } from "@/shared/lib/admin-translate";
import { missingLanguages } from "@/shared/lib/translation-completeness";

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
  visibilityMode: PoiVisibilityMode;
  categories: PoiCategory[];
  tags: PoiTag[];
  seasons: string;
  bestTime: string;
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
      mustVisit: false,
      visibilityMode: "default",
      categories: [],
      tags: [],
      seasons: "all year",
      bestTime: "Morning",
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
    visibilityMode: poi.visibilityMode ?? "default",
    categories: poi.categories,
    tags: poi.tags,
    seasons: poi.seasons.join(", "),
    bestTime: poi.bestTime.join(", "),
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

  if (form.categories.length === 0) return { error: "Выберите хотя бы одну категорию." };

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
    importance: Number(form.importance) || 0,
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
  defaultRegionId?: string;
  onCancel: () => void;
  onSubmit: (input: PoiInput) => Promise<void> | void;
};

export function PoiForm({ poi, regions, defaultRegionId, onCancel, onSubmit }: PoiFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(poi, defaultRegionId ?? regions[0]?.id ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const missingName = missingLanguages([{ en: form.nameEn, ja: form.nameJa }]);
  const missingDescription = missingLanguages([{ en: form.descriptionEn, ja: form.descriptionJa }]);

  const handleAutoTranslate = async () => {
    const items = [
      ...(form.nameRu.trim() ? [{ key: "name", text: form.nameRu.trim() }] : []),
      ...(form.descriptionRu.trim() ? [{ key: "description", text: form.descriptionRu.trim() }] : [])
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={fieldLabel} title="К какому городу относится эта локация — определяет, на карте какого города она появится.">
          Город
        </label>
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={fieldLabel} title="Географическая широта — определяет положение метки места на карте.">
            Широта
          </label>
          <Input
            type="number"
            step="0.0001"
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
            step="0.0001"
            value={form.lng}
            onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value }))}
            placeholder="135.7681"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className={fieldLabel} title="Оценка места от 0 до 5 — показывается звёздочкой в карточке и в списке мест.">
            Рейтинг
          </label>
          <Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))} />
        </div>
        <div>
          <label
            className={fieldLabel}
            title="Внутренняя оценка (0–100) для сортировки мест в режимах «Фотограф», «Природа», «Осень» и «Сакура». Не влияет на число отображаемых фото."
          >
            Оценка фото
          </label>
          <Input type="number" min="0" max="100" value={form.photoScore} onChange={(e) => setForm((p) => ({ ...p, photoScore: e.target.value }))} />
        </div>
        <div>
          <label
            className={fieldLabel}
            title="Показатель важности (0–100) — определяет сортировку мест в режиме «Первое посещение»: чем выше значение, тем выше место в списке."
          >
            Важность
          </label>
          <Input type="number" min="0" max="100" value={form.importance} onChange={(e) => setForm((p) => ({ ...p, importance: e.target.value }))} />
        </div>
        <div>
          <label className={fieldLabel} title="Примерное время посещения в минутах — показывается в карточке места как метрика «Время».">
            Длительность (мин)
          </label>
          <Input type="number" min="0" value={form.durationMinutes} onChange={(e) => setForm((p) => ({ ...p, durationMinutes: e.target.value }))} />
        </div>
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
          title="Определяет, при каком масштабе карты место видно."
        >
          Видимость на карте
        </label>
        <select
          className={selectClass}
          value={form.visibilityMode}
          onChange={(e) => setForm((p) => ({ ...p, visibilityMode: e.target.value as PoiVisibilityMode }))}
        >
          <option value="default">Показывать всегда (видно при любом масштабе)</option>
          <option value="zoomed-in">Показывать только при приближении (масштаб больше 12)</option>
        </select>
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
        <label className={fieldLabel} title="Тип места — определяет иконку маркера на карте и бейджи категории в карточке места. Можно выбрать несколько.">
          Категории
        </label>
        <div className="flex flex-wrap gap-2">
          {poiCategories.map((category) => (
            <button
              key={category}
              type="button"
              className={chipClass(form.categories.includes(category))}
              onClick={() => setForm((p) => ({ ...p, categories: toggleListValue(p.categories, category) }))}
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

      <div className="grid grid-cols-2 gap-3">
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
            title="Лучшее время суток или периода для посещения. Первое значение показывается в карточке как метрика «Лучшее», все значения — в разделе «Лучшее время»."
          >
            Лучшее время (через запятую)
          </label>
          <Input value={form.bestTime} onChange={(e) => setForm((p) => ({ ...p, bestTime: e.target.value }))} placeholder="Утро, Закат" />
        </div>
      </div>

      <div>
        <label className={fieldLabel} title="Фотографии места. Первая фотография (со звёздочкой) используется как главная в карточке и в списке.">
          Фотографии
        </label>
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
                    Превью
                  </div>
                )}
                {index === 0 && (
                  <span className="absolute -left-1 -top-1 rounded bg-amber-400 px-1 text-[9px] font-semibold uppercase text-amber-950 shadow-sm">
                    Главная
                  </span>
                )}
              </div>
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
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
