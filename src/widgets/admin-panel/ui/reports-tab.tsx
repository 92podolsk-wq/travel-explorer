"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import type { PoiReport, PoiReportStatus } from "@/entities/poi-report/model/types";
import { cn } from "@/shared/lib/cn";

type ReportsTabProps = {
  reports: PoiReport[];
  onReload: () => void;
};

export function ReportsTab({ reports, onReload }: ReportsTabProps) {
  const [error, setError] = useState<string | null>(null);

  const handleToggleStatus = async (report: PoiReport) => {
    const nextStatus: PoiReportStatus = report.status === "new" ? "resolved" : "new";
    setError(null);
    const res = await fetch(`/api/admin/reports/${report.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });

    if (!res.ok) {
      setError("Не удалось изменить статус.");
      return;
    }

    onReload();
  };

  const handleDelete = async (report: PoiReport) => {
    if (!window.confirm("Удалить это сообщение?")) return;

    setError(null);
    const res = await fetch(`/api/admin/reports/${report.id}`, { method: "DELETE" });

    if (!res.ok) {
      setError("Не удалось удалить сообщение.");
      return;
    }

    onReload();
  };

  return (
    <div>
      {error && <p className="mb-4 text-sm font-medium text-red-600">{error}</p>}
      <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Локация</th>
              <th className="px-4 py-2.5">Пользователь</th>
              <th className="px-4 py-2.5">Сообщение</th>
              <th className="px-4 py-2.5">Дата</th>
              <th className="px-4 py-2.5">Статус</th>
              <th className="px-4 py-2.5 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Сообщений пока нет
                </td>
              </tr>
            )}
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-border align-top last:border-0">
                <td className="px-4 py-2.5 font-medium text-foreground">{report.poiName}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {report.userName ? `${report.userName} · ` : ""}
                  {report.userEmail}
                </td>
                <td className="max-w-xs px-4 py-2.5 text-foreground">{report.message}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                  {new Date(report.createdAt).toLocaleDateString("ru-RU")}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      "whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold",
                      report.status === "new" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                    )}
                  >
                    {report.status === "new" ? "Новое" : "Решено"}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(report)}
                      className="flex items-center gap-1 whitespace-nowrap text-xs font-medium text-foreground transition hover:underline"
                    >
                      {report.status === "new" ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      {report.status === "new" ? "Отметить решённым" : "Вернуть в новые"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(report)}
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
    </div>
  );
}
