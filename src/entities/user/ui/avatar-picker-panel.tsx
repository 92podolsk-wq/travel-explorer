import { Check } from "lucide-react";
import type { AvatarId } from "@/entities/user/model/avatars";
import { avatarIds } from "@/entities/user/model/avatars";
import { cn } from "@/shared/lib/cn";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";

export function AvatarPickerPanel({
  title,
  currentAvatarId,
  onSelect
}: {
  title: string;
  currentAvatarId?: string | null;
  onSelect: (avatarId: AvatarId) => void;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-md border border-border bg-card/[0.78] p-4">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="grid grid-cols-6 gap-3">
        {avatarIds.map((avatarId) => {
          const isSelected = currentAvatarId === avatarId;
          return (
            <button
              key={avatarId}
              type="button"
              onClick={() => onSelect(avatarId)}
              aria-label={avatarId}
              className={cn(
                "relative flex items-center justify-center rounded-full border-2 p-0.5 transition hover:-translate-y-0.5",
                isSelected ? "border-primary" : "border-transparent"
              )}
            >
              <ProfileAvatar avatarId={avatarId} className="h-11 w-11" />
              {isSelected && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-2.5 w-2.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
