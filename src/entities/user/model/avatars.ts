export const avatarIds = [
  "compass",
  "globe",
  "mountain",
  "sun",
  "camera",
  "plane",
  "backpack",
  "map-pin",
  "suitcase",
  "tent",
  "binoculars",
  "balloon"
] as const;

export type AvatarId = (typeof avatarIds)[number];

export function isAvatarId(value: string): value is AvatarId {
  return (avatarIds as readonly string[]).includes(value);
}
