import { cn } from "@/shared/lib/cn";

type SeigaihaWatermarkProps = {
  className?: string;
};

export function SeigaihaWatermark({ className }: SeigaihaWatermarkProps) {
  return (
    <svg
      viewBox="0 0 140 140"
      aria-hidden="true"
      className={cn("pointer-events-none absolute h-36 w-36 opacity-30", className)}
    >
      <g fill="none" stroke="#a3312c" strokeWidth="1.4">
        <path d="M-10,30 Q10,10 30,30 Q50,10 70,30 Q90,10 110,30 Q130,10 150,30" />
        <path d="M-10,50 Q10,30 30,50 Q50,30 70,50 Q90,30 110,50 Q130,30 150,50" />
        <path d="M-10,70 Q10,50 30,70 Q50,50 70,70 Q90,50 110,70 Q130,50 150,70" />
        <path d="M-10,90 Q10,70 30,90 Q50,70 70,90 Q90,70 110,90 Q130,70 150,90" />
      </g>
    </svg>
  );
}
