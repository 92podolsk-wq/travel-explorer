"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import type { Area, AreaInput } from "@/entities/area/model/types";
import type { Country, CountryInput } from "@/entities/country/model/types";
import type { Poi, PoiInput } from "@/entities/poi/model/types";
import type { Region, RegionInput } from "@/entities/region/model/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/cn";
import { AreaForm } from "./area-form";
import { CountryForm } from "./country-form";
import { MasterDetail } from "./master-detail";
import { PoiForm } from "./poi-form";
import { RegionForm } from "./region-form";

type AuthViewState = { mode: "loading" } | { mode: "login" } | { mode: "ready" };

type Selection = { mode: "empty" } | { mode: "create" } | { mode: "edit"; id: string };

type Tab = "countries" | "areas" | "cities" | "locations";

const tabLabels: Record<Tab, string> = {
  countries: "Страны",
  areas: "Регионы",
  cities: "Города",
  locations: "Локации"
};

export function AdminPanel() {
  const [authView, setAuthView] = useState<AuthViewState>({ mode: "loading" });
  const [activeTab, setActiveTab] = useState<Tab>("locations");

  const [countries, setCountries] = useState<Country[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [pois, setPois] = useState<Poi[]>([]);

  const [countrySelection, setCountrySelection] = useState<Selection>({ mode: "empty" });
  const [areaSelection, setAreaSelection] = useState<Selection>({ mode: "empty" });
  const [citySelection, setCitySelection] = useState<Selection>({ mode: "empty" });
  const [locationSelection, setLocationSelection] = useState<Selection>({ mode: "empty" });
  const [locationCityFilter, setLocationCityFilter] = useState<string>("all");

  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [areasError, setAreasError] = useState<string | null>(null);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [locationsError, setLocationsError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  async function loadCountries() {
    const res = await fetch("/api/countries");
    setCountries((await res.json()) as Country[]);
  }
  async function loadAreas() {
    const res = await fetch("/api/areas");
    setAreas((await res.json()) as Area[]);
  }
  async function loadRegions() {
    const res = await fetch("/api/regions");
    setRegions((await res.json()) as Region[]);
  }
  async function loadPois() {
    const res = await fetch("/api/pois");
    setPois((await res.json()) as Poi[]);
  }

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/session");
      const { authenticated } = (await res.json()) as { authenticated: boolean };

      if (authenticated) {
        await Promise.all([loadCountries(), loadAreas(), loadRegions(), loadPois()]);
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
    await Promise.all([loadCountries(), loadAreas(), loadRegions(), loadPois()]);
    setAuthView({ mode: "ready" });
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthView({ mode: "login" });
  };

  const handleCreateCountry = async (input: CountryInput) => {
    setCountriesError(null);
    const res = await fetch("/api/countries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setCountriesError("Не удалось создать страну.");
      return;
    }

    const created = (await res.json()) as Country;
    await loadCountries();
    setCountrySelection({ mode: "edit", id: created.id });
  };

  const handleUpdateCountry = async (id: string, input: CountryInput) => {
    setCountriesError(null);
    const res = await fetch(`/api/countries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setCountriesError("Не удалось сохранить изменения.");
      return;
    }

    await loadCountries();
  };

  const handleDeleteCountry = async (country: Country) => {
    if (!window.confirm(`Удалить «${country.name}»? Это действие нельзя отменить.`)) {
      return;
    }

    setCountriesError(null);
    const res = await fetch(`/api/countries/${country.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setCountriesError(data?.error ?? "Не удалось удалить страну.");
      return;
    }

    setCountrySelection({ mode: "empty" });
    await loadCountries();
  };

  const handleCreateArea = async (input: AreaInput) => {
    setAreasError(null);
    const res = await fetch("/api/areas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setAreasError("Не удалось создать регион.");
      return;
    }

    const created = (await res.json()) as Area;
    await loadAreas();
    setAreaSelection({ mode: "edit", id: created.id });
  };

  const handleUpdateArea = async (id: string, input: AreaInput) => {
    setAreasError(null);
    const res = await fetch(`/api/areas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setAreasError("Не удалось сохранить изменения.");
      return;
    }

    await loadAreas();
  };

  const handleDeleteArea = async (area: Area) => {
    if (!window.confirm(`Удалить «${area.name}»? Это действие нельзя отменить.`)) {
      return;
    }

    setAreasError(null);
    const res = await fetch(`/api/areas/${area.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setAreasError(data?.error ?? "Не удалось удалить регион.");
      return;
    }

    setAreaSelection({ mode: "empty" });
    await loadAreas();
  };

  const handleCreateCity = async (input: RegionInput) => {
    setCitiesError(null);
    const res = await fetch("/api/regions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setCitiesError("Не удалось создать город.");
      return;
    }

    const created = (await res.json()) as Region;
    await loadRegions();
    setCitySelection({ mode: "edit", id: created.id });
  };

  const handleUpdateCity = async (id: string, input: RegionInput) => {
    setCitiesError(null);
    const res = await fetch(`/api/regions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setCitiesError("Не удалось сохранить изменения.");
      return;
    }

    await loadRegions();
  };

  const handleDeleteCity = async (region: Region) => {
    if (!window.confirm(`Удалить «${region.name}»? Это действие нельзя отменить.`)) {
      return;
    }

    setCitiesError(null);
    const res = await fetch(`/api/regions/${region.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setCitiesError(data?.error ?? "Не удалось удалить город.");
      return;
    }

    setCitySelection({ mode: "empty" });
    await loadRegions();
  };

  const handleCreateLocation = async (input: PoiInput) => {
    setLocationsError(null);
    const res = await fetch("/api/pois", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setLocationsError("Не удалось создать локацию.");
      return;
    }

    const created = (await res.json()) as Poi;
    await loadPois();
    setLocationSelection({ mode: "edit", id: created.id });
  };

  const handleUpdateLocation = async (id: string, input: PoiInput) => {
    setLocationsError(null);
    const res = await fetch(`/api/pois/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setLocationsError("Не удалось сохранить изменения.");
      return;
    }

    await loadPois();
  };

  const handleDeleteLocation = async (poi: Poi) => {
    if (!window.confirm(`Удалить «${poi.name}»? Это действие нельзя отменить.`)) {
      return;
    }

    setLocationsError(null);
    const res = await fetch(`/api/pois/${poi.id}`, { method: "DELETE" });

    if (!res.ok) {
      setLocationsError("Не удалось удалить локацию.");
      return;
    }

    setLocationSelection({ mode: "empty" });
    await loadPois();
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

  const findAreaCountry = (area: Area) => countries.find((country) => country.id === area.countryId);
  const findCityArea = (region: Region) => areas.find((area) => area.id === region.areaId);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Админ-панель Travel Explorer</h1>
          <p className="text-sm text-muted-foreground">
            Стран: {countries.length} · Регионов: {areas.length} · Городов: {regions.length} · Локаций: {pois.length}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={handleLogout} className="gap-1.5">
          <LogOut className="h-4 w-4" />
          Выйти
        </Button>
      </div>

      <div className="mb-6 flex gap-1 rounded-md border border-border bg-muted/60 p-0.5">
        {(Object.keys(tabLabels) as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 rounded px-3 py-2 text-sm font-semibold transition",
              activeTab === tab ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {activeTab === "countries" && (
        <>
          {countriesError && <p className="mb-4 text-sm font-medium text-red-600">{countriesError}</p>}
          <MasterDetail
            items={countries.map((country) => ({ id: country.id, title: country.name }))}
            selectedId={countrySelection.mode === "edit" ? countrySelection.id : countrySelection.mode === "create" ? "__create__" : null}
            onSelect={(id) => setCountrySelection({ mode: "edit", id })}
            onAdd={() => setCountrySelection({ mode: "create" })}
            addLabel="Добавить страну"
            searchPlaceholder="Поиск страны"
            emptyLabel="Стран пока нет"
          >
            {countrySelection.mode === "empty" && (
              <p className="text-sm text-muted-foreground">Выберите страну слева или добавьте новую.</p>
            )}
            {countrySelection.mode === "create" && (
              <CountryForm onCancel={() => setCountrySelection({ mode: "empty" })} onSubmit={handleCreateCountry} />
            )}
            {countrySelection.mode === "edit" &&
              (() => {
                const country = countries.find((c) => c.id === countrySelection.id);
                if (!country) return null;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{country.name}</p>
                      <button
                        type="button"
                        aria-label="Удалить страну"
                        onClick={() => handleDeleteCountry(country)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Удалить
                      </button>
                    </div>
                    <CountryForm
                      country={country}
                      onCancel={() => setCountrySelection({ mode: "empty" })}
                      onSubmit={(input) => handleUpdateCountry(country.id, input)}
                    />
                  </div>
                );
              })()}
          </MasterDetail>
        </>
      )}

      {activeTab === "areas" && (
        <>
          {areasError && <p className="mb-4 text-sm font-medium text-red-600">{areasError}</p>}
          <MasterDetail
            items={areas.map((area) => ({
              id: area.id,
              title: area.name,
              subtitle: findAreaCountry(area)?.name
            }))}
            selectedId={areaSelection.mode === "edit" ? areaSelection.id : areaSelection.mode === "create" ? "__create__" : null}
            onSelect={(id) => setAreaSelection({ mode: "edit", id })}
            onAdd={() => setAreaSelection({ mode: "create" })}
            addLabel="Добавить регион"
            searchPlaceholder="Поиск региона"
            emptyLabel="Регионов пока нет"
          >
            {areaSelection.mode === "empty" && (
              <p className="text-sm text-muted-foreground">Выберите регион слева или добавьте новый.</p>
            )}
            {areaSelection.mode === "create" && (
              <AreaForm countries={countries} onCancel={() => setAreaSelection({ mode: "empty" })} onSubmit={handleCreateArea} />
            )}
            {areaSelection.mode === "edit" &&
              (() => {
                const area = areas.find((a) => a.id === areaSelection.id);
                if (!area) return null;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{area.name}</p>
                      <button
                        type="button"
                        aria-label="Удалить регион"
                        onClick={() => handleDeleteArea(area)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Удалить
                      </button>
                    </div>
                    <AreaForm
                      area={area}
                      countries={countries}
                      onCancel={() => setAreaSelection({ mode: "empty" })}
                      onSubmit={(input) => handleUpdateArea(area.id, input)}
                    />
                  </div>
                );
              })()}
          </MasterDetail>
        </>
      )}

      {activeTab === "cities" && (
        <>
          {citiesError && <p className="mb-4 text-sm font-medium text-red-600">{citiesError}</p>}
          <MasterDetail
            items={regions.map((region) => {
              const area = findCityArea(region);
              const country = area ? findAreaCountry(area) : undefined;
              const subtitle = area && country ? `${area.name}, ${country.name}` : area?.name;
              return { id: region.id, title: region.name, subtitle };
            })}
            selectedId={citySelection.mode === "edit" ? citySelection.id : citySelection.mode === "create" ? "__create__" : null}
            onSelect={(id) => setCitySelection({ mode: "edit", id })}
            onAdd={() => setCitySelection({ mode: "create" })}
            addLabel="Добавить город"
            searchPlaceholder="Поиск города"
            emptyLabel="Городов пока нет"
          >
            {citySelection.mode === "empty" && (
              <p className="text-sm text-muted-foreground">Выберите город слева или добавьте новый.</p>
            )}
            {citySelection.mode === "create" && (
              <RegionForm areas={areas} onCancel={() => setCitySelection({ mode: "empty" })} onSubmit={handleCreateCity} />
            )}
            {citySelection.mode === "edit" &&
              (() => {
                const region = regions.find((r) => r.id === citySelection.id);
                if (!region) return null;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {region.name} <span className="text-muted-foreground">({region.sealCharacter})</span>
                      </p>
                      <button
                        type="button"
                        aria-label="Удалить город"
                        onClick={() => handleDeleteCity(region)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Удалить
                      </button>
                    </div>
                    <RegionForm
                      region={region}
                      areas={areas}
                      onCancel={() => setCitySelection({ mode: "empty" })}
                      onSubmit={(input) => handleUpdateCity(region.id, input)}
                    />
                  </div>
                );
              })()}
          </MasterDetail>
        </>
      )}

      {activeTab === "locations" && (
        <>
          {locationsError && <p className="mb-4 text-sm font-medium text-red-600">{locationsError}</p>}
          <div className="mb-3 flex items-center gap-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Город</label>
            <select
              value={locationCityFilter}
              onChange={(e) => {
                setLocationCityFilter(e.target.value);
                setLocationSelection({ mode: "empty" });
              }}
              className="h-9 rounded-md border border-border bg-white px-2.5 text-sm shadow-sm outline-none"
            >
              <option value="all">Все города</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
          <MasterDetail
            items={pois
              .filter((poi) => locationCityFilter === "all" || poi.regionId === locationCityFilter)
              .map((poi) => ({
                id: poi.id,
                title: poi.name,
                subtitle: regions.find((region) => region.id === poi.regionId)?.name
              }))}
            selectedId={
              locationSelection.mode === "edit" ? locationSelection.id : locationSelection.mode === "create" ? "__create__" : null
            }
            onSelect={(id) => setLocationSelection({ mode: "edit", id })}
            onAdd={() => setLocationSelection({ mode: "create" })}
            addLabel="Добавить локацию"
            searchPlaceholder="Поиск локации"
            emptyLabel="Локаций пока нет"
          >
            {locationSelection.mode === "empty" && (
              <p className="text-sm text-muted-foreground">Выберите локацию слева или добавьте новую.</p>
            )}
            {locationSelection.mode === "create" && (
              <PoiForm
                regions={regions}
                defaultRegionId={locationCityFilter !== "all" ? locationCityFilter : undefined}
                onCancel={() => setLocationSelection({ mode: "empty" })}
                onSubmit={handleCreateLocation}
              />
            )}
            {locationSelection.mode === "edit" &&
              (() => {
                const poi = pois.find((p) => p.id === locationSelection.id);
                if (!poi) return null;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{poi.name}</p>
                      <button
                        type="button"
                        aria-label="Удалить локацию"
                        onClick={() => handleDeleteLocation(poi)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Удалить
                      </button>
                    </div>
                    <PoiForm
                      poi={poi}
                      regions={regions}
                      onCancel={() => setLocationSelection({ mode: "empty" })}
                      onSubmit={(input) => handleUpdateLocation(poi.id, input)}
                    />
                  </div>
                );
              })()}
          </MasterDetail>
        </>
      )}
    </div>
  );
}
