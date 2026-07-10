"use client";

import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Heart, X as XIcon } from "lucide-react";
import type { Poi } from "@/entities/poi/model/types";
import { getTranslations } from "@/shared/i18n/translations";
import type { Language } from "@/shared/i18n/types";

type SwipeDiscoveryModalProps = {
  pois: Poi[];
  language: Language;
  onLike: (poiId: string) => void;
  onSkip: (poiId: string) => void;
  onClose: () => void;
};

const SWIPE_THRESHOLD = 120;
const FLY_OUT_DISTANCE = 500;

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function SwipeCard({
  poi,
  name,
  description,
  onLike,
  onSkip
}: {
  poi: Poi;
  name: string;
  description: string;
  onLike: () => void;
  onSkip: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const skipOpacity = useTransform(x, [-120, -20], [1, 0]);

  function handleDragEnd(_event: unknown, info: { offset: { x: number } }) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      animate(x, FLY_OUT_DISTANCE, { duration: 0.25, ease: "easeOut", onComplete: onLike });
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      animate(x, -FLY_OUT_DISTANCE, { duration: 0.25, ease: "easeOut", onComplete: onSkip });
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  }

  return (
    <motion.div
      drag="x"
      style={{ x, rotate }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 cursor-grab overflow-hidden rounded-2xl bg-white shadow-panel active:cursor-grabbing"
    >
      {poi.photos[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poi.photos[0].url} alt="" className="h-full w-full select-none object-cover" draggable={false} />
      ) : (
        <div className="h-full w-full bg-muted" />
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-4">
        <p className="text-lg font-semibold text-white drop-shadow">{name}</p>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
        <p className="line-clamp-2 text-xs text-white/90">{description}</p>
      </div>
      <motion.div
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute right-4 top-4 rotate-[-12deg] rounded border-4 border-emerald-400 px-3 py-1 text-lg font-black uppercase tracking-wide text-emerald-400"
      >
        <Heart className="h-6 w-6" />
      </motion.div>
      <motion.div
        style={{ opacity: skipOpacity }}
        className="pointer-events-none absolute left-4 top-4 rotate-[12deg] rounded border-4 border-red-400 px-3 py-1 text-lg font-black uppercase tracking-wide text-red-400"
      >
        <XIcon className="h-6 w-6" />
      </motion.div>
    </motion.div>
  );
}

export function SwipeDiscoveryModal({ pois, language, onLike, onSkip, onClose }: SwipeDiscoveryModalProps) {
  const t = getTranslations(language);
  const [deck] = useState(() => shuffle(pois));
  const [index, setIndex] = useState(0);

  const current = deck[index];
  const next = deck[index + 1];

  function handleLike() {
    if (!current) return;
    onLike(current.id);
    setIndex((i) => i + 1);
  }

  function handleSkip() {
    if (!current) return;
    onSkip(current.id);
    setIndex((i) => i + 1);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") handleLike();
      else if (event.key === "ArrowLeft") handleSkip();
      else if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const nameFor = (poi: Poi) => poi.nameByLanguage[language] ?? poi.name;
  const descriptionFor = (poi: Poi) => t.poi[poi.id]?.description ?? poi.description;

  return (
    <>
      <button
        type="button"
        aria-label={t.app.swipeClose}
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 flex w-[22rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4">
        <div className="flex w-full items-center justify-between">
          <p className="text-sm font-semibold text-white drop-shadow">{t.app.swipeDiscovery}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.app.swipeClose}
            className="rounded-full bg-white/90 p-1.5 text-foreground shadow-sm transition hover:bg-white"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="relative h-[26rem] w-full">
          {!current ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl bg-white p-6 text-center shadow-panel">
              <p className="text-sm text-muted-foreground">{t.app.swipeEmpty}</p>
            </div>
          ) : (
            <>
              {next?.photos[0] && (
                <div className="absolute inset-0 scale-[0.95] overflow-hidden rounded-2xl opacity-70">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={next.photos[0].url} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <SwipeCard
                key={current.id}
                poi={current}
                name={nameFor(current)}
                description={descriptionFor(current)}
                onLike={handleLike}
                onSkip={handleSkip}
              />
            </>
          )}
        </div>

        {current && (
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={handleSkip}
              aria-label={t.app.swipeSkip}
              title={t.app.swipeSkip}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-red-500 shadow-panel transition hover:scale-105"
            >
              <XIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={handleLike}
              aria-label={t.app.swipeLike}
              title={t.app.swipeLike}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-primary shadow-panel transition hover:scale-105"
            >
              <Heart className="h-6 w-6" />
            </button>
          </div>
        )}

        {current && (
          <p className="text-xs font-medium text-white/90 drop-shadow">
            {t.app.swipeProgress.replace("{current}", String(index + 1)).replace("{total}", String(deck.length))}
          </p>
        )}
      </div>
    </>
  );
}
