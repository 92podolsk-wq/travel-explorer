"use client";

import { useEffect, useState } from "react";
import { LogOut, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import type { Poi, PoiInput } from "@/entities/poi/model/types";
import type { Region, RegionInput } from "@/entities/region/model/types";
import { getTranslations } from "@/shared/i18n/translations";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/cn";
import { PoiForm } from "./poi-form";
import { RegionForm } from "./region-form";

const t = getTranslations("ru");

type AuthViewState = { mode: "loading" } | { mode: "login" } | { mode: "ready" };

type PlacesViewState = { mode: "list" } | { mode: "create" } | { mode: "edit"; poi: Poi };

type RegionsViewState = { mode: "list" } | { mode: "create" } | { mode: "edit"; region: Region };

export function AdminPanel() {
  const [authView, setAuthView] = useState<AuthViewState>({ mode: "loading" });
  const [activeTab, setActiveTab] = useState<"places" | "regions">("places");

  const [pois, setPois] = useState<Poi[]>([]);
  const [placesView, setPlacesView] = useState<PlacesViewState>({ mode: "list" });
  const [placesError, setPlacesError] = useState<string | null>(null);

  const [regions, setRegions] = useState<Region[]>([]);
  const [regionsView, setRegionsView] = useState<RegionsViewState>({ mode: "list" });
  const [regionsError, setRegionsError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  async function loadPois() {
    const res = await fetch("/api/pois");
    const data = (await res.json()) as Poi[];
    setPois(data);
  }

  async function loadRegions() {
    const res = await fetch("/api/regions");
    const data = (await res.json()) as Region[];
    setRegions(data);
  }

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/session");
      const { authenticated } = (await res.json()) as { authenticated: boolean };

      if (authenticated) {
        await Promise.all([loadPois(), loadRegions()]);
        setAuthView({ mode: "ready" });
      } else {
        setAuthView({ mode: "login" });
      }
    })();
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    if (!res.ok) {
      setLoginError("Неверный пароль.");
      return;
    }

    setPassword("");
    await Promise.all([loadPois(), loadRegions()]);
    setAuthView({ mode: "ready" });
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthView({ mode: "login" });
  };

  const handleCreatePlace = async (input: PoiInput) => {
    setPlacesError(null);
    const res = await fetch("/api/pois", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setPlacesError("Не удалось создать место.");
      return;
    }

    await loadPois();
    setPlacesView({ mode: "list" });
  };

  const handleUpdatePlace = async (id: string, input: PoiInput) => {
    setPlacesError(null);
    const res = await fetch(`/api/pois/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setPlacesError("Не удалось сохранить изменения.");
      return;
    }

    await loadPois();
    setPlacesView({ mode: "list" });
  };

  const handleDeletePlace = async (poi: Poi) => {
    if (!window.confirm(`Удалить «${poi.name}»? Это действие нельзя отменить.`)) {
      return;
    }

    setPlacesError(null);
    const res = await fetch(`/api/pois/${poi.id}`, { method: "DELETE" });

    if (!res.ok) {
      setPlacesError("Не удалось удалить место.");
      return;
    }

    await loadPois();
  };

  const handleCreateRegion = async (input: RegionInput) => {
    setRegionsError(null);
    const res = await fetch("/api/regions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setRegionsError("Не удалось создать регион.");
      return;
    }

    await loadRegions();
    setRegionsView({ mode: "list" });
  };

  const handleUpdateRegion = async (id: string, input: RegionInput) => {
    setRegionsError(null);
    const res = await fetch(`/api/regions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setRegionsError("Не удалось сохранить изменения.");
      return;
    }

    await loadRegions();
    setRegionsView({ mode: "list" });
  };

  const handleDeleteRegion = async (region: Region) => {
    if (!window.confirm(`Удалить «${region.name}»? Это действие нельзя отменить.`)) {
      return;
    }

    setRegionsError(null);
    const res = await fetch(`/api/regions/${region.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setRegionsError(data?.error ?? "Не удалось удалить регион.");
      return;
    }

    await loadRegions();
  };

  if (authView.mode === "loading") {
    return null;
  }

  if (authView.mode === "login") {
    return (
      <div className="mx-auto mt-24 max-w-sm rounded-lg border border-border bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold">Админ-панель Travel Explorer</h1>
        <p className="mb-5 text-sm text-muted-foreground">Введите пароль администратора для управления местами.</p>
        <form onSubmit={handleLogin} className="space-y-3">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            autoFocus
          />
          {loginError && <p className="text-sm font-medium text-red-600">{loginError}</p>}
          <Button type="submit" className="w-full">
            Войти
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Админ-панель Travel Explorer</h1>
          <p className="text-sm text-muted-foreground">
            Мест: {pois.length} · Регионов: {regions.length}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleLogout} className="gap-1.5">
          <LogOut className="h-4 w-4" />
          Выйти
        </Button>
      </div>

      <div className="mb-6 flex gap-1 rounded-md border border-border bg-muted/60 p-0.5">
        <button
          type="button"
          onClick={() => setActiveTab("places")}
          className={cn(
            "flex-1 rounded px-3 py-2 text-sm font-semibold transition",
            activeTab === "places" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Места
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("regions")}
          className={cn(
            "flex-1 rounded px-3 py-2 text-sm font-semibold transition",
            activeTab === "regions" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Регионы
        </button>
      </div>

      {activeTab === "places" && (
        <>
          {placesError && <p className="mb-4 text-sm font-medium text-red-600">{placesError}</p>}

          {placesView.mode === "list" && (
            <>
              <Button type="button" onClick={() => setPlacesView({ mode: "create" })} className="mb-5 gap-1.5">
                <Plus className="h-4 w-4" />
                Добавить место
              </Button>

              <div className="space-y-2">
                {pois.map((poi) => (
                  <div
                    key={poi.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-white p-3 shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {poi.photos[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={poi.photos[0].url}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-md border border-border object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-[10px] text-muted-foreground">
                          Нет фото
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold">{poi.name}</p>
                          <span className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                            {poi.regionId}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {poi.categories.map((category) => t.category[category]).join(", ")} · {poi.rating.toFixed(1)}★
                        </p>
                        {poi.visibilityMode === "zoomed-in" && (
                          <span
                            className="mt-1 inline-block rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700"
                            title="Место показывается на карте только при масштабе больше 12"
                          >
                            Только при увеличении
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        aria-label={`Редактировать ${poi.name}`}
                        onClick={() => setPlacesView({ mode: "edit", poi })}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Удалить ${poi.name}`}
                        onClick={() => handleDeletePlace(poi)}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {placesView.mode === "create" && (
            <PoiForm regions={regions} onCancel={() => setPlacesView({ mode: "list" })} onSubmit={handleCreatePlace} />
          )}

          {placesView.mode === "edit" && (
            <PoiForm
              regions={regions}
              poi={placesView.poi}
              onCancel={() => setPlacesView({ mode: "list" })}
              onSubmit={(input) => handleUpdatePlace(placesView.poi.id, input)}
            />
          )}
        </>
      )}

      {activeTab === "regions" && (
        <>
          {regionsError && <p className="mb-4 text-sm font-medium text-red-600">{regionsError}</p>}

          {regionsView.mode === "list" && (
            <>
              <Button type="button" onClick={() => setRegionsView({ mode: "create" })} className="mb-5 gap-1.5">
                <Plus className="h-4 w-4" />
                Добавить регион
              </Button>

              <div className="space-y-2">
                {regions.map((region) => (
                  <div
                    key={region.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-white p-3 shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {region.name} <span className="text-muted-foreground">({region.sealCharacter})</span>
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {region.country} · масштаб {region.defaultZoom} · UTC+{region.timezoneOffsetHours}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        aria-label={`Редактировать ${region.name}`}
                        onClick={() => setRegionsView({ mode: "edit", region })}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Удалить ${region.name}`}
                        onClick={() => handleDeleteRegion(region)}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {regionsView.mode === "create" && (
            <RegionForm onCancel={() => setRegionsView({ mode: "list" })} onSubmit={handleCreateRegion} />
          )}

          {regionsView.mode === "edit" && (
            <RegionForm
              region={regionsView.region}
              onCancel={() => setRegionsView({ mode: "list" })}
              onSubmit={(input) => handleUpdateRegion(regionsView.region.id, input)}
            />
          )}
        </>
      )}
    </div>
  );
}
