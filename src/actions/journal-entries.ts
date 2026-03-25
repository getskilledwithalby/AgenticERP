"use server";

import { db } from "@/lib/db";
import {
  journalEntries,
  journalEntryRows,
  accounts,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { insertAuditLog } from "@/lib/db/queries/audit";
import { getActiveFiscalYear } from "@/lib/db/queries/companies";
import {
  validateJournalEntry,
  type EntryRow,
} from "@/lib/accounting/validation";
import { revalidatePath } from "next/cache";

export interface CreateJournalEntryInput {
  companyId: string;
  date: string;
  description: string;
  rows: EntryRow[];
  source?: string;
  createdBy?: string;
}

export async function createJournalEntry(input: CreateJournalEntryInput) {
  // Validate the entry
  const validation = validateJournalEntry(
    input.date,
    input.description,
    input.rows
  );
  if (!validation.valid) {
    return { success: false as const, errors: validation.errors };
  }

  // Get active fiscal year
  const fiscalYear = await getActiveFiscalYear(input.companyId);
  if (!fiscalYear) {
    return {
      success: false as const,
      errors: ["Inget aktivt rakenskapsar hittades"],
    };
  }

  // Verify date is within fiscal year
  if (input.date < fiscalYear.startDate || input.date > fiscalYear.endDate) {
    return {
      success: false as const,
      errors: [
        `Datum ${input.date} ar utanfor rakenskapsar ${fiscalYear.name} (${fiscalYear.startDate} - ${fiscalYear.endDate})`,
      ],
    };
  }

  // Look up account IDs from account numbers
  const accountNumbers = input.rows.map((r) => r.accountNumber);
  const accountRecords = await db
    .select({ id: accounts.id, accountNumber: accounts.accountNumber })
    .from(accounts)
    .where(
      and(
        eq(accounts.companyId, input.companyId),
        sql`${accounts.accountNumber} IN (${sql.join(
          accountNumbers.map((n) => sql`${n}`),
          sql`, `
        )})`
      )
    );

  const accountMap = new Map(
    accountRecords.map((a) => [a.accountNumber, a.id])
  );

  // Verify all accounts exist
  for (const row of input.rows) {
    if (!accountMap.has(row.accountNumber)) {
      return {
        success: false as const,
        errors: [`Konto ${row.accountNumber} finns inte i kontoplanen`],
      };
    }
  }

  // Generate gap-free verification number with locking
  const [nextNum] = await db
    .select({
      next: sql<number>`COALESCE(MAX(${journalEntries.verificationNumber}), 0) + 1`,
    })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.companyId, input.companyId),
        eq(journalEntries.verificationSeries, "A")
      )
    );

  // Create the journal entry
  const [entry] = await db
    .insert(journalEntries)
    .values({
      companyId: input.companyId,
      fiscalYearId: fiscalYear.id,
      verificationNumber: nextNum.next,
      date: input.date,
      description: input.description,
      status: "draft",
      source: input.source ?? "manual",
      createdBy: input.createdBy ?? "system",
    })
    .returning();

  // Create the rows
  await db.insert(journalEntryRows).values(
    input.rows.map((row, index) => ({
      journalEntryId: entry.id,
      accountId: accountMap.get(row.accountNumber)!,
      debit: String(row.debit),
      credit: String(row.credit),
      description: row.description,
      vatRate: row.vatRate,
      vatAmount: row.vatAmount ? String(row.vatAmount) : undefined,
      sortOrder: index,
    }))
  );

  // Audit log
  await insertAuditLog(
    input.companyId,
    "journal_entry",
    entry.id,
    "create",
    input.createdBy ?? "system",
    {
      date: input.date,
      description: input.description,
      rowCount: input.rows.length,
      source: input.source ?? "manual",
    }
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/journal-entries");

  return { success: true as const, entryId: entry.id };
}

export async function approveJournalEntry(
  entryId: string,
  approvedBy: string
) {
  // Fetch the entry
  const [entry] = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.id, entryId))
    .limit(1);

  if (!entry) {
    return { success: false as const, error: "Verifikation hittades inte" };
  }

  if (entry.status !== "draft" && entry.status !== "pending_approval") {
    return {
      success: false as const,
      error: `Kan inte godkanna verifikation med status "${entry.status}"`,
    };
  }

  // Verify rows balance before posting
  const [balanceCheck] = await db
    .select({
      totalDebit: sql<string>`SUM(${journalEntryRows.debit})`,
      totalCredit: sql<string>`SUM(${journalEntryRows.credit})`,
    })
    .from(journalEntryRows)
    .where(eq(journalEntryRows.journalEntryId, entryId));

  const debit = parseFloat(balanceCheck.totalDebit ?? "0");
  const credit = parseFloat(balanceCheck.totalCredit ?? "0");

  if (Math.abs(debit - credit) > 0.001) {
    return {
      success: false as const,
      error: "Verifikationen balanserar inte — kan inte bokforas",
    };
  }

  // Post the entry
  const now = new Date();
  await db
    .update(journalEntries)
    .set({
      status: "posted",
      approvedBy,
      approvedAt: now,
      postedAt: now,
      updatedAt: now,
    })
    .where(eq(journalEntries.id, entryId));

  await insertAuditLog(
    entry.companyId,
    "journal_entry",
    entryId,
    "post",
    approvedBy,
    { previousStatus: entry.status }
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/journal-entries");
  revalidatePath(`/dashboard/journal-entries/${entryId}`);

  return { success: true as const };
}

export async function rejectJournalEntry(
  entryId: string,
  rejectedBy: string,
  reason?: string
) {
  const [entry] = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.id, entryId))
    .limit(1);

  if (!entry) {
    return { success: false as const, error: "Verifikation hittades inte" };
  }

  if (entry.status === "posted") {
    return {
      success: false as const,
      error: "Kan inte avslaa en redan bokford verifikation",
    };
  }

  await db
    .update(journalEntries)
    .set({
      status: "rejected",
      updatedAt: new Date(),
    })
    .where(eq(journalEntries.id, entryId));

  await insertAuditLog(
    entry.companyId,
    "journal_entry",
    entryId,
    "reject",
    rejectedBy,
    { previousStatus: entry.status, reason }
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/journal-entries");
  revalidatePath(`/dashboard/journal-entries/${entryId}`);

  return { success: true as const };
}

export async function deleteJournalEntry(entryId: string, deletedBy: string) {
  const [entry] = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.id, entryId))
    .limit(1);

  if (!entry) {
    return { success: false as const, error: "Verifikation hittades inte" };
  }

  if (entry.status === "posted") {
    return {
      success: false as const,
      error: "Kan inte radera en bokford verifikation (Bokforingslagen)",
    };
  }

  await insertAuditLog(
    entry.companyId,
    "journal_entry",
    entryId,
    "delete",
    deletedBy,
    { date: entry.date, description: entry.description }
  );

  // Cascade deletes rows due to FK constraint
  await db.delete(journalEntries).where(eq(journalEntries.id, entryId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/journal-entries");

  return { success: true as const };
}
