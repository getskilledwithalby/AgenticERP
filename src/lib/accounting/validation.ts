export interface EntryRow {
  accountNumber: string;
  debit: number;
  credit: number;
  description?: string;
  vatRate?: "25" | "12" | "6" | "0";
  vatAmount?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateJournalEntry(
  date: string,
  description: string,
  rows: EntryRow[]
): ValidationResult {
  const errors: string[] = [];

  // Must have a date
  if (!date) {
    errors.push("Datum saknas");
  }

  // Must have a description
  if (!description || description.trim().length === 0) {
    errors.push("Beskrivning saknas");
  }

  // Must have at least 2 rows
  if (rows.length < 2) {
    errors.push("En verifikation maste ha minst tva rader");
  }

  // Each row must have either debit or credit (not both)
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.debit > 0 && row.credit > 0) {
      errors.push(
        `Rad ${i + 1}: Kan inte ha bade debet och kredit pa samma rad`
      );
    }
    if (row.debit === 0 && row.credit === 0) {
      errors.push(`Rad ${i + 1}: Antingen debet eller kredit maste anges`);
    }
    if (row.debit < 0 || row.credit < 0) {
      errors.push(`Rad ${i + 1}: Belopp kan inte vara negativt`);
    }
    if (!row.accountNumber) {
      errors.push(`Rad ${i + 1}: Konto saknas`);
    }
  }

  // Total debit must equal total credit
  const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    errors.push(
      `Verifikationen balanserar inte: Debet ${totalDebit.toFixed(2)} != Kredit ${totalCredit.toFixed(2)}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function formatSEK(amount: number): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("sv-SE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
