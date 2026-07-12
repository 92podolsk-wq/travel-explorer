"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut } from "lucide-react";
import type { AuthMeResponse } from "@/entities/user/model/types";
import { getTranslations } from "@/shared/i18n/translations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";

type FormMode = "login" | "register";

export function AuthMenu() {
  const language = useExplorerStore((state) => state.language);
  const currentUser = useExplorerStore((state) => state.currentUser);
  const authStatus = useExplorerStore((state) => state.authStatus);
  const hydrateAuth = useExplorerStore((state) => state.hydrateAuth);
  const setItinerary = useExplorerStore((state) => state.setItinerary);
  const setItineraries = useExplorerStore((state) => state.setItineraries);
  const setActiveItineraryId = useExplorerStore((state) => state.setActiveItineraryId);
  const t = getTranslations(language).auth;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setEmail("");
    setPassword("");
    setName("");
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const endpoint = formMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = formMode === "login" ? { email, password } : { email, password, name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Что-то пошло не так.");
        return;
      }

      const meRes = await fetch("/api/auth/me");
      const meData = (await meRes.json()) as AuthMeResponse;
      hydrateAuth(
        meData.user,
        meData.user
          ? {
              favoritePoiIds: meData.favoritePoiIds ?? [],
              viewedPoiIds: meData.viewedPoiIds ?? [],
              visitedPoiIds: meData.visitedPoiIds ?? []
            }
          : undefined
      );
      setIsFormOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    hydrateAuth(null);
    setItinerary(null);
    setItineraries([]);
    setActiveItineraryId(null);
    setIsUserMenuOpen(false);
  }

  if (authStatus === "loading") {
    return <div className="h-9 w-20" aria-hidden="true" />;
  }

  if (authStatus === "authenticated" && currentUser) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsUserMenuOpen((value) => !value)}
          aria-expanded={isUserMenuOpen}
          className="flex max-w-[7.5rem] items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted/60 sm:max-w-none"
        >
          <ProfileAvatar avatarId={currentUser.avatarId} className="h-6 w-6 shrink-0" />
          <span className="truncate">{currentUser.name || currentUser.email}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        {isUserMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => setIsUserMenuOpen(false)}
            />
            <div className="absolute right-0 top-full z-40 mt-2 w-48 rounded-lg border border-border bg-white p-1.5 shadow-panel">
              <Link
                href="/account"
                onClick={() => setIsUserMenuOpen(false)}
                className="block rounded px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/60"
              >
                {t.account}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-1.5 rounded px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-muted/60"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                {t.logout}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setFormMode("login");
          resetForm();
          setIsFormOpen(true);
        }}
      >
        {t.login}
      </Button>

      {isFormOpen && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setIsFormOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-white p-6 shadow-panel">
            <h2 className="text-base font-semibold text-foreground">
              {formMode === "login" ? t.loginTitle : t.registerTitle}
            </h2>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              {formMode === "register" && (
                <Input
                  placeholder={t.name}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                />
              )}
              <Input
                type="email"
                required
                placeholder={t.email}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
              <Input
                type="password"
                required
                minLength={8}
                placeholder={t.password}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={formMode === "login" ? "current-password" : "new-password"}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={isSubmitting}>
                {t.submit}
              </Button>
            </form>
            <button
              type="button"
              className="mt-3 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
              onClick={() => {
                setFormMode((mode) => (mode === "login" ? "register" : "login"));
                setError(null);
              }}
            >
              {formMode === "login" ? t.switchToRegister : t.switchToLogin}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
