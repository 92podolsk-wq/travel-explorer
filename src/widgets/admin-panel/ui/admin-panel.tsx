"use client";

import { useEffect, useState } from "react";
import { Ban, Eye, EyeOff, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import type { AdminAccount } from "@/entities/admin-account/model/types";
import type { Area, AreaInput } from "@/entities/area/model/types";
import type { Category, CategoryInput } from "@/entities/category/model/types";
import type { Country, CountryInput } from "@/entities/country/model/types";
import type { ExplorationMode, ExplorationModeInput } from "@/entities/exploration-mode/model/types";
import type { AdminPhoto } from "@/entities/photo/model/types";
import type { Poi, PoiInput } from "@/entities/poi/model/types";
import type { PoiReport } from "@/entities/poi-report/model/types";
import type { Region, RegionInput } from "@/entities/region/model/types";
import type { AdminUser } from "@/entities/user/model/types";
import { getTranslations } from "@/shared/i18n/translations";
import { Button } from "@/shared/ui/button";
import { CityPicker } from "@/shared/ui/city-picker";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/cn";
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
import { MasterDetail } from "./master-detail";
import { MediaLibraryTab } from "./media-library-tab";
import { PhotoModerationTab } from "./photo-moderation-tab";
import { PushNotificationsTab } from "./push-notifications-tab";
import { ReportsTab } from "./reports-tab";
import { PoiForm } from "./poi-form";
import { RegionForm } from "./region-form";
import { SiteSettingsTab } from "./site-settings-tab";

type AuthViewState = { mode: "loading" } | { mode: "login" } | { mode: "ready" } | { mode: "error"; message: string };

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

const t = getTranslations("ru");

export function AdminPanel() {
  const [authView, setAuthView] = useState<AuthViewState>({ mode: "loading" });
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const [countries, setCountries] = useState<Country[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [pois, setPois] = useState<Poi[]>([]);
  const [explorationModes, setExplorationModes] = useState<ExplorationMode[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [reports, setReports] = useState<PoiReport[]>([]);
  const [photos, setPhotos] = useState<AdminPhoto[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<{ name: string; email: string } | null>(null);

  const [countrySelection, setCountrySelection] = useState<Selection>({ mode: "empty" });
  const [areaSelection, setAreaSelection] = useState<Selection>({ mode: "empty" });
  const [citySelection, setCitySelection] = useState<Selection>({ mode: "empty" });
  const [locationSelection, setLocationSelection] = useState<Selection>({ mode: "empty" });
  const [locationCityFilter, setLocationCityFilter] = useState<string>("all");
  const [showDraftsOnly, setShowDraftsOnly] = useState(false);
  const [locationSelectedIds, setLocationSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCityTarget, setBulkCityTarget] = useState<string>("");
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState<string>("");
  const [isBulkWorking, setIsBulkWorking] = useState(false);
  const [modeSelection, setModeSelection] = useState<Selection>({ mode: "empty" });
  const [categorySelection, setCategorySelection] = useState<Selection>({ mode: "empty" });
  const [accountSelection, setAccountSelection] = useState<Selection>({ mode: "empty" });

  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [areasError, setAreasError] = useState<string | null>(null);
  const [citiesError, setCitiesError] = useState<string | null>(null);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [modesError, setModesError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function loadCountries() {
    const res = await fetch("/api/countries");
    if (!res.ok) throw new Error("Failed to load countries");
    setCountries((await res.json()) as Country[]);
  }
  async function loadAreas() {
    const res = await fetch("/api/areas");
    if (!res.ok) throw new Error("Failed to load areas");
    setAreas((await res.json()) as Area[]);
  }
  async function loadRegions() {
    const res = await fetch("/api/regions");
    if (!res.ok) throw new Error("Failed to load regions");
    setRegions((await res.json()) as Region[]);
  }
  async function loadPois() {
    const res = await fetch("/api/pois");
    if (!res.ok) throw new Error("Failed to load pois");
    setPois((await res.json()) as Poi[]);
  }
  async function loadExplorationModes() {
    const res = await fetch("/api/exploration-modes");
    if (!res.ok) throw new Error("Failed to load exploration modes");
    setExplorationModes((await res.json()) as ExplorationMode[]);
  }
  async function loadCategories() {
    const res = await fetch("/api/categories");
    if (!res.ok) throw new Error("Failed to load categories");
    setCategories((await res.json()) as Category[]);
  }
  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    if (!res.ok) throw new Error("Failed to load users");
    setUsers((await res.json()) as AdminUser[]);
  }
  async function loadAccounts() {
    const res = await fetch("/api/admin/accounts");
    if (!res.ok) throw new Error("Failed to load accounts");
    setAccounts((await res.json()) as AdminAccount[]);
  }
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

  async function checkSessionAndLoad() {
    setAuthView({ mode: "loading" });
    try {
      const res = await fetch("/api/admin/session");
      if (!res.ok) throw new Error("Session check failed");
      const { authenticated, admin } = (await res.json()) as {
        authenticated: boolean;
        admin: { name: string; email: string } | null;
      };

      if (!authenticated) {
        setAuthView({ mode: "login" });
        return;
      }

      setCurrentAdmin(admin);
      await loadAllAdminData();
      setAuthView({ mode: "ready" });
    } catch {
      setAuthView({
        mode: "error",
        message: "Не удалось загрузить админ-панель. Проверьте соединение и попробуйте снова."
      });
    }
  }

  useEffect(() => {
    void checkSessionAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
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
      await loadAllAdminData();
      setAuthView({ mode: "ready" });
    } catch {
      setLoginError("Не удалось войти. Проверьте соединение и попробуйте снова.");
    } finally {
      setIsLoggingIn(false);
    }
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

  const handleDuplicateLocation = async (poi: Poi) => {
    setLocationsError(null);
    const input: PoiInput = {
      regionId: poi.regionId,
      name: `${poi.name} (копия)`,
      nameByLanguage: poi.nameByLanguage,
      coordinates: poi.coordinates,
      description: poi.description,
      descriptionByLanguage: poi.descriptionByLanguage,
      rating: poi.rating,
      photos: poi.photos,
      category: poi.category,
      tags: poi.tags,
      seasons: poi.seasons,
      photoScore: poi.photoScore,
      mustVisit: poi.mustVisit,
      bestTime: poi.bestTime,
      bestTimeByLanguage: poi.bestTimeByLanguage,
      difficulty: poi.difficulty,
      durationMinutes: poi.durationMinutes,
      importance: poi.importance,
      status: "draft"
    };
    const res = await fetch("/api/pois", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setLocationsError("Не удалось дублировать локацию.");
      return;
    }

    const created = (await res.json()) as Poi;
    await loadPois();
    setLocationSelection({ mode: "edit", id: created.id });
  };

  const toggleLocationSelected = (id: string) => {
    setLocationSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllLocationsSelected = (ids: string[]) => {
    setLocationSelectedIds((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      return allSelected ? new Set() : new Set(ids);
    });
  };

  const handleBulkSetStatus = async (status: "draft" | "published") => {
    setLocationsError(null);
    setIsBulkWorking(true);
    try {
      const targets = pois.filter((poi) => locationSelectedIds.has(poi.id));
      await Promise.all(
        targets.map((poi) =>
          fetch(`/api/pois/${poi.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...poi, status })
          })
        )
      );
      setLocationSelectedIds(new Set());
      await loadPois();
    } finally {
      setIsBulkWorking(false);
    }
  };

  const handleBulkDeleteLocations = async () => {
    if (!window.confirm(`Удалить выбранные локации (${locationSelectedIds.size})? Это действие нельзя отменить.`)) {
      return;
    }

    setLocationsError(null);
    setIsBulkWorking(true);
    try {
      await Promise.all([...locationSelectedIds].map((id) => fetch(`/api/pois/${id}`, { method: "DELETE" })));
      setLocationSelectedIds(new Set());
      setLocationSelection({ mode: "empty" });
      await loadPois();
    } finally {
      setIsBulkWorking(false);
    }
  };

  const handleBulkChangeCity = async () => {
    if (!bulkCityTarget) return;
    setLocationsError(null);
    setIsBulkWorking(true);
    try {
      const targets = pois.filter((poi) => locationSelectedIds.has(poi.id));
      await Promise.all(
        targets.map((poi) =>
          fetch(`/api/pois/${poi.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...poi, regionId: bulkCityTarget })
          })
        )
      );
      setLocationSelectedIds(new Set());
      setBulkCityTarget("");
      await loadPois();
    } finally {
      setIsBulkWorking(false);
    }
  };

  const handleBulkChangeCategory = async () => {
    if (!bulkCategoryTarget) return;
    setLocationsError(null);
    setIsBulkWorking(true);
    try {
      const targets = pois.filter((poi) => locationSelectedIds.has(poi.id));
      await Promise.all(
        targets.map((poi) =>
          fetch(`/api/pois/${poi.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...poi, category: bulkCategoryTarget })
          })
        )
      );
      setLocationSelectedIds(new Set());
      setBulkCategoryTarget("");
      await loadPois();
    } finally {
      setIsBulkWorking(false);
    }
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

  const handleCreateCategory = async (input: CategoryInput) => {
    setCategoriesError(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setCategoriesError(data?.error ?? "Не удалось создать категорию.");
      return;
    }

    const created = (await res.json()) as Category;
    await loadCategories();
    setCategorySelection({ mode: "edit", id: created.id });
  };

  const handleUpdateCategory = async (id: string, input: CategoryInput) => {
    setCategoriesError(null);
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setCategoriesError(data?.error ?? "Не удалось сохранить изменения.");
      return;
    }

    await loadCategories();
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`Удалить категорию «${category.name}»? Это действие нельзя отменить.`)) {
      return;
    }

    setCategoriesError(null);
    const res = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setCategoriesError(data?.error ?? "Не удалось удалить категорию.");
      return;
    }

    setCategorySelection({ mode: "empty" });
    await loadCategories();
  };

  const handleToggleUserHiddenAccess = async (user: AdminUser) => {
    setUsersError(null);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canAccessHiddenCategories: !user.canAccessHiddenCategories })
    });

    if (!res.ok) {
      setUsersError("Не удалось изменить доступ к скрытым категориям.");
      return;
    }

    await loadUsers();
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
      setActiveTab("locations");
      setLocationSelection({ mode: "edit", id: result.id });
    } else if (result.type === "city") {
      setActiveTab("cities");
      setCitySelection({ mode: "edit", id: result.id });
    } else if (result.type === "country") {
      setActiveTab("countries");
      setCountrySelection({ mode: "edit", id: result.id });
    } else if (result.type === "area") {
      setActiveTab("areas");
      setAreaSelection({ mode: "edit", id: result.id });
    } else if (result.type === "mode") {
      setActiveTab("modes");
      setModeSelection({ mode: "edit", id: result.id });
    } else if (result.type === "category") {
      setActiveTab("categories");
      setCategorySelection({ mode: "edit", id: result.id });
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
              {group === "community" && communityBadgeCount > 0 && (
                <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {communityBadgeCount}
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
              {tab === "photos-moderation" && pendingPhotosCount > 0 && (
                <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {pendingPhotosCount}
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
          </div>
          {(() => {
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
                <Button type="button" size="sm" variant="ghost" disabled={isBulkWorking} onClick={() => setLocationSelectedIds(new Set())}>
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
          })()}
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
