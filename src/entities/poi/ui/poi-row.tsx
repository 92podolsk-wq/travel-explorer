import Image from "next/image";
import { MapPin } from "lucide-react";
import type { Poi } from "@/entities/poi/model/types";
import { cn } from "@/shared/lib/cn";

export function PoiThumbnail({ poi, className }: { poi: Poi; className?: string }) {
  const thumbnail = poi.photos[0]?.url;

  return thumbnail ? (
    <div className={cn("relative shrink-0 overflow-hidden rounded", className)}>
      <Image src={thumbnail} alt={poi.name} fill sizes="48px" className="object-cover" />
    </div>
  ) : (
    <div className={cn("flex shrink-0 items-center justify-center rounded bg-muted text-muted-foreground", className)}>
      <MapPin className="h-5 w-5" />
    </div>
  );
}

export function PoiRow({
  poi,
  regionName,
  onSelect,
  action
}: {
  poi: Poi;
  regionName: string;
  onSelect: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex w-full items-center gap-3 rounded-md border border-border bg-card/[0.78] p-2.5 shadow-sm transition hover:bg-muted/60">
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <PoiThumbnail poi={poi} className="h-12 w-12" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{poi.name}</p>
          <p className="truncate text-xs text-muted-foreground">{regionName}</p>
        </div>
      </button>
      {action}
    </div>
  );
}
