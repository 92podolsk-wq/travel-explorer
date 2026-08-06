import { cn } from "@/shared/lib/cn";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md border border-border bg-card/75 px-2 text-xs font-medium text-muted-foreground shadow-sm",
        className
      )}
    >
      {children}
    </span>
  );
}
