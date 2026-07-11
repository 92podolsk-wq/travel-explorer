"use client";

import { useEffect, useState } from "react";
import { Ban, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import type { AdminAccount } from "@/entities/admin-account/model/types";
import type { Area, AreaInput } from "@/entities/area/model/types";
import type { Country, CountryInput } from "@/entities/country/model/types";
import type { ExplorationMode, ExplorationModeInput } from "@/entities/exploration-mode/model/types";
import type { Poi, PoiInput } from "@/entities/poi/model/types";
import type { PoiReport } from "@/entities/poi-report/model/types";
import type { Region, RegionInput } from "@/entities/region/model/types";
import type { AdminUser } from "@/entities/user/model/types";
import { getTranslations } from "@/shared/i18n/translations";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/cn";
import { missingLanguages } from "@/shared/lib/translation-completeness";
import type { MasterDetailBadge } from "./master-detail";
import { AdminAccountForm } from "./admin-account-form";
import { AreaForm } from "./area-form";
import { CountryForm } from "./country-form";
import { DashboardTab } from "./dashboard-tab";
import { ExplorationModeForm } from "./exploration-mode-form";
import { ImportExportPanel } from "./import-export-panel";
import { MasterDetail } from "./master-detail";
import { MediaLibraryTab } from "./media-library-tab";
import { ReportsTab } from "./reports-tab";
import { PoiForm } from "./poi-form";
import { RegionForm } from "./region-form";
import { SiteSettingsTab } from "./site-settings-tab";

type AuthViewState = { mode: "loading" } | { mode: "login" } | { mode: "ready" };

type Selection = { mode: "empty" } | { mode: "create" } | { mode: "edit"; id: string };

type Tab =
  | "dashboard"
  | "settings"
  | "countries"
  | "areas"
  | "cities"
  | "locations"
  | "media"
  | "modes"
  | "reports"
  | "users"
  | "accounts";

const tabLabels: Record<Tab, string> = {
  dashboard: "Дашборд",
  settings: "Настройки",
  countries: "Страны",
  areas: "Регионы",
  cities: "Города",
  locations: "Локации",
  media: "Медиатека",
  modes: "Режимы",
  reports: "Сообщения",
  users: "Пользователи",
  accounts: "Администраторы"
};

type TabGroup = "overview" | "content" | "community";

const tabGroups: Record<TabGroup, Tab[]> = {
  overview: ["dashboard", "settings"],
  content: ["countries", "areas", "cities", "locations", "media", "modes"],
  community: ["reports", "users", "accounts"]
};

const groupLabels: Record<TabGroup, string> = {
  overview: "Обзор",
  content: "Контент",
  community: "Сообщество"
};

function groupOfTab(tab: Tab): TabGroup {
  for (const group of Object.keys(tabGroups) as TabGroup[]) {
    if (tabGroups[group].includes(tab)) return group;
  }
  return "content";
}

const t = getTranslations("ru");

export function AdminPanel() {
  const [authView, setAuthView] = useState<AuthViewState>({ mode: "loading" });
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const [countries, setCountries] = useState<Country[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [pois, setPois] = useState<Poi[]>([]);
  const [explorationModes, setExplorationModes] = useState<ExplorationMode[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [reports, setReports] = useState<PoiReport[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<{ name: string; email: string } | null>(null);

  const [countrySelection, setCountrySelection] = useState<Selection>({ mode: "empty" });
  const [areaSelection, setAreaSelection] = useState<Selection>({ mode: "empty" });
  const [citySelection, setCitySelection] = useState<Selection>({ mode: "empty" });
  const [locationSelection, setLocationSelection] = useState<Selection>({ mode: "empty" });
  const [locationCityFilter, setLocationCityFilter] = useState<string>("all");
  const [modeSelection, setModeSelection] = useState<Selection>({ mode: "empty" });
  const [accountSelection, setAccountSelection] = useState<Selection>({ mode: "empty" });

  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [areasError, setAreasError] = useState<string | null>(null);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [modesError, setModesError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
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
  async function loadExplorationModes() {
    const res = await fetch("/api/exploration-modes");
    setExplorationModes((await res.json()) as ExplorationMode[]);
  }
  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    setUsers((await res.json()) as AdminUser[]);
  }
  async function loadAccounts() {
    const res = await fetch("/api/admin/accounts");
    setAccounts((await res.json()) as AdminAccount[]);
  }
  async function loadReports() {
    const res = await fetch("/api/admin/reports");
    setReports((await res.json()) as PoiReport[]);
  }

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/session");
      const { authenticated, admin } = (await res.json()) as {
        authenticated: boolean;
        admin: { name: string; email: string } | null;
      };

      if (authenticated) {
        setCurrentAdmin(admin);
        await Promise.all([
          loadCountries(),
          loadAreas(),
          loadRegions(),
          loadPois(),
          loadExplorationModes(),
          loadUsers(),
          loadAccounts(),
          loadReports()
        ]);
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
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      setLoginError("Неверный email или пароль.");
      return;
    }

    const { admin } = (await res.json()) as { admin: { name: string; email: string } };
    setCurrentAdmin(admin);

    setPassword("");
    await Promise.all([
      loadCountries(),
      loadAreas(),
      loadRegions(),
      loadPois(),
      loadExplorationModes(),
      loadUsers(),
      loadAccounts(),
      loadReports()
    ]);
    setAuthView({ mode: "ready" });
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setCurrentAdmin(null);
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

  const handleCreateMode = async (input: ExplorationModeInput) => {
    setModesError(null);
    const res = await fetch("/api/exploration-modes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setModesError("Не удалось создать режим.");
      return;
    }

    const created = (await res.json()) as ExplorationMode;
    await loadExplorationModes();
    setModeSelection({ mode: "edit", id: created.id });
  };

  const handleUpdateMode = async (id: string, input: ExplorationModeInput) => {
    setModesError(null);
    const res = await fetch(`/api/exploration-modes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setModesError("Не удалось сохранить изменения.");
      return;
    }

    await loadExplorationModes();
  };

  const handleDeleteMode = async (mode: ExplorationMode) => {
    if (!window.confirm(`Удалить режим «${mode.name}»? Это действие нельзя отменить.`)) {
      return;
    }

    setModesError(null);
    const res = await fetch(`/api/exploration-modes/${mode.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setModesError(data?.error ?? "Не удалось удалить режим.");
      return;
    }

    setModeSelection({ mode: "empty" });
    await loadExplorationModes();
  };

  const handleToggleUserBlock = async (user: AdminUser) => {
    const action = user.isBlocked ? "разблокировать" : "заблокировать";
    if (!window.confirm(`Вы действительно хотите ${action} пользователя «${user.email}»?`)) {
      return;
    }

    setUsersError(null);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBlocked: !user.isBlocked })
    });

    if (!res.ok) {
      setUsersError("Не удалось изменить статус пользователя.");
      return;
    }

    await loadUsers();
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!window.confirm(`Удалить пользователя «${user.email}»? Это действие нельзя отменить.`)) {
      return;
    }

    setUsersError(null);
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });

    if (!res.ok) {
      setUsersError("Не удалось удалить пользователя.");
      return;
    }

    await loadUsers();
  };

  const handleCreateAccount = async (input: { name: string; email: string; password: string }) => {
    setAccountsError(null);
    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setAccountsError(data?.error ?? "Не удалось создать администратора.");
      return;
    }

    const created = (await res.json()) as AdminAccount;
    await loadAccounts();
    setAccountSelection({ mode: "edit", id: created.id });
  };

  const handleUpdateAccount = async (id: string, input: { name: string; email: string; password: string }) => {
    setAccountsError(null);
    const res = await fetch(`/api/admin/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setAccountsError(data?.error ?? "Не удалось сохранить изменения.");
      return;
    }

    await loadAccounts();
  };

  const handleDeleteAccount = async (account: AdminAccount) => {
    if (!window.confirm(`Удалить администратора «${account.name}»? Это действие нельзя отменить.`)) {
      return;
    }

    setAccountsError(null);
    const res = await fetch(`/api/admin/accounts/${account.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setAccountsError(data?.error ?? "Не удалось удалить администратора.");
      return;
    }

    setAccountSelection({ mode: "empty" });
    await loadAccounts();
  };

  if (authView.mode === "loading") {
    return null;
  }

  if (authView.mode === "login") {
    return (
      <div className="mx-auto mt-24 max-w-sm rounded-lg border border-border bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold">Админ-панель Travel Explorer</h1>
        <p className="mb-5 text-sm text-muted-foreground">Войдите под своей учётной записью администратора.</p>
        <form onSubmit={handleLogin} className="space-y-3">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoFocus
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
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
  const unreadReportsCount = reports.filter((report) => report.status === "new").length;

  const translationBadge = (...fields: Record<string, string>[]): MasterDetailBadge[] => {
    const missing = missingLanguages(fields);
    if (missing.length === 0) return [];
    return [{ label: `Нет перевода: ${missing.map((lang) => lang.toUpperCase()).join("/")}`, tone: "red" }];
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Админ-панель Travel Explorer</h1>
          <p className="text-sm text-muted-foreground">
            Стран: {countries.length} · Регионов: {areas.length} · Городов: {regions.length} · Локаций: {pois.length} ·
            Режимов: {explorationModes.length} · Пользователей: {users.length} · Админов: {accounts.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {currentAdmin && (
            <p className="text-sm text-muted-foreground">
              Вы вошли как <span className="font-semibold text-foreground">{currentAdmin.name}</span>
            </p>
          )}
          <Button type="button" variant="outline" onClick={handleLogout} className="gap-1.5">
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </div>
      </div>

      <div className="mb-3 flex gap-1 rounded-md border border-border bg-muted/60 p-0.5">
        {(Object.keys(tabGroups) as TabGroup[]).map((group) => (
          <button
            key={group}
            type="button"
            onClick={() => {
              if (groupOfTab(activeTab) !== group) {
                setActiveTab(tabGroups[group][0]);
              }
            }}
            className={cn(
              "flex-1 rounded px-3 py-2 text-sm font-semibold transition",
              groupOfTab(activeTab) === group
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              {groupLabels[group]}
              {group === "community" && unreadReportsCount > 0 && (
                <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadReportsCount}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-6 flex min-h-[34px] flex-wrap items-center gap-1.5">
        {tabGroups[groupOfTab(activeTab)].length > 1 &&
          tabGroups[groupOfTab(activeTab)].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition",
                activeTab === tab
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-white text-muted-foreground hover:text-foreground"
              )}
            >
              {tabLabels[tab]}
              {tab === "reports" && unreadReportsCount > 0 && (
                <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadReportsCount}
                </span>
              )}
            </button>
          ))}
      </div>

      {activeTab === "dashboard" && <DashboardTab />}

      {activeTab === "settings" && <SiteSettingsTab />}

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
                      key={country.id}
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
                      key={area.id}
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
              const badges: MasterDetailBadge[] = [
                ...(region.status === "draft" ? [{ label: "Черновик" }] : []),
                ...translationBadge(region.nameByLanguage)
              ];
              return { id: region.id, title: region.name, subtitle, badges };
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
                      key={region.id}
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
          <ImportExportPanel onImported={loadPois} />
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
                subtitle: regions.find((region) => region.id === poi.regionId)?.name,
                badges: [
                  ...(poi.status === "draft" ? [{ label: "Черновик" }] : []),
                  ...translationBadge(poi.nameByLanguage, poi.descriptionByLanguage)
                ] as MasterDetailBadge[]
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
                      key={poi.id}
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

      {activeTab === "media" && <MediaLibraryTab regions={regions} />}

      {activeTab === "modes" && (
        <>
          {modesError && <p className="mb-4 text-sm font-medium text-red-600">{modesError}</p>}
          <p className="mb-3 text-sm text-muted-foreground">
            Эти карточки показываются как фильтры в боковой панели сайта (например «Фотограф», «Природа»). Место
            попадает в режим, если у него есть хотя бы один из выбранных тегов.
          </p>
          <MasterDetail
            items={explorationModes.map((mode) => ({
              id: mode.id,
              title: mode.name,
              subtitle: mode.tags.map((tag) => t.tag[tag]).join(", ")
            }))}
            selectedId={modeSelection.mode === "edit" ? modeSelection.id : modeSelection.mode === "create" ? "__create__" : null}
            onSelect={(id) => setModeSelection({ mode: "edit", id })}
            onAdd={() => setModeSelection({ mode: "create" })}
            addLabel="Добавить режим"
            searchPlaceholder="Поиск режима"
            emptyLabel="Режимов пока нет"
          >
            {modeSelection.mode === "empty" && (
              <p className="text-sm text-muted-foreground">Выберите режим слева или добавьте новый.</p>
            )}
            {modeSelection.mode === "create" && (
              <ExplorationModeForm onCancel={() => setModeSelection({ mode: "empty" })} onSubmit={handleCreateMode} />
            )}
            {modeSelection.mode === "edit" &&
              (() => {
                const mode = explorationModes.find((m) => m.id === modeSelection.id);
                if (!mode) return null;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{mode.name}</p>
                      <button
                        type="button"
                        aria-label="Удалить режим"
                        onClick={() => handleDeleteMode(mode)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Удалить
                      </button>
                    </div>
                    <ExplorationModeForm
                      key={mode.id}
                      mode={mode}
                      onCancel={() => setModeSelection({ mode: "empty" })}
                      onSubmit={(input) => handleUpdateMode(mode.id, input)}
                    />
                  </div>
                );
              })()}
          </MasterDetail>
        </>
      )}

      {activeTab === "reports" && <ReportsTab reports={reports} onReload={loadReports} />}

      {activeTab === "users" && (
        <>
          {usersError && <p className="mb-4 text-sm font-medium text-red-600">{usersError}</p>}
          <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5">Имя</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Регистрация</th>
                  <th className="px-4 py-2.5">Статус</th>
                  <th className="px-4 py-2.5 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      Пользователей пока нет
                    </td>
                  </tr>
                )}
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">{user.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          user.isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        )}
                      >
                        {user.isBlocked ? "Заблокирован" : "Активен"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleUserBlock(user)}
                          className="flex items-center gap-1 text-xs font-medium text-foreground transition hover:underline"
                        >
                          {user.isBlocked ? (
                            <ShieldCheck className="h-3.5 w-3.5" />
                          ) : (
                            <Ban className="h-3.5 w-3.5" />
                          )}
                          {user.isBlocked ? "Разблокировать" : "Заблокировать"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                          className="flex items-center gap-1 text-xs font-medium text-red-600 transition hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "accounts" && (
        <>
          {accountsError && <p className="mb-4 text-sm font-medium text-red-600">{accountsError}</p>}
          <MasterDetail
            items={accounts.map((account) => ({ id: account.id, title: account.name, subtitle: account.email }))}
            selectedId={
              accountSelection.mode === "edit" ? accountSelection.id : accountSelection.mode === "create" ? "__create__" : null
            }
            onSelect={(id) => setAccountSelection({ mode: "edit", id })}
            onAdd={() => setAccountSelection({ mode: "create" })}
            addLabel="Добавить администратора"
            searchPlaceholder="Поиск администратора"
            emptyLabel="Администраторов пока нет"
          >
            {accountSelection.mode === "empty" && (
              <p className="text-sm text-muted-foreground">Выберите администратора слева или добавьте нового.</p>
            )}
            {accountSelection.mode === "create" && (
              <AdminAccountForm onCancel={() => setAccountSelection({ mode: "empty" })} onSubmit={handleCreateAccount} />
            )}
            {accountSelection.mode === "edit" &&
              (() => {
                const account = accounts.find((a) => a.id === accountSelection.id);
                if (!account) return null;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{account.name}</p>
                      <button
                        type="button"
                        aria-label="Удалить администратора"
                        onClick={() => handleDeleteAccount(account)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Удалить
                      </button>
                    </div>
                    <AdminAccountForm
                      key={account.id}
                      account={account}
                      onCancel={() => setAccountSelection({ mode: "empty" })}
                      onSubmit={(input) => handleUpdateAccount(account.id, input)}
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
