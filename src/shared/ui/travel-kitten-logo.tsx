import { cn } from "@/shared/lib/cn";

type TravelKittenLogoProps = {
  className?: string;
};

export function TravelKittenLogo({ className }: TravelKittenLogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("h-8 w-8 shrink-0", className)}
      role="img"
      aria-label="Travel Explorer"
    >
      <polygon points="9,15 14,3 19,14" fill="#287f72" />
      <polygon points="31,15 26,3 21,14" fill="#287f72" />
      <polygon points="12,12.5 14.5,6 17,11.5" fill="#dff0ec" />
      <polygon points="28,12.5 25.5,6 23,11.5" fill="#dff0ec" />

      <ellipse cx="20" cy="15" rx="12.5" ry="3.4" fill="#e0a13e" />
      <path d="M12.5 15 a7.5 7 0 0 1 15 0 Z" fill="#eab659" />
      <circle cx="20" cy="8.3" r="1.1" fill="#b5771f" />

      <circle cx="20" cy="24.5" r="11" fill="#287f72" />
      <ellipse cx="20" cy="28" rx="6.2" ry="4.6" fill="#f6efe2" />

      <circle cx="16.2" cy="23.5" r="1.5" fill="#20303a" />
      <circle cx="23.8" cy="23.5" r="1.5" fill="#20303a" />
      <path d="M18.8 27 L21.2 27 L20 28.4 Z" fill="#20303a" />

      <g stroke="#20303a" strokeWidth="0.7" strokeLinecap="round">
        <line x1="9.5" y1="26.5" x2="15" y2="26" />
        <line x1="9.8" y1="29.2" x2="15.1" y2="28" />
        <line x1="30.5" y1="26.5" x2="25" y2="26" />
        <line x1="30.2" y1="29.2" x2="24.9" y2="28" />
      </g>
    </svg>
  );
}
