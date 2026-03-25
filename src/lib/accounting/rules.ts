/**
 * Accounting Rules Engine
 *
 * Validates agent-generated journal entries against Swedish accounting rules
 * BEFORE they are persisted. This is the primary anti-hallucination layer.
 *
 * Every rule returns warnings (soft) or errors (hard block).
 * Errors prevent entry creation. Warnings are shown to the user.
 */

import { db } from "@/lib/db";
import { accounts, journalEntries, journalEntryRows } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export interface EntryRowInput {
  accountNumber: string;
  debit: number;
  credit: number;
  description?: string;
  vatRate?: string;
}

export interface RuleResult {
  errors: string[];
  warnings: string[];
}

/**
 * Run all accounting rules against a proposed journal entry.
 * Call this BEFORE inserting into the database.
 */
export async function validateAccountingDecision(
  companyId: string,
  date: string,
  description: string,
  rows: EntryRowInput[]
): Promise<RuleResult> {
  const result: RuleResult = { errors: [], warnings: [] };

  // Run all rules
  await Promise.all([
    ruleAccountsExist(companyId, rows, result),
    ruleBalanceCheck(rows, result),
    ruleVATConsistency(companyId, rows, result),
    ruleVATMathCheck(rows, result),
    ruleBASClassLogic(companyId, rows, result),
    ruleDateValid(date, result),
    ruleDescriptionQuality(description, result),
    ruleDuplicateDetection(companyId, date, description, rows, result),
    ruleMinimumRows(rows, result),
    ruleAmountBounds(rows, result),
  ]);

  return result;
}

/**
 * Rule: All account numbers must exist in the company's kontoplan
 */
async function ruleAccountsExist(
  companyId: string,
  rows: EntryRowInput[],
  result: RuleResult
) {
  const numbers = [...new Set(rows.map((r) => r.accountNumber))];

  const existing = await db
    .select({ accountNumber: accounts.accountNumber })
    .from(accounts)
    .where(
      and(
        eq(accounts.companyId, companyId),
        sql`${accounts.accountNumber} IN (${sql.join(
          numbers.map((n) => sql`${n}`),
          sql`, `
        )})`
      )
    );

  const existingSet = new Set(existing.map((a) => a.accountNumber));

  for (const num of numbers) {
    if (!existingSet.has(num)) {
      result.errors.push(
        `Konto ${num} finns inte i kontoplanen. Kontrollera kontonumret.`
      );
    }
  }
}

/**
 * Rule: Total debit must equal total credit
 */
function ruleBalanceCheck(rows: EntryRowInput[], result: RuleResult) {
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    result.errors.push(
      `Verifikationen balanserar inte: Debet ${totalDebit.toFixed(2)} != Kredit ${totalCredit.toFixed(2)}`
    );
  }
}

/**
 * Rule: VAT rates must match the account's configured VAT code
 */
async function ruleVATConsistency(
  companyId: string,
  rows: EntryRowInput[],
  result: RuleResult
) {
  // VAT accounts: 2610 (utg 25%), 2620 (utg 12%), 2630 (utg 6%)
  // 2641 (ing 25%), 2642 (ing 12%), 2643 (ing 6%)
  const vatAccountMap: Record<string, string> = {
    "2610": "25",
    "2620": "12",
    "2630": "6",
    "2641": "25",
    "2642": "12",
    "2643": "6",
  };

  for (const row of rows) {
    const expectedRate = vatAccountMap[row.accountNumber];
    if (expectedRate && row.vatRate && row.vatRate !== expectedRate) {
      result.warnings.push(
        `Konto ${row.accountNumber} har normalt momssats ${expectedRate}% men agenten angav ${row.vatRate}%. Kontrollera att detta ar korrekt.`
      );
    }
  }

  // Check: if there's an expense/revenue row with VAT, there should be a matching VAT row
  const hasExpenseOrRevenue = rows.some((r) => {
    const cls = parseInt(r.accountNumber[0]);
    return cls >= 3 && cls <= 7;
  });
  const hasVATRow = rows.some((r) => r.accountNumber.startsWith("26"));

  // If expense rows exist but no VAT row, and amount > 0, warn
  if (hasExpenseOrRevenue && !hasVATRow) {
    const totalAmount = rows
      .filter((r) => {
        const cls = parseInt(r.accountNumber[0]);
        return cls >= 3 && cls <= 7;
      })
      .reduce((s, r) => s + r.debit + r.credit, 0);

    if (totalAmount > 0) {
      result.warnings.push(
        "Verifikationen har kostnads-/intaktsrader men ingen momsrad. Om transaktionen ar momspliktig, lagg till ingaende/utgaende moms."
      );
    }
  }
}

/**
 * Rule: Verify reverse-VAT math (if VAT row exists, check the calculation)
 */
function ruleVATMathCheck(rows: EntryRowInput[], result: RuleResult) {
  const vatRates: Record<string, number> = {
    "2610": 0.25,
    "2620": 0.12,
    "2630": 0.06,
    "2641": 0.25,
    "2642": 0.12,
    "2643": 0.06,
  };

  for (const vatRow of rows) {
    const rate = vatRates[vatRow.accountNumber];
    if (!rate) continue;

    const vatAmount = vatRow.debit || vatRow.credit;
    if (vatAmount === 0) continue;

    // Find the corresponding cost/revenue rows (same entry, non-VAT, non-balance-sheet)
    const costRows = rows.filter((r) => {
      const cls = parseInt(r.accountNumber[0]);
      return cls >= 3 && cls <= 7;
    });

    if (costRows.length === 0) continue;

    const netAmount = costRows.reduce((s, r) => s + r.debit + r.credit, 0);

    if (netAmount > 0) {
      const expectedVat = Math.round(netAmount * rate * 100) / 100;
      const diff = Math.abs(vatAmount - expectedVat);

      if (diff > 1) {
        // Allow 1 kr rounding tolerance
        result.warnings.push(
          `Momsbeloppet (${vatAmount.toFixed(2)}) matchar inte beraknad moms pa nettobeloppet (${netAmount.toFixed(2)} x ${(rate * 100).toFixed(0)}% = ${expectedVat.toFixed(2)}). Differens: ${diff.toFixed(2)} kr.`
        );
      }
    }
  }
}

