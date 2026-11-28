/**
 * Life sim engine — taxes for a Florida resident (no state income tax).
 * Pure functions; inputs are annual amounts in dollars.
 */
export type Bracket = { rate: number; over: number };
export type FilingStatus = "single" | "marriedJoint";

export type TaxTable = {
  taxYear: number;
  federalIncomeTax: { standardDeduction: Record<string, number>; brackets: Record<FilingStatus, Bracket[]> };
  fica: {
    socialSecurityRate: number;
    socialSecurityWageBase: number;
    medicareRate: number;
    additionalMedicareRate: number;
    additionalMedicareThreshold: Record<FilingStatus, number>;
  };
  florida: { stateIncomeTax: number; stateSalesTaxRate: number };
};

/** Progressive tax on taxable income using "over" thresholds. */
export function bracketTax(taxable: number, brackets: Bracket[]): number {
  if (taxable <= 0) return 0;
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const lo = brackets[i]!.over;
    const hi = brackets[i + 1]?.over ?? Infinity;
    if (taxable <= lo) break;
    tax += (Math.min(taxable, hi) - lo) * brackets[i]!.rate;
  }
  return tax;
}

export type PaycheckYear = {
  gross: number;
  federalIncomeTax: number;
  socialSecurity: number;
  medicare: number;
  stateIncomeTax: number;
  takeHome: number;
  effectiveRate: number;
};

/** Annual wage income → take-home pay (federal income tax with the standard deduction, FICA, no FL income tax). */
export function takeHomePay(gross: number, table: TaxTable, status: FilingStatus = "single"): PaycheckYear {
  const g = Math.max(0, gross);
  const taxable = Math.max(0, g - (table.federalIncomeTax.standardDeduction[status] ?? 0));
  const federalIncomeTax = bracketTax(taxable, table.federalIncomeTax.brackets[status]);
  const socialSecurity = Math.min(g, table.fica.socialSecurityWageBase) * table.fica.socialSecurityRate;
  const medicare = g * table.fica.medicareRate + Math.max(0, g - table.fica.additionalMedicareThreshold[status]) * table.fica.additionalMedicareRate;
  const stateIncomeTax = g * table.florida.stateIncomeTax;
  const total = federalIncomeTax + socialSecurity + medicare + stateIncomeTax;
  const r = (n: number) => Math.round(n * 100) / 100;
  return {
    gross: r(g), federalIncomeTax: r(federalIncomeTax), socialSecurity: r(socialSecurity), medicare: r(medicare),
    stateIncomeTax: r(stateIncomeTax), takeHome: r(g - total), effectiveRate: g ? Math.round((total / g) * 10000) / 10000 : 0,
  };
}
