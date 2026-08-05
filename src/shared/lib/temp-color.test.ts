import { describe, expect, it } from "vitest";
import { getTempColor } from "./temp-color";

describe("getTempColor", () => {
  it("picks the coldest bucket for very low temperatures", () => {
    expect(getTempColor(-5)).toEqual({ bg: "#5b7a94", text: "#f5f2ee" });
  });

  it("picks the hottest bucket for very high temperatures", () => {
    expect(getTempColor(40)).toEqual({ bg: "#a8614f", text: "#f5f2ee" });
  });

  it("picks a boundary value using the inclusive upper bound", () => {
    expect(getTempColor(21).bg).toBe("#97a173");
    expect(getTempColor(22).bg).toBe("#b39a63");
  });
});
