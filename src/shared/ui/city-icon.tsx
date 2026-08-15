import { motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";

const glowPulse = {
  animate: { opacity: [1, 0.55, 1] },
  transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" as const }
};

const glintPulse = {
  animate: { opacity: [0.5, 1, 0.5], scale: [1, 1.08, 1] },
  transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" as const }
};

const blink = {
  animate: { scaleY: [1, 1, 1, 0.12, 1, 1] },
  transition: { duration: 4.2, repeat: Infinity, ease: "easeInOut" as const, times: [0, 0.82, 0.86, 0.9, 0.94, 1] }
};

const cityIconMarkup: Record<string, React.ReactNode> = {
  kyoto: (
    <>
      <circle cx="20" cy="20" r="20" fill="#a3312c" />
      <rect x="9" y="12" width="22" height="2.8" rx="1" fill="#f6efe2" />
      <motion.rect
        x="11"
        y="16.2"
        width="18"
        height="1.8"
        fill="#f6efe2"
        animate={glowPulse.animate}
        transition={glowPulse.transition}
      />
      <rect x="12.5" y="14.6" width="2.6" height="18" fill="#f6efe2" />
      <rect x="24.9" y="14.6" width="2.6" height="18" fill="#f6efe2" />
    </>
  ),
  osaka: (
    <>
      <circle cx="20" cy="20" r="20" fill="#e4dcc9" />
      <polygon points="12,33 28,33 30,29 10,29" fill="#5b6672" />
      <rect x="16" y="24" width="8" height="6" fill="#f6efe2" />
      <polygon points="13,25 27,25 29,20 11,20" fill="#20303a" />
      <rect x="17" y="15" width="6" height="6" fill="#f6efe2" />
      <polygon points="14,16 26,16 28,11 12,11" fill="#20303a" />
      <polygon points="12,11 28,11 24,7 16,7" fill="#3f7a4a" />
      <motion.polygon
        points="10.5,7.6 12.5,5 14,7.2"
        fill="#c9a227"
        animate={glintPulse.animate}
        transition={glintPulse.transition}
      />
      <motion.polygon
        points="26,7.2 27.5,5 29.5,7.6"
        fill="#c9a227"
        animate={glintPulse.animate}
        transition={{ ...glintPulse.transition, delay: 1.4 }}
      />
      <rect x="18.5" y="17" width="3" height="2.4" fill="#c9a227" />
    </>
  ),
  nara: (
    <>
      <circle cx="20" cy="20" r="20" fill="#e9e2c9" />
      <polygon points="13,12 10,6 15,10" fill="#a9754a" />
      <polygon points="27,12 30,6 25,10" fill="#a9754a" />
      <ellipse cx="20" cy="21" rx="9.5" ry="8.5" fill="#c68a52" />
      <ellipse cx="15.5" cy="12.5" rx="3.4" ry="4" fill="#c68a52" />
      <ellipse cx="24.5" cy="12.5" rx="3.4" ry="4" fill="#c68a52" />
      <ellipse cx="15.5" cy="13" rx="1.6" ry="2" fill="#e8c9a8" />
      <ellipse cx="24.5" cy="13" rx="1.6" ry="2" fill="#e8c9a8" />
      <ellipse cx="20" cy="24" rx="4.6" ry="4" fill="#f3e6d3" />
      <motion.circle
        cx="16.7"
        cy="19.5"
        r="1.3"
        fill="#20303a"
        style={{ transformOrigin: "16.7px 19.5px" }}
        animate={blink.animate}
        transition={blink.transition}
      />
      <motion.circle
        cx="23.3"
        cy="19.5"
        r="1.3"
        fill="#20303a"
        style={{ transformOrigin: "23.3px 19.5px" }}
        animate={blink.animate}
        transition={blink.transition}
      />
      <polygon points="19,22.5 21,22.5 20,24" fill="#3a2a1e" />
      <ellipse cx="14" cy="22" rx="1.6" ry="1.1" fill="#f3e6d3" />
      <ellipse cx="26" cy="22" rx="1.6" ry="1.1" fill="#f3e6d3" />
    </>
  )
};

type CityIconProps = {
  regionId: string;
  sealCharacter: string;
  className?: string;
};

export function CityIcon({ regionId, sealCharacter, className }: CityIconProps) {
  const markup = cityIconMarkup[regionId];

  if (!markup) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm",
          className
        )}
      >
        {sealCharacter.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={cn("h-8 w-8 shrink-0 overflow-hidden rounded-full shadow-sm", className)}
    >
      {markup}
    </svg>
  );
}
