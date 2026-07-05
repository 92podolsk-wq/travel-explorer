"use client";

import { Clock, Heart, Mountain, Star, SunMedium } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { getTranslations } from "@/shared/i18n/translations";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { cn } from "@/shared/lib/cn";

export function PoiDetails() {
  const pois = useExplorerStore((state) => state.pois);
  const selectedPoiId = useExplorerStore((state) => state.selectedPoiId);
  const favorites = useExplorerStore((state) => state.favorites);
  const language = useExplorerStore((state) => state.language);
  const toggleFavorite = useExplorerStore((state) => state.toggleFavorite);
  const selectedPoi = pois.find((poi) => poi.id === selectedPoiId);
  const t = getTranslations(language);

  if (!selectedPoi) {
    return null;
  }

  const isFavorite = favorites.includes(selectedPoi.id);
  const poiCopy = t.poi[selectedPoi.id];
  const bestTime = poiCopy?.bestTime ?? selectedPoi.bestTime;

  return (
    <motion.section
      key={selectedPoi.id}
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="absolute right-5 top-5 z-10 hidden h-[calc(100dvh-2.5rem)] w-[400px] flex-col overflow-hidden rounded-lg border border-white/70 bg-white/[0.84] shadow-panel backdrop-blur-xl lg:flex"
    >
      <div className="relative m-3 h-64 shrink-0 overflow-hidden rounded-lg">
        <Image
          src={selectedPoi.photos[0]?.url}
          alt={selectedPoi.photos[0]?.alt ?? selectedPoi.name}
          width={760}
          height={448}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 via-black/[0.22] to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          {selectedPoi.mustVisit && (
            <Badge className="border-white/70 bg-white/[0.88] text-foreground">{t.app.mustVisit}</Badge>
          )}
          <Badge className="border-white/70 bg-white/[0.88] text-foreground">
            {t.app.photo} {selectedPoi.photoScore}
          </Badge>
        </div>
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <h2 className="text-3xl font-semibold tracking-normal">{selectedPoi.name}</h2>
          <div className="mt-2 flex items-center gap-3 text-sm font-medium">
            <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.18] px-2 py-1 backdrop-blur">
              <Star className="h-4 w-4 fill-white" />
              {selectedPoi.rating.toFixed(1)}
            </span>
            <span className="rounded-md bg-white/[0.18] px-2 py-1 backdrop-blur">
              {t.difficulty[selectedPoi.difficulty]}
            </span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-2">
        <div className="mb-5 flex gap-2">
          <Button
            type="button"
            variant={isFavorite ? "default" : "outline"}
            onClick={() => toggleFavorite(selectedPoi.id)}
            className="h-11 flex-1"
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
            {t.app.save}
          </Button>
        </div>

        <p className="text-[15px] leading-7 text-muted-foreground">
          {poiCopy?.description ?? selectedPoi.description}
        </p>

        <div className="mt-6 grid grid-cols-3 gap-2.5">
          <Metric
            icon={<SunMedium className="h-4 w-4" />}
            label={t.app.best}
            value={bestTime[0] ?? ""}
          />
          <Metric
            icon={<Clock className="h-4 w-4" />}
            label={t.app.duration}
            value={`${selectedPoi.durationMinutes}${t.app.minutesShort}`}
          />
          <Metric
            icon={<Mountain className="h-4 w-4" />}
            label={t.app.effort}
            value={t.difficulty[selectedPoi.difficulty]}
          />
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold">{t.app.bestTime}</h3>
          <div className="flex flex-wrap gap-2">
            {bestTime.map((time) => (
              <Badge key={time}>{time}</Badge>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold">{t.app.signals}</h3>
          <div className="flex flex-wrap gap-2">
            {selectedPoi.categories.map((category) => (
              <Badge key={category}>{t.category[category]}</Badge>
            ))}
            {selectedPoi.tags.map((tag) => (
              <Badge key={tag}>{t.tag[tag]}</Badge>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

type MetricProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function Metric({ icon, label, value }: MetricProps) {
  return (
    <div className="rounded-md border border-white/70 bg-white/[0.58] p-3 shadow-sm">
      <div className="mb-2 text-primary">{icon}</div>
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
