"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Ban, Eye, EyeOff, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import type { Area } from "@/entities/area/model/types";
import type { AdminPhoto } from "@/entities/photo/model/types";
import type { PoiReport } from "@/entities/poi-report/model/types";
import { getTranslations } from "@/shared/i18n/translations";
import { Button } from "@/shared/ui/button";
import { CityPicker } from "@/shared/ui/city-picker";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/cn";
import type { Selection } from "../model/types";
import { useAdminAuth } from "../model/use-admin-auth";
import { useCountriesAdmin } from "../model/use-countries-admin";
import { useAreasAdmin } from "../model/use-areas-admin";
import { useCitiesAdmin } from "../model/use-cities-admin";
import { useLocationsAdmin } from "../model/use-locations-admin";
import { useModesAdmin } from "../model/use-modes-admin";
import { useCategoriesAdmin } from "../model/use-categories-admin";
import { useUsersAdmin } from "../model/use-users-admin";
import { useAccountsAdmin } from "../model/use-accounts-admin";
import { AdminAccountForm } from "./admin-account-form";
import { AreaForm } from "./area-form";
import { CategoryForm } from "./category-form";
import { CitiesTable } from "./cities-table";
import { CountryForm } from "./country-form";
import { DashboardTab } from "./dashboard-tab";
import { ExplorationModeForm } from "./exploration-mode-form";
import { GlobalSearch, type GlobalSearchResult } from "./global-search";
import { ImportExportPanel } from "./import-export-panel";
import { LocationsTable } from "./locations-table";
import { LocationsTrashTable } from "./locations-trash-table";
import { MasterDetail } from "./master-detail";
import { MediaLibraryTab } from "./media-library-tab";
import { PhotoModerationTab } from "./photo-moderation-tab";
import { PushNotificationsTab } from "./push-notifications-tab";
import { ReportsTab } from "./reports-tab";
import { PoiForm } from "./poi-form";
import { RegionForm } from "./region-form";
import { SiteSettingsTab } from "./site-settings-tab";

type Tab =
  | "dashboard"
  | "settings"
  | "countries"
  | "areas"
  | "cities"
  | "locations"
  | "media"
  | "modes"
  | "categories"
  | "reports"
  | "photos-moderation"
  | "users"
  | "accounts"
  | "push";

const tabLabels: Record<Tab, string> = {
  dashboard: "Дашборд",
  settings: "Настройки",
  countries: "Страны",
  areas: "Регионы",
  cities: "Города",
  locations: "Локации",
  media: "Медиатека",
  modes: "Режимы",
  categories: "Категории",
  reports: "Сообщения",
  "photos-moderation": "Фото на модерации",
  users: "Пользователи",
  accounts: "Администраторы",
  push: "Push-рассылка"
};

type TabGroup = "overview" | "content" | "community";

