import { describe, it, expect } from "vitest";
import { contrastRatio } from "./contrast";

describe("contrastRatio", () => {
  it("black on white is 21:1", () => expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1));
  it("same colour is 1:1", () => expect(contrastRatio("#123456", "#123456")).toBeCloseTo(1, 5));
  it("rejects invalid hex", () => expect(contrastRatio("gold", "#fff")).toBeNull());
});
