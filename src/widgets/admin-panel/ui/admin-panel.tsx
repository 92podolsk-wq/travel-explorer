"use client";

import { useEffect, useState } from "react";
import { LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import type { Poi, PoiInput } from "@/entities/poi/model/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { PoiForm } from "./poi-form";

type ViewState =
  | { mode: "loading" }
  | { mode: "login" }
  | { mode: "list" }
  | { mode: "create" }
  | { mode: "edit"; poi: Poi };

export function AdminPanel() {
  const [view, setView] = useState<ViewState>({ mode: "loading" });
  const [pois, setPois] = useState<Poi[]>([]);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  async function loadPois() {
    const res = await fetch("/api/pois");
    const data = (await res.json()) as Poi[];
    setPois(data);
  }

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/session");
      const { authenticated } = (await res.json()) as { authenticated: boolean };

      if (authenticated) {
        await loadPois();
        setView({ mode: "list" });
      } else {
        setView({ mode: "login" });
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
      setLoginError("Incorrect password.");
      return;
    }

    setPassword("");
    await loadPois();
    setView({ mode: "list" });
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setView({ mode: "login" });
  };

  const handleCreate = async (input: PoiInput) => {
    setListError(null);
    const res = await fetch("/api/pois", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setListError("Could not create the place.");
      return;
    }

    await loadPois();
    setView({ mode: "list" });
  };

  const handleUpdate = async (id: string, input: PoiInput) => {
    setListError(null);
    const res = await fetch(`/api/pois/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setListError("Could not save changes.");
      return;
    }

    await loadPois();
    setView({ mode: "list" });
  };

  const handleDelete = async (poi: Poi) => {
    if (!window.confirm(`Delete "${poi.name}"? This can't be undone.`)) {
      return;
    }

    setListError(null);
    const res = await fetch(`/api/pois/${poi.id}`, { method: "DELETE" });

    if (!res.ok) {
      setListError("Could not delete the place.");
      return;
    }

    await loadPois();
  };

  if (view.mode === "loading") {
    return null;
  }

  if (view.mode === "login") {
    return (
      <div className="mx-auto mt-24 max-w-sm rounded-lg border border-border bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold">Travel Explorer admin</h1>
        <p className="mb-5 text-sm text-muted-foreground">Enter the admin password to manage places.</p>
        <form onSubmit={handleLogin} className="space-y-3">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
          />
          {loginError && <p className="text-sm font-medium text-red-600">{loginError}</p>}
          <Button type="submit" className="w-full">
            Log in
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Places</h1>
          <p className="text-sm text-muted-foreground">{pois.length} places in Kyoto</p>
        </div>
        <Button type="button" variant="outline" onClick={handleLogout} className="gap-1.5">
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>

      {listError && <p className="mb-4 text-sm font-medium text-red-600">{listError}</p>}

      {view.mode === "list" && (
        <>
          <Button type="button" onClick={() => setView({ mode: "create" })} className="mb-5 gap-1.5">
            <Plus className="h-4 w-4" />
            Add place
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
                      No photo
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{poi.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {poi.categories.join(", ")} · {poi.rating.toFixed(1)}★
                    </p>
                    {poi.visibilityMode === "zoomed-in" && (
                      <span className="mt-1 inline-block rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        Zoomed-in only
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    aria-label={`Edit ${poi.name}`}
                    onClick={() => setView({ mode: "edit", poi })}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${poi.name}`}
                    onClick={() => handleDelete(poi)}
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

      {view.mode === "create" && (
        <PoiForm onCancel={() => setView({ mode: "list" })} onSubmit={handleCreate} />
      )}

      {view.mode === "edit" && (
        <PoiForm poi={view.poi} onCancel={() => setView({ mode: "list" })} onSubmit={(input) => handleUpdate(view.poi.id, input)} />
      )}
    </div>
  );
}
