"use client";

import { Trash2, Undo2 } from "lucide-react";
import type { TrashedPoi } from "@/shared/server/pois-repository";
import type { Region } from "@/entities/region/model/types";

type LocationsTrashTableProps = {
  items: TrashedPoi[];
  regions: Region[];
  onRestore: (id: string) => void;
  onPurge: (id: string) => void;
  onClose: () => void;
};

function formatDeletedAt(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function LocationsTrashTable({ items, regions, onRestore, onPurge, onClose }: LocationsTrashTableProps) {
  const cityName = (regionId: string) => regions.find((region) => region.id === regionId)?.name ?? regionId;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-border p-2.5">
        <p className="text-sm font-semibold">Корзина</p>
        <button type="button" onClick={onClose} className="text-xs font-medium text-muted-foreground hover:text-foreground">
          ← Назад к списку
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5">Название</th>
              <th className="px-3 py-2.5">Город</th>
              <th className="px-3 py-2.5">Удалено</th>
              <th className="px-3 py-2.5 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Корзина пуста
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2 font-medium text-foreground">{item.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{cityName(item.regionId)}</td>
                <td className="px-3 py-2 text-muted-foreground">{formatDeletedAt(item.deletedAt)}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => onRestore(item.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      Восстановить
                    </button>
                    <button
                      type="button"
                      onClick={() => onPurge(item.id)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Удалить навсегда
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
