"use client";

import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
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
const FLY_OUT_DISTANCE = 560;
const FALL_EASE: [number, number, number, number] = [0.5, 0, 0.9, 0.4];

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
  x,
  y,
  onLike,
  onSkip
}: {
  poi: Poi;
  name: string;
  description: string;
  x: MotionValue<number>;
  y: MotionValue<number>;
  onLike: () => void;
  onSkip: () => void;
}) {
  const rotate = useTransform(x, [-320, 320], [-16, 16]);
  const likeOpacity = useTransform(x, [20, 130], [0, 1]);
  const skipOpacity = useTransform(x, [-130, -20], [1, 0]);

  function handleDragEnd(_event: unknown, info: { offset: { x: number } }) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      animate(x, FLY_OUT_DISTANCE, { duration: 0.45, ease: FALL_EASE });
      animate(y, 280, { duration: 0.45, ease: FALL_EASE, onComplete: onLike });
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      animate(x, -FLY_OUT_DISTANCE, { duration: 0.45, ease: FALL_EASE });
      animate(y, 280, { duration: 0.45, ease: FALL_EASE, onComplete: onSkip });
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
      animate(y, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  }

  return (
    <motion.div
      drag="x"
      style={{ x, y, rotate }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.92, opacity: 0, y: -90 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="absolute inset-0 flex cursor-grab flex-col rounded-sm bg-white p-3 pb-[4.75rem] shadow-[0_18px_45px_-12px_rgba(0,0,0,0.45)] active:cursor-grabbing"
    >
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[2px] bg-muted">
        {poi.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poi.photos[0].url} alt="" className="h-full w-full select-none object-cover" draggable={false} />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}

        {poi.mustVisit && (
          <span className="absolute left-3 top-3 -rotate-2 rounded bg-primary/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow">
            Must Visit
          </span>
        )}

        <motion.div
          style={{ opacity: likeOpacity }}
          className="pointer-events-none absolute right-4 top-4 flex -rotate-12 items-center gap-1.5 rounded border-4 border-emerald-400 bg-white/10 px-3 py-1.5 text-lg font-black uppercase tracking-wide text-emerald-400 backdrop-blur-sm"
        >
          <Heart className="h-5 w-5 fill-current" />
          Like
        </motion.div>
        <motion.div
          style={{ opacity: skipOpacity }}
          className="pointer-events-none absolute left-4 top-4 flex rotate-12 items-center gap-1.5 rounded border-4 border-red-400 bg-white/10 px-3 py-1.5 text-lg font-black uppercase tracking-wide text-red-400 backdrop-blur-sm"
        >
          <XIcon className="h-5 w-5" />
          Skip
        </motion.div>
      </div>

      <div className="flex shrink-0 flex-col justify-center gap-0.5 px-1 pt-3">
        <p className="truncate text-base font-semibold text-neutral-800">{name}</p>
        <p className="line-clamp-1 text-xs text-neutral-500">{description}</p>
      </div>
    </motion.div>
  );
}

export function SwipeDiscoveryModal({ pois, language, onLike, onSkip, onClose }: SwipeDiscoveryModalProps) {
  const t = getTranslations(language);
  const [deck] = useState(() => shuffle(pois));
  const [index, setIndex] = useState(0);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const backdropColor = useTransform(
    x,
    [-260, 0, 260],
    ["rgba(127,29,29,0.6)", "rgba(0,0,0,0.55)", "rgba(6,78,59,0.6)"]
  );

  const current = deck[index];
  const next = deck[index + 1];

  useEffect(() => {
    x.set(0);
    y.set(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

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
      <motion.button
        type="button"
        aria-label={t.app.swipeClose}
        className="fixed inset-0 z-40"
        style={{ backgroundColor: backdropColor }}
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 z-50 flex w-[25rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4">
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

        <div className="relative h-[60dvh] w-full max-h-[34rem]">
          {!current ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-sm bg-white p-6 text-center shadow-panel">
              <p className="text-sm text-muted-foreground">{t.app.swipeEmpty}</p>
            </div>
          ) : (
            <>
              {next && (
                <div className="absolute inset-0 rotate-2 scale-[0.94] rounded-sm bg-white p-3 pb-[4.75rem] opacity-80 shadow-xl">
                  <div className="h-full w-full overflow-hidden rounded-[2px] bg-muted">
                    {next.photos[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={next.photos[0].url} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                </div>
              )}
              <SwipeCard
                key={current.id}
                poi={current}
                name={nameFor(current)}
                description={descriptionFor(current)}
                x={x}
                y={y}
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
