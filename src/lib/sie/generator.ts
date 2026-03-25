/**
 * SIE4 Generator
 *
 * Generates SIE4 format output from our database for export
 * to Fortnox, Visma, Bjorn Lunden, etc.
 */

import { db } from "@/lib/db";
import {
  companies,
  fiscalYears,
  accounts,
  journalEntries,
  journalEntryRows,
} from "@/lib/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";

interface GenerateSIEOptions {
  companyId: string;
  fiscalYearId: string;
}

export async function generateSIE(options: GenerateSIEOptions): Promise<string> {
  const { companyId, fiscalYearId } = options;

  // Fetch all needed data
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  const [fy] = await db
    .select()
    .from(fiscalYears)
    .where(eq(fiscalYears.id, fiscalYearId))
    .limit(1);

  const accts = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.companyId, companyId), eq(accounts.isActive, true)))
    .orderBy(asc(accounts.accountNumber));

  const entries = await db
    .select()
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.companyId, companyId),
        eq(journalEntries.fiscalYearId, fiscalYearId),
        eq(journalEntries.status, "posted")
      )
    )
    .orderBy(
      asc(journalEntries.date),
      asc(journalEntries.verificationNumber)
    );

  // Fetch all rows for these entries
  const entryIds = entries.map((e) => e.id);
  let allRows: {
    journalEntryId: string;
    accountNumber: string;
    debit: string;
    credit: string;
    description: string | null;
  }[] = [];

  if (entryIds.length > 0) {
    allRows = await db
      .select({
        journalEntryId: journalEntryRows.journalEntryId,
        accountNumber: accounts.accountNumber,
        debit: journalEntryRows.debit,
        credit: journalEntryRows.credit,
        description: journalEntryRows.description,
      })
      .from(journalEntryRows)
      .innerJoin(accounts, eq(journalEntryRows.accountId, accounts.id))
      .where(
        sql`${journalEntryRows.journalEntryId} IN (${sql.join(
          entryIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      )
      .orderBy(asc(journalEntryRows.sortOrder));
  }

  // Group rows by entry
  const rowsByEntry = new Map<string, typeof allRows>();
  for (const row of allRows) {
    if (!rowsByEntry.has(row.journalEntryId)) {
      rowsByEntry.set(row.journalEntryId, []);
    }
    rowsByEntry.get(row.journalEntryId)!.push(row);
  }

  // Calculate closing balances (UB) for balance sheet accounts (class 1-2)
  const balanceAccounts = accts.filter((a) => a.accountClass <= 2);
  const closingBalances: { accountNumber: string; balance: number }[] = [];

  for (const acct of balanceAccounts) {
    const rows = allRows.filter((r) => r.accountNumber === acct.accountNumber);
    const balance = rows.reduce((sum, r) => {
      return sum + parseFloat(r.debit) - parseFloat(r.credit);
    }, 0);
    if (Math.abs(balance) > 0.001) {
      closingBalances.push({ accountNumber: acct.accountNumber, balance });
    }
  }

  // Calculate result totals (RES) for income/expense accounts (class 3-8)
  const resultAccounts = accts.filter((a) => a.accountClass >= 3);
  const resultBalances: { accountNumber: string; balance: number }[] = [];

  for (const acct of resultAccounts) {
    const rows = allRows.filter((r) => r.accountNumber === acct.accountNumber);
    const balance = rows.reduce((sum, r) => {
      return sum + parseFloat(r.debit) - parseFloat(r.credit);
    }, 0);
    if (Math.abs(balance) > 0.001) {
      resultBalances.push({ accountNumber: acct.accountNumber, balance });
    }
  }

  // Build SIE output
  const now = new Date();
  const genDate = formatDateSIE(now);
  const lines: string[] = [];

  // Header
  lines.push("#FLAGGA 0");
  lines.push(`#PROGRAM "AgenticERP" "1.0"`);
  lines.push("#FORMAT PC8");
  lines.push(`#GEN ${genDate}`);
  lines.push("#SIETYP 4");
  lines.push(`#PROSA "Exporterad fran AgenticERP"`);

  // Company info
  if (company) {
    lines.push(`#FNAMN "${escapeQuotes(company.name)}"`);
    if (company.orgNumber) {
      lines.push(`#ORGNR ${company.orgNumber.replace("-", "")}`);
    }
  }

  // Fiscal year
  if (fy) {
    lines.push(
      `#RAR 0 ${fy.startDate.replace(/-/g, "")} ${fy.endDate.replace(/-/g, "")}`
    );
  }

  // Accounts
  lines.push("");
  for (const acct of accts) {
    lines.push(`#KONTO ${acct.accountNumber} "${escapeQuotes(acct.name)}"`);
  }

  // Closing balances (UB) for balance sheet accounts
  if (closingBalances.length > 0) {
    lines.push("");
    for (const cb of closingBalances) {
      lines.push(`#UB 0 ${cb.accountNumber} ${formatAmountSIE(cb.balance)}`);
    }
  }

  // Results (RES) for income/expense accounts
  if (resultBalances.length > 0) {
    lines.push("");
    for (const rb of resultBalances) {
      lines.push(`#RES 0 ${rb.accountNumber} ${formatAmountSIE(rb.balance)}`);
    }
  }

  // Journal entries (VER + TRANS)
  if (entries.length > 0) {
    lines.push("");
    for (const entry of entries) {
      const rows = rowsByEntry.get(entry.id) ?? [];
      const dateSIE = entry.date.replace(/-/g, "");

      lines.push(
        `#VER ${entry.verificationSeries} ${entry.verificationNumber} ${dateSIE} "${escapeQuotes(entry.description)}"`
      );
      lines.push("{");
      for (const row of rows) {
        const debit = parseFloat(row.debit);
        const credit = parseFloat(row.credit);
        // SIE: positive = debit, negative = credit
        const amount = debit > 0 ? debit : -credit;
        const desc = row.description
          ? ` "${escapeQuotes(row.description)}"`
          : "";
        lines.push(`#TRANS ${row.accountNumber} {} ${formatAmountSIE(amount)}${desc}`);
      }
      lines.push("}");
    }
  }

  lines.push("");
  return lines.join("\n");
}

function formatDateSIE(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function formatAmountSIE(amount: number): string {
  return amount.toFixed(2);
}

function escapeQuotes(s: string): string {
  return s.replace(/"/g, '\\"');
}
