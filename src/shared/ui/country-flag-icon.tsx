import { cn } from "@/shared/lib/cn";

type CountryFlagIconProps = {
  countryId: string;
  className?: string;
};

const flagMarkup: Record<string, React.ReactNode> = {
  japan: (
    <>
      <rect width="20" height="14" fill="#ffffff" />
      <circle cx="10" cy="7" r="4" fill="#bc002d" />
    </>
  ),
  belarus: (
    <>
      <rect width="20" height="14" fill="#d22730" />
      <rect width="20" height="4.67" y="9.33" fill="#4aa657" />
      <rect width="2.2" height="14" fill="#ffffff" />
      <rect width="2.2" height="1.4" y="0" fill="#d22730" />
      <rect width="2.2" height="1.4" y="2.8" fill="#d22730" />
      <rect width="2.2" height="1.4" y="5.6" fill="#d22730" />
      <rect width="2.2" height="1.4" y="8.4" fill="#d22730" />
      <rect width="2.2" height="1.4" y="11.2" fill="#d22730" />
    </>
  )
};

export function CountryFlagIcon({ countryId, className }: CountryFlagIconProps) {
  const markup = flagMarkup[countryId];

  return (
    <svg
      viewBox="0 0 20 14"
      aria-hidden="true"
      className={cn("h-2.5 w-3.5 shrink-0 overflow-hidden rounded-[2px] border border-black/5", className)}
    >
      {markup ?? <rect width="20" height="14" fill="#d3d1c7" />}
    </svg>
  );
}
