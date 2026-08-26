import { describe, expect, it } from "vitest";
import { mergeBounds } from "./merge-bounds";

function makeRegion(sw: [number, number], ne: [number, number]) {
  return { bounds: [sw, ne] } as never;
}

describe("mergeBounds", () => {
  it("returns a single region's own bounds unchanged", () => {
    const region = makeRegion([135, 34], [136, 35]);
    expect(mergeBounds([region])).toEqual([
      [135, 34],
      [136, 35]
    ]);
  });

  it("merges multiple regions into their combined bounding box", () => {
    const a = makeRegion([135, 34], [136, 35]);
    const b = makeRegion([137, 33], [138, 36]);

    expect(mergeBounds([a, b])).toEqual([
      [135, 33],
      [138, 36]
    ]);
  });
});
