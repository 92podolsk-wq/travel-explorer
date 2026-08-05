import { describe, expect, it } from "vitest";
import { escapeCsvField, parseCsv, rowsToObjects, toCsv } from "./csv";

describe("parseCsv", () => {
  it("parses simple comma-separated rows", () => {
    expect(parseCsv("a,b,c\n1,2,3\n")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"]
    ]);
  });

  it("handles quoted fields containing commas", () => {
    expect(parseCsv('name,note\n"Osaka, Japan",fine\n')).toEqual([
      ["name", "note"],
      ["Osaka, Japan", "fine"]
    ]);
  });

  it("unescapes doubled quotes inside a quoted field", () => {
    expect(parseCsv('field\n"say ""hi"""\n')).toEqual([["field"], ['say "hi"']]);
  });

  it("handles CRLF line endings without producing blank rows", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([
      ["a", "b"],
      ["1", "2"]
    ]);
  });

  it("skips a trailing blank line but keeps a final row without a trailing newline", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"]
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("escapeCsvField", () => {
  it("leaves plain fields untouched", () => {
    expect(escapeCsvField("Osaka")).toBe("Osaka");
  });

  it("quotes and escapes fields containing commas, quotes, or newlines", () => {
    expect(escapeCsvField("a,b")).toBe('"a,b"');
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("toCsv", () => {
  it("joins header and rows with escaping and a trailing newline", () => {
    expect(toCsv(["name", "note"], [["Osaka, Japan", "fine"]])).toBe('name,note\n"Osaka, Japan",fine\n');
  });
});

describe("rowsToObjects", () => {
  it("maps body rows to objects keyed by trimmed header", () => {
    const rows = [
      [" name ", "city"],
      ["Dotonbori", "Osaka"]
    ];
    expect(rowsToObjects(rows)).toEqual([{ name: "Dotonbori", city: "Osaka" }]);
  });

  it("fills missing trailing cells with empty strings", () => {
    const rows = [["name", "city"], ["Dotonbori"]];
    expect(rowsToObjects(rows)).toEqual([{ name: "Dotonbori", city: "" }]);
  });

  it("returns an empty array when there are no rows", () => {
    expect(rowsToObjects([])).toEqual([]);
  });
});
