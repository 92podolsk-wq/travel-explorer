import { describe, expect, it } from "vitest";
import { mapSevenTimerCode } from "./weather-condition";

describe("mapSevenTimerCode", () => {
  it("maps storm codes", () => {
    expect(mapSevenTimerCode("tsday")).toBe("storm");
    expect(mapSevenTimerCode("tsrainnight")).toBe("storm");
  });

  it("maps snow codes", () => {
    expect(mapSevenTimerCode("snowday")).toBe("snow");
  });

  it("maps rain codes", () => {
    expect(mapSevenTimerCode("rainnight")).toBe("rain");
  });

  it("maps cloudy codes", () => {
    expect(mapSevenTimerCode("mcloudyday")).toBe("cloudy");
  });

  it("falls back to clear for unrecognized or sunny codes", () => {
    expect(mapSevenTimerCode("clearday")).toBe("clear");
    expect(mapSevenTimerCode("unknown-code")).toBe("clear");
  });
});
