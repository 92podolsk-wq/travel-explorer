export const avatarIds = [
  "torii",
  "sakura",
  "fuji",
  "koi",
  "lantern",
  "maple",
  "bamboo",
  "tea",
  "fan",
  "pagoda",
  "maneki-neko",
  "dango"
] as const;

export type AvatarId = (typeof avatarIds)[number];

export function isAvatarId(value: string): value is AvatarId {
  return (avatarIds as readonly string[]).includes(value);
}
