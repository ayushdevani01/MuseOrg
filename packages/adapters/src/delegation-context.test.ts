import { describe, expect, it } from "vitest";
import { delegationContext } from "./delegation-context.js";

describe("delegated background context", () => {
  it("omits absent context instead of exporting parent conversation", () => {
    expect(delegationContext(undefined, undefined)).toBe("");
  });

  it("carries the supplied facts and selected artifact reference", () => {
    const memory = '{"currency":"EUR","revision":2}';
    const briefing = '{"artifact":"shared/project/report.json"}';
    const result = delegationContext(memory, briefing);
    expect(result).toContain(memory);
    expect(result).toContain(briefing);
    expect(delegationContext(memory, { unexpected: "object" })).not.toContain("unexpected");
  });

  it("bounds multibyte facts and briefing without invalid UTF-8", () => {
    const result = delegationContext("界".repeat(9000), "😀".repeat(9000));
    expect(Buffer.byteLength(result, "utf8")).toBeLessThan(12500);
    expect(result).not.toContain("\ufffd");
    expect(result).toContain("界".repeat(2000));
    expect(result).toContain("😀".repeat(1500));
  });
});
