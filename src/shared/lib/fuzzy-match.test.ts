import { describe, expect, it } from "vitest";
import { fuzzyMatch, levenshteinDistance } from "./fuzzy-match";

describe("levenshteinDistance", () => {
  it("is zero for identical strings", () => {
    expect(levenshteinDistance("osaka", "osaka")).toBe(0);
  });

  it("counts a single substitution as distance 1", () => {
    expect(levenshteinDistance("osaka", "osaks")).toBe(1);
  });

  it("counts insertions and deletions", () => {
    expect(levenshteinDistance("kyoto", "kyot")).toBe(1);
    expect(levenshteinDistance("kyoto", "kyotoo")).toBe(1);
  });
});

describe("fuzzyMatch", () => {
  it("matches an empty query against anything", () => {
    expect(fuzzyMatch("Dotonbori", "")).toBe(true);
  });

  it("matches a plain substring case-insensitively", () => {
    expect(fuzzyMatch("Dotonbori Canal", "dotonbori")).toBe(true);
  });

  it("tolerates a single typo in a mid-length word", () => {
    expect(fuzzyMatch("Dotonbori Canal", "dotombori")).toBe(true);
  });

  it("rejects short queries that aren't an exact substring", () => {
    expect(fuzzyMatch("Dotonbori", "dob")).toBe(false);
  });

  it("rejects queries too far from every word", () => {
    expect(fuzzyMatch("Dotonbori Canal", "zzzzzzzzzz")).toBe(false);
  });
});
