import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { bracketTax, takeHomePay, type TaxTable } from "@/features/lifesim/engine/tax";

const table = JSON.parse(readFileSync(path.join(process.cwd(), "seed", "lifesim", "taxes.json"), "utf8")) as TaxTable;

describe("life sim taxes (2026, Florida resident)", () => {
  it("applies the progressive federal brackets", () => {
    const b = table.federalIncomeTax.brackets.single;
    expect(bracketTax(0, b)).toBe(0);
    expect(bracketTax(12400, b)).toBeCloseTo(1240, 2); // all at 10%
    expect(bracketTax(50400, b)).toBeCloseTo(1240 + (50400 - 12400) * 0.12, 2);
  });

  it("computes take-home pay for a $50,000 single filer", () => {
    const p = takeHomePay(50000, table);
    const taxable = 50000 - 16100;
    const fed = 12400 * 0.1 + (taxable - 12400) * 0.12;
    expect(p.federalIncomeTax).toBeCloseTo(fed, 2);
    expect(p.socialSecurity).toBeCloseTo(3100, 2);
    expect(p.medicare).toBeCloseTo(725, 2);
    expect(p.stateIncomeTax).toBe(0);
    expect(p.takeHome).toBeCloseTo(50000 - fed - 3100 - 725, 2);
  });

  it("caps Social Security at the wage base and adds the extra Medicare tax above the threshold", () => {
    const p = takeHomePay(300000, table);
    expect(p.socialSecurity).toBeCloseTo(table.fica.socialSecurityWageBase * 0.062, 2);
    expect(p.medicare).toBeCloseTo(300000 * 0.0145 + 100000 * 0.009, 2);
  });

  it("never taxes zero or negative income", () => {
    expect(takeHomePay(0, table).takeHome).toBe(0);
    expect(takeHomePay(-5, table).federalIncomeTax).toBe(0);
  });
});