/**
 * Rule: BAS class logic — check that debit/credit direction makes sense
 */
async function ruleBASClassLogic(
  companyId: string,
  rows: EntryRowInput[],
  result: RuleResult
) {
  // Fetch account classes for all accounts in the entry
  const numbers = rows.map((r) => r.accountNumber);
  const accts = await db
    .select({
      accountNumber: accounts.accountNumber,
      accountClass: accounts.accountClass,
    })
    .from(accounts)
    .where(
      and(
        eq(accounts.companyId, companyId),
        sql`${accounts.accountNumber} IN (${sql.join(
          numbers.map((n) => sql`${n}`),
          sql`, `
        )})`
      )
    );

  const classMap = new Map(accts.map((a) => [a.accountNumber, a.accountClass]));

  for (const row of rows) {
    const cls = classMap.get(row.accountNumber);
    if (!cls) continue;

    // Revenue accounts (3xxx) should normally be credited (not debited)
    if (cls === 3 && row.debit > 0 && row.credit === 0) {
      result.warnings.push(
        `Konto ${row.accountNumber} (intaktskonto klass 3) debiteras med ${row.debit.toFixed(2)}. Intaktskonton krediteras normalt. Ar detta en kreditnota eller rattelse?`
      );
    }

    // Expense accounts (4-7) should normally be debited
    if (cls >= 4 && cls <= 7 && row.credit > 0 && row.debit === 0) {
      result.warnings.push(
        `Konto ${row.accountNumber} (kostnadskonto klass ${cls}) krediteras med ${row.credit.toFixed(2)}. Kostnadskonton debiteras normalt. Ar detta en kreditnota eller rattelse?`
      );
    }
  }
}

/**
 * Rule: Date must be valid and reasonable
 */
function ruleDateValid(date: string, result: RuleResult) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    result.errors.push("Ogiltigt datumformat. Anvand YYYY-MM-DD.");
    return;
  }

  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    result.errors.push(`Ogiltigt datum: ${date}`);
    return;
  }

  // Warn if date is in the future
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (parsed > today) {
    result.warnings.push(
      `Datumet ${date} ar i framtiden. Kontrollera att detta ar avsiktligt.`
    );
  }

  // Warn if date is more than 1 year old
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  if (parsed < oneYearAgo) {
    result.warnings.push(
      `Datumet ${date} ar mer an ett ar gammalt. Kontrollera att detta ar korrekt.`
    );
  }
}

/**
 * Rule: Description must be meaningful
 */
function ruleDescriptionQuality(description: string, result: RuleResult) {
  if (!description || description.trim().length < 3) {
    result.errors.push("Beskrivningen ar for kort. Ange en beskrivande text.");
  }

  if (description.length > 500) {
    result.warnings.push("Beskrivningen ar ovanligt lang (>500 tecken).");
  }
}

/**
 * Rule: Detect potential duplicates (same date + similar description + similar amount)
 */
async function ruleDuplicateDetection(
  companyId: string,
  date: string,
  description: string,
  rows: EntryRowInput[],
  result: RuleResult
) {
  const totalAmount = rows.reduce((s, r) => s + r.debit, 0);

  // Look for entries on the same date with similar amount
  const recentEntries = await db
    .select({
      id: journalEntries.id,
      description: journalEntries.description,
      verificationNumber: journalEntries.verificationNumber,
    })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.companyId, companyId),
        eq(journalEntries.date, date)
      )
    )
    .limit(20);

  for (const existing of recentEntries) {
    // Simple similarity check: if descriptions share >50% of words
    const existingWords = new Set(
      existing.description.toLowerCase().split(/\s+/)
    );
    const newWords = description.toLowerCase().split(/\s+/);
    const overlap = newWords.filter((w) => existingWords.has(w) && w.length > 2);

    if (overlap.length >= Math.min(3, newWords.length * 0.5)) {
      result.warnings.push(
        `Mojlig dubblett: Verifikation ${existing.verificationNumber} (${existing.description}) har liknande beskrivning pa samma datum.`
      );
      break; // Only warn once
    }
  }
}

/**
 * Rule: Minimum 2 rows required
 */
function ruleMinimumRows(rows: EntryRowInput[], result: RuleResult) {
  if (rows.length < 2) {
    result.errors.push(
      "En verifikation maste ha minst 2 konteringsrader."
    );
  }

  if (rows.length > 50) {
    result.warnings.push(
      `Verifikationen har ${rows.length} rader. Kontrollera att detta ar korrekt.`
    );
  }
}

/**
 * Rule: Amounts must be within reasonable bounds
 */
function ruleAmountBounds(rows: EntryRowInput[], result: RuleResult) {
  for (const row of rows) {
    if (row.debit < 0 || row.credit < 0) {
      result.errors.push(
        `Konto ${row.accountNumber}: Belopp kan inte vara negativt.`
      );
    }

    if (row.debit > 999_999_999.99 || row.credit > 999_999_999.99) {
      result.errors.push(
        `Konto ${row.accountNumber}: Belopp overskrider maxgrans (999 999 999,99).`
      );
    }

    if (row.debit > 0 && row.credit > 0) {
      result.errors.push(
        `Konto ${row.accountNumber}: Kan inte ha bade debet och kredit pa samma rad.`
      );
    }
  }
}
