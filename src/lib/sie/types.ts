/** Parsed SIE4 file structure */
export interface SIEFile {
  /** Metadata */
  program?: string;
  programVersion?: string;
  format?: string;
  generatedDate?: string;
  sieType?: number;
  comment?: string;

  /** Company info */
  companyName?: string;
  orgNumber?: string;

  /** Fiscal years: key is offset (0 = current, -1 = previous) */
  fiscalYears: Map<number, { start: string; end: string }>;

  /** Chart of accounts */
  accounts: SIEAccount[];

  /** Opening balances per fiscal year offset */
  openingBalances: SIEBalance[];

  /** Closing balances per fiscal year offset */
  closingBalances: SIEBalance[];

  /** Result rows (income/expense account totals) */
  results: SIEBalance[];

  /** Journal entries (verifikationer) */
  entries: SIEEntry[];

  /** Parsing warnings/errors */
  warnings: string[];
}

export interface SIEAccount {
  number: string;
  name: string;
  type?: string; // T=tillgång, S=skuld, K=kostnad, I=intäkt
  sruCode?: string;
}

export interface SIEBalance {
  fiscalYearOffset: number;
  accountNumber: string;
  amount: number;
}

export interface SIEEntry {
  series: string;
  number: number;
  date: string;
  description: string;
  transactions: SIETransaction[];
}

export interface SIETransaction {
  accountNumber: string;
  amount: number;
  date?: string;
  description?: string;
}