const tabGroups: Record<TabGroup, Tab[]> = {
  overview: ["dashboard", "settings"],
  content: ["countries", "areas", "cities", "locations", "media", "modes", "categories"],
  community: ["reports", "photos-moderation", "users", "accounts", "push"]
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

function isValidTab(value: string | null): value is Tab {
  return !!value && value in tabLabels;
}

const t = getTranslations("ru");

function selectionFromParams(searchParams: URLSearchParams): Selection {
  if (searchParams.get("new") === "1") return { mode: "create" };
  const id = searchParams.get("id");
  return id ? { mode: "edit", id } : { mode: "empty" };
}

export function AdminPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab: Tab = isValidTab(searchParams.get("tab")) ? (searchParams.get("tab") as Tab) : "dashboard";
  const urlSelection = selectionFromParams(searchParams);

  function navigateToSelection(tab: Tab, selection: Selection) {
    const params = new URLSearchParams({ tab });
    if (selection.mode === "create") params.set("new", "1");
    if (selection.mode === "edit") params.set("id", selection.id);
    router.replace(`/admin?${params.toString()}`, { scroll: false });
  }

  const countrySelection: Selection = activeTab === "countries" ? urlSelection : { mode: "empty" };
  const setCountrySelection = (selection: Selection) => navigateToSelection("countries", selection);
  const areaSelection: Selection = activeTab === "areas" ? urlSelection : { mode: "empty" };
  const setAreaSelection = (selection: Selection) => navigateToSelection("areas", selection);
  const citySelection: Selection = activeTab === "cities" ? urlSelection : { mode: "empty" };
  const setCitySelection = (selection: Selection) => navigateToSelection("cities", selection);
  const locationSelection: Selection = activeTab === "locations" ? urlSelection : { mode: "empty" };
  const setLocationSelection = (selection: Selection) => navigateToSelection("locations", selection);
  const modeSelection: Selection = activeTab === "modes" ? urlSelection : { mode: "empty" };
  const setModeSelection = (selection: Selection) => navigateToSelection("modes", selection);
  const categorySelection: Selection = activeTab === "categories" ? urlSelection : { mode: "empty" };
  const setCategorySelection = (selection: Selection) => navigateToSelection("categories", selection);
  const accountSelection: Selection = activeTab === "accounts" ? urlSelection : { mode: "empty" };
  const setAccountSelection = (selection: Selection) => navigateToSelection("accounts", selection);

  const {
    countries,
    error: countriesError,
    load: loadCountries,
    handleCreate: handleCreateCountry,
    handleUpdate: handleUpdateCountry,
    handleDelete: handleDeleteCountry
  } = useCountriesAdmin(setCountrySelection);
  const {
    areas,
    error: areasError,
    load: loadAreas,
    handleCreate: handleCreateArea,
    handleUpdate: handleUpdateArea,
    handleDelete: handleDeleteArea
  } = useAreasAdmin(setAreaSelection);
  const {
    regions,
    error: citiesError,
    load: loadRegions,
    handleCreate: handleCreateCity,
    handleUpdate: handleUpdateCity,
    handleDelete: handleDeleteCity
  } = useCitiesAdmin(setCitySelection);
  const {
    pois,
    error: locationsError,
    locationCityFilter,
    setLocationCityFilter,
    showDraftsOnly,
    setShowDraftsOnly,
    selectedIds: locationSelectedIds,
    isTrashOpen: isLocationsTrashOpen,
    setIsTrashOpen: setIsLocationsTrashOpen,
    trash: locationsTrash,
    bulkCityTarget,
    setBulkCityTarget,
    bulkCategoryTarget,
    setBulkCategoryTarget,
    isBulkWorking,
    load: loadPois,
    handleCreate: handleCreateLocation,
    handleUpdate: handleUpdateLocation,
    handleDelete: handleDeleteLocation,
    handleDuplicate: handleDuplicateLocation,
    toggleSelected: toggleLocationSelected,
    clearSelected: clearLocationSelected,
    toggleAllSelected: toggleAllLocationsSelected,
    handleBulkSetStatus,
    handleBulkDelete: handleBulkDeleteLocations,
    handleOpenTrash: handleOpenLocationsTrash,
    handleRestore: handleRestoreLocation,
    handlePurge: handlePurgeLocation,
    handleBulkChangeCity,
    handleBulkChangeCategory
  } = useLocationsAdmin(setLocationSelection);
  const {
    explorationModes,
    error: modesError,
    load: loadExplorationModes,
    handleCreate: handleCreateMode,
    handleUpdate: handleUpdateMode,
    handleDelete: handleDeleteMode
  } = useModesAdmin(setModeSelection);
  const {
    categories,
    error: categoriesError,
    load: loadCategories,
    handleCreate: handleCreateCategory,
    handleUpdate: handleUpdateCategory,
    handleDelete: handleDeleteCategory
  } = useCategoriesAdmin(setCategorySelection);
  const {
    users,
    error: usersError,
    load: loadUsers,
    handleToggleHiddenAccess: handleToggleUserHiddenAccess,
    handleToggleBlock: handleToggleUserBlock,
    handleDelete: handleDeleteUser
  } = useUsersAdmin();
  const {
    accounts,
    error: accountsError,
    load: loadAccounts,
    handleCreate: handleCreateAccount,
    handleUpdate: handleUpdateAccount,
    handleDelete: handleDeleteAccount
  } = useAccountsAdmin(setAccountSelection);

  const [reports, setReports] = useState<PoiReport[]>([]);
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);

  async function loadReports() {
    const res = await fetch("/api/admin/reports");
    if (!res.ok) throw new Error("Failed to load reports");
    setReports((await res.json()) as PoiReport[]);
  }
  async function loadPhotos() {
    const res = await fetch("/api/admin/photos");
    if (!res.ok) throw new Error("Failed to load photos");
    setPhotos((await res.json()) as AdminPhoto[]);
  }

  async function loadAllAdminData() {
    await Promise.all([
      loadCountries(),
      loadAreas(),
      loadRegions(),
      loadPois(),
      loadExplorationModes(),
      loadCategories(),
      loadUsers(),
      loadAccounts(),
      loadReports(),
      loadPhotos()
    ]);
  }

  const {
    authView,
    currentAdmin,
    email,
    setEmail,
    password,
    setPassword,
    loginError,
    isLoggingIn,
    checkSessionAndLoad,
    handleLogin,
    handleLogout
  } = useAdminAuth(loadAllAdminData);

  if (authView.mode === "loading") {
    return null;
  }

  if (authView.mode === "error") {
    return (
      <div className="mx-auto mt-24 max-w-sm rounded-lg border border-border bg-white p-6 text-center shadow-sm">
        <p className="mb-4 text-sm font-medium text-red-600">{authView.message}</p>
        <Button type="button" onClick={() => void checkSessionAndLoad()}>
          Повторить
        </Button>
      </div>
    );
  }

  if (authView.mode === "login") {
    return (
      <div className="mx-auto mt-24 max-w-sm rounded-lg border border-border bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold">Админ-панель Wayora</h1>
        <p className="mb-5 text-sm text-muted-foreground">Войдите под своей учётной записью администратора.</p>
        <form onSubmit={handleLogin} className="space-y-3">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoFocus
            disabled={isLoggingIn}
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            disabled={isLoggingIn}
          />
          {loginError && <p className="text-sm font-medium text-red-600">{loginError}</p>}
          <Button type="submit" className="w-full" disabled={isLoggingIn}>
            {isLoggingIn ? "Вход…" : "Войти"}
          </Button>
        </form>
      </div>
    );
  }

  const findAreaCountry = (area: Area) => countries.find((country) => country.id === area.countryId);
  const unreadReportsCount = reports.filter((report) => report.status === "new").length;
  const pendingPhotosCount = photos.filter((photo) => photo.status === "pending").length;
  const communityBadgeCount = unreadReportsCount + pendingPhotosCount;

  const frequentRegionIds = [...regions]
    .sort((a, b) => pois.filter((poi) => poi.regionId === b.id).length - pois.filter((poi) => poi.regionId === a.id).length)
    .slice(0, 5)
    .map((region) => region.id);

  const globalSearchResults: GlobalSearchResult[] = [
    ...pois.map((poi): GlobalSearchResult => ({
      type: "location",
      id: poi.id,
      label: poi.name,
      sublabel: regions.find((region) => region.id === poi.regionId)?.name
    })),
    ...regions.map((region): GlobalSearchResult => ({ type: "city", id: region.id, label: region.name })),
    ...countries.map((country): GlobalSearchResult => ({ type: "country", id: country.id, label: country.name })),
    ...areas.map((area): GlobalSearchResult => ({ type: "area", id: area.id, label: area.name })),
    ...explorationModes.map((mode): GlobalSearchResult => ({ type: "mode", id: mode.id, label: mode.name })),
    ...categories.map((category): GlobalSearchResult => ({ type: "category", id: category.id, label: category.name }))
  ];

  const handleGlobalSearchSelect = (result: GlobalSearchResult) => {
    if (result.type === "location") {
      setLocationCityFilter("all");
      setShowDraftsOnly(false);
      navigateToSelection("locations", { mode: "edit", id: result.id });
    } else if (result.type === "city") {
      navigateToSelection("cities", { mode: "edit", id: result.id });
    } else if (result.type === "country") {
      navigateToSelection("countries", { mode: "edit", id: result.id });
    } else if (result.type === "area") {
      navigateToSelection("areas", { mode: "edit", id: result.id });
    } else if (result.type === "mode") {
      navigateToSelection("modes", { mode: "edit", id: result.id });
    } else if (result.type === "category") {
      navigateToSelection("categories", { mode: "edit", id: result.id });
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Админ-панель Wayora</h1>
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

      <GlobalSearch results={globalSearchResults} onSelect={handleGlobalSearchSelect} className="mb-4 max-w-md" />

      <div className="mb-3 flex gap-1 rounded-md border border-border bg-muted/60 p-0.5">
        {(Object.keys(tabGroups) as TabGroup[]).map((group) => (
          <Link
            key={group}
            href={
              groupOfTab(activeTab) === group ? `/admin?${searchParams.toString()}` : `/admin?tab=${tabGroups[group][0]}`
            }
            scroll={false}
            className={cn(
              "flex-1 rounded px-3 py-2 text-center text-sm font-semibold transition",
              groupOfTab(activeTab) === group
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              {groupLabels[group]}
              {group === "community" && communityBadgeCount > 0 && (
                <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {communityBadgeCount}
                </span>
              )}
            </span>
          </Link>
        ))}
      </div>

      <div className="mb-6 flex min-h-[34px] flex-wrap items-center gap-1.5">
        {tabGroups[groupOfTab(activeTab)].length > 1 &&
          tabGroups[groupOfTab(activeTab)].map((tab) => (
            <Link
              key={tab}
              href={`/admin?tab=${tab}`}
              scroll={false}
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
              {tab === "photos-moderation" && pendingPhotosCount > 0 && (
                <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {pendingPhotosCount}
                </span>
              )}
            </Link>
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
          {citySelection.mode === "empty" && (
            <CitiesTable
              regions={regions}
              areas={areas}
              countries={countries}
              pois={pois}
              onSelect={(id) => setCitySelection({ mode: "edit", id })}
              onAdd={() => setCitySelection({ mode: "create" })}
            />
          )}
          {citySelection.mode === "create" && (
            <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCitySelection({ mode: "empty" })}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  ← Назад к списку
                </button>
                <p className="text-sm font-semibold">Новый город</p>
              </div>
              <RegionForm areas={areas} onCancel={() => setCitySelection({ mode: "empty" })} onSubmit={handleCreateCity} />
            </div>
          )}
          {citySelection.mode === "edit" &&
            (() => {
              const region = regions.find((r) => r.id === citySelection.id);
              if (!region) return null;
              return (
                <div className="space-y-4 rounded-lg border border-border bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCitySelection({ mode: "empty" })}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      ← Назад к списку
                    </button>
                    <p className="text-sm font-semibold">{region.name}</p>
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
        </>
      )}

      {activeTab === "locations" && (
        <>
          {locationsError && <p className="mb-4 text-sm font-medium text-red-600">{locationsError}</p>}
          <ImportExportPanel pois={pois} regions={regions} cityFilter={locationCityFilter} onImported={loadPois} />
          <div className="mb-3 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Город</label>
              <CityPicker
                className="w-56"
                options={regions.map((region) => ({ id: region.id, name: region.name }))}
                value={locationCityFilter}
                onChange={(id) => {
                  setLocationCityFilter(id);
                  setLocationSelection({ mode: "empty" });
                }}
                frequentIds={frequentRegionIds}
                allowAll
              />
            </div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <input type="checkbox" checked={showDraftsOnly} onChange={(e) => setShowDraftsOnly(e.target.checked)} />
              Только черновики
            </label>
            <button
              type="button"
              onClick={handleOpenLocationsTrash}
              className="ml-auto flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Корзина
            </button>
          </div>
          {isLocationsTrashOpen ? (
            <LocationsTrashTable
              items={locationsTrash}
              regions={regions}
              onRestore={handleRestoreLocation}
              onPurge={handlePurgeLocation}
              onClose={() => setIsLocationsTrashOpen(false)}
            />
          ) : (
            (() => {
            const visiblePois = pois
              .filter((poi) => locationCityFilter === "all" || poi.regionId === locationCityFilter)
              .filter((poi) => !showDraftsOnly || poi.status === "draft");

            const bulkActions = (
              <>
                <Button type="button" size="sm" variant="outline" disabled={isBulkWorking} onClick={() => handleBulkSetStatus("published")}>
                  Опубликовать
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={isBulkWorking} onClick={() => handleBulkSetStatus("draft")}>
                  В черновик
                </Button>
                <select
                  className="rounded-md border border-border px-2 py-1 text-xs"
                  value={bulkCityTarget}
                  onChange={(e) => setBulkCityTarget(e.target.value)}
                >
                  <option value="">Город…</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
                <Button type="button" size="sm" variant="outline" disabled={isBulkWorking || !bulkCityTarget} onClick={handleBulkChangeCity}>
                  Применить город
                </Button>
                <select
                  className="rounded-md border border-border px-2 py-1 text-xs"
                  value={bulkCategoryTarget}
                  onChange={(e) => setBulkCategoryTarget(e.target.value)}
                >
                  <option value="">Категория…</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isBulkWorking || !bulkCategoryTarget}
                  onClick={handleBulkChangeCategory}
                >
                  Применить категорию
                </Button>
                <Button type="button" size="sm" variant="outline" className="text-red-600" disabled={isBulkWorking} onClick={handleBulkDeleteLocations}>
                  Удалить
                </Button>
                <Button type="button" size="sm" variant="ghost" disabled={isBulkWorking} onClick={clearLocationSelected}>
                  Снять выделение
                </Button>
              </>
            );

            if (locationSelection.mode === "empty") {
              return (
                <LocationsTable
                  pois={visiblePois}
                  regions={regions}
                  categories={categories}
                  onSelect={(id) => setLocationSelection({ mode: "edit", id })}
                  onAdd={() => setLocationSelection({ mode: "create" })}
                  selection={{
                    selectedIds: locationSelectedIds,
                    onToggle: toggleLocationSelected,
                    onToggleAll: toggleAllLocationsSelected,
                    actions: bulkActions
                  }}
                />
              );
            }

            if (locationSelection.mode === "create") {
              return (
                <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setLocationSelection({ mode: "empty" })}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      ← Назад к списку
                    </button>
                    <p className="text-sm font-semibold">Новая локация</p>
                  </div>
                  <PoiForm
                    regions={regions}
                    categories={categories}
                    frequentRegionIds={frequentRegionIds}
                    defaultRegionId={locationCityFilter !== "all" ? locationCityFilter : undefined}
                    onCancel={() => setLocationSelection({ mode: "empty" })}
                    onSubmit={handleCreateLocation}
                  />
                </div>
              );
            }

            const poi = pois.find((p) => p.id === locationSelection.id);
            if (!poi) return null;

            return (
              <div className="space-y-4 rounded-lg border border-border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setLocationSelection({ mode: "empty" })}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    ← Назад к списку
                  </button>
                  <p className="text-sm font-semibold">{poi.name}</p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDuplicateLocation(poi)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Дублировать
                    </button>
                    <button
                      type="button"
                      aria-label="Удалить локацию"
                      onClick={() => handleDeleteLocation(poi)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <PoiForm
                  key={poi.id}
                  poi={poi}
                  regions={regions}
                  categories={categories}
                  frequentRegionIds={frequentRegionIds}
                  onCancel={() => setLocationSelection({ mode: "empty" })}
                  onSubmit={(input) => handleUpdateLocation(poi.id, input)}
                />
              </div>
            );
            })()
          )}
        </>
      )}

      {activeTab === "media" && (
        <MediaLibraryTab
          regions={regions}
          photos={photos.filter((photo) => photo.status === "approved")}
          onReload={loadPhotos}
        />
      )}

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

      {activeTab === "categories" && (
        <>
          {categoriesError && <p className="mb-4 text-sm font-medium text-red-600">{categoriesError}</p>}
          <p className="mb-3 text-sm text-muted-foreground">
            Категории определяют иконку и цвет маркера на карте, фильтр в боковой панели и бейдж на карточке места.
            Переименовать или удалить категорию можно только если за ней не закреплено ни одной локации.
          </p>
          <MasterDetail
            items={categories.map((category) => ({
              id: category.id,
              title: category.name,
              subtitle: `${pois.filter((poi) => poi.category === category.id).length} локаций`,
              badges: category.isHidden ? [{ label: "Скрыта", tone: "amber" as const }] : []
            }))}
            selectedId={
              categorySelection.mode === "edit" ? categorySelection.id : categorySelection.mode === "create" ? "__create__" : null
            }
            onSelect={(id) => setCategorySelection({ mode: "edit", id })}
            onAdd={() => setCategorySelection({ mode: "create" })}
            addLabel="Добавить категорию"
            searchPlaceholder="Поиск категории"
            emptyLabel="Категорий пока нет"
          >
            {categorySelection.mode === "empty" && (
              <p className="text-sm text-muted-foreground">Выберите категорию слева или добавьте новую.</p>
            )}
            {categorySelection.mode === "create" && (
              <CategoryForm onCancel={() => setCategorySelection({ mode: "empty" })} onSubmit={handleCreateCategory} />
            )}
            {categorySelection.mode === "edit" &&
              (() => {
                const category = categories.find((item) => item.id === categorySelection.id);
                if (!category) return null;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{category.name}</p>
                      <button
                        type="button"
                        aria-label="Удалить категорию"
                        onClick={() => handleDeleteCategory(category)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Удалить
                      </button>
                    </div>
                    <CategoryForm
                      key={category.id}
                      category={category}
                      onCancel={() => setCategorySelection({ mode: "empty" })}
                      onSubmit={(input) => handleUpdateCategory(category.id, input)}
                    />
                  </div>
                );
              })()}
          </MasterDetail>
        </>
      )}

      {activeTab === "reports" && <ReportsTab reports={reports} onReload={loadReports} />}

      {activeTab === "photos-moderation" && (
        <PhotoModerationTab photos={photos.filter((photo) => photo.status === "pending")} onReload={loadPhotos} />
      )}

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
                          onClick={() => handleToggleUserHiddenAccess(user)}
                          className="flex items-center gap-1 text-xs font-medium text-foreground transition hover:underline"
                        >
                          {user.canAccessHiddenCategories ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                          {user.canAccessHiddenCategories ? "Скрытые категории: вкл" : "Скрытые категории: выкл"}
                        </button>
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

      {activeTab === "push" && <PushNotificationsTab />}
    </div>
  );
}
