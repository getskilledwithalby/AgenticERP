// Seed company ID — used until auth is implemented
export const SEED_COMPANY_ID = "demo";

// BAS account class names
export const ACCOUNT_CLASSES: Record<number, { sv: string; en: string }> = {
  1: { sv: "Tillgangar", en: "Assets" },
  2: { sv: "Eget kapital och skulder", en: "Equity & Liabilities" },
  3: { sv: "Rorelseinttakter", en: "Operating Revenue" },
  4: { sv: "Varuinkop", en: "Cost of Goods Sold" },
  5: { sv: "Ovriga externa kostnader", en: "Other External Costs" },
  6: { sv: "Ovriga externa kostnader forts.", en: "Other External Costs (cont.)" },
  7: { sv: "Personalkostnader", en: "Personnel Costs" },
  8: { sv: "Finansiella poster", en: "Financial Items" },
};

// VAT rates in Sweden
export const VAT_RATES = [
  { value: "25", label: "25%" },
  { value: "12", label: "12%" },
  { value: "6", label: "6%" },
  { value: "0", label: "0% (momsfri)" },
] as const;

// Journal entry status display
export const ENTRY_STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Utkast", variant: "secondary" },
  pending_approval: { label: "Vantar godkannande", variant: "outline" },
  posted: { label: "Bokford", variant: "default" },
  rejected: { label: "Avslagen", variant: "destructive" },
};
