import type { Poi, PoiMainCategory, PoiTag } from "@/entities/poi/model/types";

export type AffinityProfile = {
  categories: Partial<Record<PoiMainCategory, number>>;
  tags: Partial<Record<PoiTag, number>>;
  totalLikes: number;
};

export const MIN_LIKES_FOR_AFFINITY = 3;

export function buildAffinityProfile(likedPois: Poi[]): AffinityProfile {
  const categories: Partial<Record<PoiMainCategory, number>> = {};
  const tags: Partial<Record<PoiTag, number>> = {};

  for (const poi of likedPois) {
    categories[poi.category] = (categories[poi.category] ?? 0) + 1;
    for (const tag of poi.tags) {
      tags[tag] = (tags[tag] ?? 0) + 1;
    }
  }

  return { categories, tags, totalLikes: likedPois.length };
}

export function hasEnoughSignal(profile: AffinityProfile): boolean {
  return profile.totalLikes >= MIN_LIKES_FOR_AFFINITY;
}

export function computeAffinityScore(poi: Poi, profile: AffinityProfile): number {
  const categoryScore = profile.categories[poi.category] ?? 0;
  const tagScore = poi.tags.reduce((sum, tag) => sum + (profile.tags[tag] ?? 0), 0);
  return categoryScore * 10 + tagScore * 6 + poi.photoScore * 0.2 + poi.importance * 0.2;
}

export function topAffinityCategories(profile: AffinityProfile, limit = 4): PoiMainCategory[] {
  return (Object.entries(profile.categories) as Array<[PoiMainCategory, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category]) => category);
}
