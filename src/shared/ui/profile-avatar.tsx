import { type AvatarId, isAvatarId } from "@/entities/user/model/avatars";
import { cn } from "@/shared/lib/cn";

export { avatarIds, type AvatarId } from "@/entities/user/model/avatars";

const avatarMarkup: Record<AvatarId, React.ReactNode> = {
  torii: (
    <>
      <circle cx="20" cy="20" r="20" fill="#a3312c" />
      <rect x="9" y="12" width="22" height="2.8" rx="1" fill="#f6efe2" />
      <rect x="11" y="16.2" width="18" height="1.8" fill="#f6efe2" />
      <rect x="12.5" y="14.6" width="2.6" height="18" fill="#f6efe2" />
      <rect x="24.9" y="14.6" width="2.6" height="18" fill="#f6efe2" />
    </>
  ),
  sakura: (
    <>
      <circle cx="20" cy="20" r="20" fill="#dd8fa4" />
      <circle cx="20" cy="13.5" r="5" fill="#fdf5f7" />
      <circle cx="26" cy="17.5" r="5" fill="#fdf5f7" />
      <circle cx="24" cy="24.5" r="5" fill="#fdf5f7" />
      <circle cx="16" cy="24.5" r="5" fill="#fdf5f7" />
      <circle cx="14" cy="17.5" r="5" fill="#fdf5f7" />
      <circle cx="20" cy="20" r="3.4" fill="#c65b76" />
    </>
  ),
  fuji: (
    <>
      <circle cx="20" cy="20" r="20" fill="#cfe9f7" />
      <circle cx="28.5" cy="12" r="3" fill="#eab659" />
      <polygon points="7,29 20,10 33,29" fill="#5b7a94" />
      <polygon points="20,10 24,18 16,18" fill="#f6efe2" />
    </>
  ),
  koi: (
    <>
      <circle cx="20" cy="20" r="20" fill="#cdeee6" />
      <polygon points="26,20 33,14 33,26" fill="#e2703a" />
      <ellipse cx="17" cy="20" rx="10" ry="5.4" fill="#e2703a" />
      <ellipse cx="14" cy="19" rx="4" ry="2.4" fill="#f6efe2" />
      <circle cx="10.5" cy="18.5" r="1.1" fill="#20303a" />
    </>
  ),
  lantern: (
    <>
      <circle cx="20" cy="20" r="20" fill="#f3e4c8" />
      <line x1="20" y1="6" x2="20" y2="9" stroke="#6b4a3a" strokeWidth="1.4" />
      <rect x="16.5" y="9" width="7" height="2.2" rx="1" fill="#6b4a3a" />
      <path d="M13 12 Q13 30 20 30 Q27 30 27 12 Z" fill="#c8402f" />
      <line x1="16.5" y1="13" x2="16.5" y2="28" stroke="#8f2a20" strokeWidth="1" />
      <line x1="20" y1="12.5" x2="20" y2="29" stroke="#8f2a20" strokeWidth="1" />
      <line x1="23.5" y1="13" x2="23.5" y2="28" stroke="#8f2a20" strokeWidth="1" />
      <rect x="16.5" y="29.8" width="7" height="2.2" rx="1" fill="#6b4a3a" />
    </>
  ),
  maple: (
    <>
      <circle cx="20" cy="20" r="20" fill="#f4dba0" />
      <path
        d="M20 8 L22.5 15 L29 12 L25 18 L32 20 L25 22 L29 28 L22.5 25 L20 32 L17.5 25 L11 28 L15 22 L8 20 L15 18 L11 12 L17.5 15 Z"
        fill="#c8622f"
      />
      <line x1="20" y1="20" x2="20" y2="34" stroke="#8a4a26" strokeWidth="1.2" />
    </>
  ),
  bamboo: (
    <>
      <circle cx="20" cy="20" r="20" fill="#cbe6c9" />
      <rect x="14.5" y="7" width="4.4" height="27" rx="2.2" fill="#4f8f5b" />
      <rect x="21.5" y="11" width="4.4" height="23" rx="2.2" fill="#3f7a4a" />
      <line x1="14.5" y1="15" x2="18.9" y2="15" stroke="#2f5c38" strokeWidth="1" />
      <line x1="14.5" y1="23" x2="18.9" y2="23" stroke="#2f5c38" strokeWidth="1" />
      <line x1="21.5" y1="19" x2="25.9" y2="19" stroke="#2f5c38" strokeWidth="1" />
      <line x1="21.5" y1="27" x2="25.9" y2="27" stroke="#2f5c38" strokeWidth="1" />
      <polygon points="14.5,10 10,8 13,13" fill="#4f8f5b" />
      <polygon points="25.9,14 30.5,12.5 27,17" fill="#3f7a4a" />
    </>
  ),
  tea: (
    <>
      <circle cx="20" cy="20" r="20" fill="#efe6d3" />
      <path d="M6.5 15 Q9 11 11.5 15" stroke="#b9c9d6" strokeWidth="1.4" fill="none" />
      <path d="M20 12 Q22.5 8 25 12" stroke="#b9c9d6" strokeWidth="1.4" fill="none" />
      <path d="M13.5 19 h13 l-1.6 10.5 a2 2 0 0 1-2 1.7h-5.8a2 2 0 0 1-2-1.7 Z" fill="#f6efe2" stroke="#6b4a3a" strokeWidth="1" />
      <path d="M15 22.5 h10 l-1 6.8 a1 1 0 0 1-1 .9h-6 a1 1 0 0 1-1-.9 Z" fill="#7a9b3e" />
      <path d="M26.5 21 q4 0 4 4 q0 4 -4 4" fill="none" stroke="#6b4a3a" strokeWidth="1.4" />
    </>
  ),
  fan: (
    <>
      <circle cx="20" cy="20" r="20" fill="#c8402f" />
      <g fill="#f6efe2">
        <polygon points="20,30 10,17 14,15" />
        <polygon points="20,30 14.5,13.5 18,12.5" />
        <polygon points="20,30 18.5,11.5 21.5,11.5" />
        <polygon points="20,30 22,12.5 25.5,13.5" />
        <polygon points="20,30 26,15 30,17" />
      </g>
      <path d="M10 17 Q20 24 30 17" fill="none" stroke="#c8402f" strokeWidth="0.9" />
      <circle cx="20" cy="30" r="1.7" fill="#6b4a3a" />
    </>
  ),
  pagoda: (
    <>
      <circle cx="20" cy="20" r="20" fill="#9db4c9" />
      <line x1="20" y1="6" x2="20" y2="10" stroke="#6b4a3a" strokeWidth="1.2" />
      <rect x="18.5" y="12" width="3" height="5" fill="#f6efe2" />
      <polygon points="14,17 26,17 29,12 11,12" fill="#6b4a3a" />
      <rect x="17.5" y="19" width="5" height="5" fill="#f6efe2" />
      <polygon points="12,24 28,24 31,19 9,19" fill="#6b4a3a" />
      <rect x="16" y="26" width="8" height="7" fill="#f6efe2" />
      <polygon points="9,31 31,31 34,26 6,26" fill="#6b4a3a" />
    </>
  ),
  "maneki-neko": (
    <>
      <circle cx="20" cy="20" r="20" fill="#eab659" />
      <polygon points="13,14 16.5,7 18.5,15" fill="#f6efe2" />
      <polygon points="27,14 23.5,7 21.5,15" fill="#f6efe2" />
      <polygon points="14.5,13 16.5,9 17.5,14" fill="#e79bb0" />
      <polygon points="25.5,13 23.5,9 22.5,14" fill="#e79bb0" />
      <circle cx="20" cy="21" r="10" fill="#f6efe2" />
      <circle cx="16.5" cy="20" r="1.3" fill="#20303a" />
      <circle cx="23.5" cy="20" r="1.3" fill="#20303a" />
      <polygon points="19,23 21,23 20,24.4" fill="#e79bb0" />
      <path d="M14 27 Q20 30 26 27" stroke="#c8402f" strokeWidth="1.6" fill="none" />
      <circle cx="20" cy="27.6" r="1.2" fill="#eab659" stroke="#6b4a3a" strokeWidth="0.6" />
      <ellipse cx="30" cy="15" rx="2.6" ry="4" fill="#f6efe2" />
    </>
  ),
  dango: (
    <>
      <circle cx="20" cy="20" r="20" fill="#f0e6d8" />
      <line x1="20" y1="9" x2="20" y2="31" stroke="#8a5a3a" strokeWidth="1.6" />
      <circle cx="20" cy="13" r="4.6" fill="#d9718f" stroke="#b85570" strokeWidth="0.6" />
      <circle cx="20" cy="20" r="4.6" fill="#fdfaf3" stroke="#c9b896" strokeWidth="0.6" />
      <circle cx="20" cy="27" r="4.6" fill="#6f9350" stroke="#587a3c" strokeWidth="0.6" />
    </>
  )
};

type ProfileAvatarProps = {
  avatarId?: string | null;
  className?: string;
};

export function ProfileAvatar({ avatarId, className }: ProfileAvatarProps) {
  const resolved = avatarId && isAvatarId(avatarId) ? avatarId : "torii";

  return (
    <svg viewBox="0 0 40 40" className={cn("h-8 w-8 shrink-0 overflow-hidden rounded-full", className)} aria-hidden="true">
      {avatarMarkup[resolved]}
    </svg>
  );
}
