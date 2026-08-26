import type { Region } from "@/entities/region/model/types";

export function mergeBounds(regions: Region[]): [[number, number], [number, number]] {
  const [first, ...rest] = regions;
  return rest.reduce<[[number, number], [number, number]]>(
    (bounds, region) => [
      [Math.min(bounds[0][0], region.bounds[0][0]), Math.min(bounds[0][1], region.bounds[0][1])],
      [Math.max(bounds[1][0], region.bounds[1][0]), Math.max(bounds[1][1], region.bounds[1][1])]
    ],
    [
      [first.bounds[0][0], first.bounds[0][1]],
      [first.bounds[1][0], first.bounds[1][1]]
    ]
  );
}
