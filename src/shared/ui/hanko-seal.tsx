import { cn } from "@/shared/lib/cn";

type HankoSealProps = {
  character: string;
  className?: string;
};

export function HankoSeal({ character, className }: HankoSealProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-7 w-7 shrink-0 -rotate-6 items-center justify-center rounded-[4px] border border-black/10 bg-[#a3312c] font-serif text-base leading-none text-white shadow-sm",
        className
      )}
    >
      {character}
    </span>
  );
}
