import { type AvatarId, isAvatarId } from "@/entities/user/model/avatars";
import { cn } from "@/shared/lib/cn";

export { avatarIds, type AvatarId } from "@/entities/user/model/avatars";

const avatarMarkup: Record<AvatarId, React.ReactNode> = {
  compass: (
    <>
      <circle cx="20" cy="20" r="20" fill="#dbe7f3" />
      <circle cx="20" cy="20" r="12" fill="none" stroke="#33475b" strokeWidth="1.4" />
      <polygon points="20,10 23,20 20,17" fill="#c8402f" />
      <polygon points="20,30 17,20 20,23" fill="#f6efe2" stroke="#33475b" strokeWidth="0.6" />
      <circle cx="20" cy="20" r="1.6" fill="#33475b" />
    </>
  ),
  globe: (
    <>
      <circle cx="20" cy="20" r="20" fill="#cdeee6" />
      <circle cx="20" cy="20" r="12" fill="none" stroke="#2f6b5e" strokeWidth="1.4" />
      <ellipse cx="20" cy="20" rx="5" ry="12" fill="none" stroke="#2f6b5e" strokeWidth="1.2" />
      <line x1="8" y1="20" x2="32" y2="20" stroke="#2f6b5e" strokeWidth="1.2" />
      <line x1="9.5" y1="14" x2="30.5" y2="14" stroke="#2f6b5e" strokeWidth="1" />
      <line x1="9.5" y1="26" x2="30.5" y2="26" stroke="#2f6b5e" strokeWidth="1" />
    </>
  ),
  mountain: (
    <>
      <circle cx="20" cy="20" r="20" fill="#cfe9f7" />
      <circle cx="28" cy="11" r="3.2" fill="#eab659" />
      <polygon points="5,29 15,15 21,23 27,13 35,29" fill="#5b7a94" />
      <polygon points="15,15 18,19.5 12,19.5" fill="#f6efe2" />
      <polygon points="27,13 29.5,17 24.5,17" fill="#f6efe2" />
    </>
  ),
  sun: (
    <>
      <circle cx="20" cy="20" r="20" fill="#fdf1d6" />
      <g stroke="#e8a23a" strokeWidth="1.6" strokeLinecap="round">
        <line x1="20" y1="5" x2="20" y2="9.5" />
        <line x1="20" y1="30.5" x2="20" y2="35" />
        <line x1="5" y1="20" x2="9.5" y2="20" />
        <line x1="30.5" y1="20" x2="35" y2="20" />
        <line x1="9.4" y1="9.4" x2="12.5" y2="12.5" />
        <line x1="27.5" y1="27.5" x2="30.6" y2="30.6" />
        <line x1="30.6" y1="9.4" x2="27.5" y2="12.5" />
        <line x1="12.5" y1="27.5" x2="9.4" y2="30.6" />
      </g>
      <circle cx="20" cy="20" r="8" fill="#f2a736" />
    </>
  ),
  camera: (
    <>
      <circle cx="20" cy="20" r="20" fill="#e8e2f5" />
      <rect x="8" y="14" width="24" height="16" rx="2.5" fill="#3f3f56" />
      <rect x="15" y="10" width="10" height="4.5" rx="1.2" fill="#3f3f56" />
      <circle cx="20" cy="22" r="6" fill="#8fa8d6" />
      <circle cx="20" cy="22" r="3.4" fill="#2b2b3d" />
      <circle cx="27.5" cy="17.5" r="1.1" fill="#f6efe2" />
    </>
  ),
  plane: (
    <>
      <circle cx="20" cy="20" r="20" fill="#d7ecfa" />
      <g transform="rotate(45 20 20)">
        <polygon points="20,6 24,26 20,23 16,26" fill="#3f6fa8" />
        <polygon points="20,15 31,22 20,20" fill="#5b8ec4" />
        <polygon points="20,15 9,22 20,20" fill="#5b8ec4" />
        <polygon points="17.5,26 22.5,26 20,32" fill="#3f6fa8" />
      </g>
    </>
  ),
  backpack: (
    <>
      <circle cx="20" cy="20" r="20" fill="#f3e0c8" />
      <path d="M14 15 a6 6 0 0 1 12 0 v2 h-12 Z" fill="none" stroke="#8a5a3a" strokeWidth="1.4" />
      <rect x="11" y="15" width="18" height="17" rx="4" fill="#c8622f" />
      <rect x="15.5" y="21" width="9" height="7" rx="2" fill="#eab659" />
      <line x1="16" y1="17.5" x2="16" y2="32" stroke="#8a5a3a" strokeWidth="1" />
      <line x1="24" y1="17.5" x2="24" y2="32" stroke="#8a5a3a" strokeWidth="1" />
    </>
  ),
  "map-pin": (
    <>
      <circle cx="20" cy="20" r="20" fill="#f6d9d9" />
      <path d="M20 8 C13.5 8 9 13 9 18.5 C9 26 20 34 20 34 C20 34 31 26 31 18.5 C31 13 26.5 8 20 8 Z" fill="#c8402f" />
      <circle cx="20" cy="18" r="5" fill="#f6efe2" />
    </>
  ),
  suitcase: (
    <>
      <circle cx="20" cy="20" r="20" fill="#d9e8d5" />
      <path d="M16 12 a4 4 0 0 1 8 0 v3 h-8 Z" fill="none" stroke="#4a7a3c" strokeWidth="1.4" />
      <rect x="9" y="15" width="22" height="16" rx="3" fill="#5a9448" />
      <rect x="17.5" y="21" width="5" height="3" rx="1" fill="#f6efe2" />
      <line x1="9" y1="22" x2="31" y2="22" stroke="#3f7a35" strokeWidth="1" />
    </>
  ),
  tent: (
    <>
      <circle cx="20" cy="20" r="20" fill="#e6ddf0" />
      <line x1="8" y1="31" x2="32" y2="31" stroke="#6b5a8a" strokeWidth="1.4" />
      <polygon points="20,9 32,31 8,31" fill="#7a5fa0" />
      <polygon points="20,17 26,31 14,31" fill="#5a4478" />
      <line x1="20" y1="9" x2="20" y2="31" stroke="#3f2f5a" strokeWidth="1" />
    </>
  ),
  binoculars: (
    <>
      <circle cx="20" cy="20" r="20" fill="#dbe3ea" />
      <rect x="16.5" y="15" width="7" height="4" fill="#5b6b7a" />
      <circle cx="14.5" cy="23" r="6" fill="#3f4d5a" />
      <circle cx="25.5" cy="23" r="6" fill="#3f4d5a" />
      <circle cx="14.5" cy="23" r="3.2" fill="#8fa8d6" />
      <circle cx="25.5" cy="23" r="3.2" fill="#8fa8d6" />
    </>
  ),
  balloon: (
    <>
      <circle cx="20" cy="20" r="20" fill="#fbe3ea" />
      <path d="M20 6 C13 6 10 13 12 19 C13.5 23 17 25 17 27 h6 c0-2 3.5-4 5-8 C30 13 27 6 20 6 Z" fill="#d9718f" />
      <line x1="17.3" y1="27" x2="15.5" y2="31" stroke="#6b4a3a" strokeWidth="1" />
      <line x1="22.7" y1="27" x2="24.5" y2="31" stroke="#6b4a3a" strokeWidth="1" />
      <rect x="16.5" y="31" width="7" height="4" rx="0.8" fill="#8a5a3a" />
    </>
  )
};

type ProfileAvatarProps = {
  avatarId?: string | null;
  className?: string;
};

export function ProfileAvatar({ avatarId, className }: ProfileAvatarProps) {
  const resolved = avatarId && isAvatarId(avatarId) ? avatarId : "compass";

  return (
    <svg viewBox="0 0 40 40" className={cn("h-8 w-8 shrink-0 overflow-hidden rounded-full", className)} aria-hidden="true">
      {avatarMarkup[resolved]}
    </svg>
  );
}
