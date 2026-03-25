"use server";

import { db } from "@/lib/db";
import {
  accounts,
  journalEntries,
  journalEntryRows,
  fiscalYears,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { parseSIE } from "@/lib/sie/parser";
import { insertAuditLog } from "@/lib/db/queries/audit";
import { revalidatePath } from "next/cache";

export interface ImportSIEResult {
  success: boolean;
  companyName?: string;
  orgNumber?: string;
  accountsImported: number;
  accountsSkipped: number;
  entriesImported: number;
  warnings: string[];
  errors: string[];
}

export async function importSIEFile(
  companyId: string,
  content: string
): Promise<ImportSIEResult> {
  const result: ImportSIEResult = {
    success: false,
    accountsImported: 0,
    accountsSkipped: 0,
    entriesImported: 0,
    warnings: [],
    errors: [],
  };

  try {
    // Parse the SIE file
    const sie = parseSIE(content);
    result.companyName = sie.companyName;
    result.orgNumber = sie.orgNumber;
    result.warnings.push(...sie.warnings);

    // Get existing accounts for this company
    const existingAccounts = await db
      .select({ id: accounts.id, accountNumber: accounts.accountNumber })
      .from(accounts)
      .where(eq(accounts.companyId, companyId));

    const existingMap = new Map(
      existingAccounts.map((a) => [a.accountNumber, a.id])
    );

    // Import/upsert accounts from SIE
    for (const sieAccount of sie.accounts) {
      if (existingMap.has(sieAccount.number)) {
        result.accountsSkipped++;
        continue;
      }

      const accountClass = parseInt(sieAccount.number[0]);
      if (isNaN(accountClass) || accountClass < 1 || accountClass > 8) {
        result.warnings.push(
          `Hoppar over konto ${sieAccount.number}: ogiltig kontoklass`
        );
        continue;
      }

      const [newAccount] = await db
        .insert(accounts)
        .values({
          companyId,
          accountNumber: sieAccount.number,
          name: sieAccount.name,
          accountClass,
          sruCode: sieAccount.sruCode,
        })
        .returning({ id: accounts.id });

      existingMap.set(sieAccount.number, newAccount.id);
      result.accountsImported++;
    }

    // Get active fiscal year
    const [activeFY] = await db
      .select()
      .from(fiscalYears)
      .where(
        and(
          eq(fiscalYears.companyId, companyId),
          eq(fiscalYears.isClosed, false)
        )
      )
      .limit(1);

    if (!activeFY && sie.entries.length > 0) {
      // Try to create fiscal year from SIE data
      const currentFY = sie.fiscalYears.get(0);
      if (currentFY) {
        const [newFY] = await db
          .insert(fiscalYears)
          .values({
            companyId,
            name: currentFY.start.slice(0, 4),
            startDate: currentFY.start,
            endDate: currentFY.end,
          })
          .onConflictDoNothing()
          .returning();

        if (newFY) {
          result.warnings.push(
            `Skapade rakenskapsar ${newFY.name} fran SIE-data`
          );
        }
      }
    }

    // Re-fetch fiscal year
    const [fiscalYear] = await db
      .select()
      .from(fiscalYears)
      .where(
        and(
          eq(fiscalYears.companyId, companyId),
          eq(fiscalYears.isClosed, false)
        )
      )
      .limit(1);

    if (!fiscalYear && sie.entries.length > 0) {
      result.errors.push(
        "Kan inte importera verifikationer: inget aktivt rakenskapsar"
      );
    }

    // Import journal entries
    if (fiscalYear) {
      for (const sieEntry of sie.entries) {
        // Verify all transaction accounts exist
        const missingAccounts = sieEntry.transactions.filter(
          (t) => !existingMap.has(t.accountNumber)
        );
        if (missingAccounts.length > 0) {
          result.warnings.push(
            `VER ${sieEntry.series}${sieEntry.number}: Hoppar over — saknade konton: ${missingAccounts.map((t) => t.accountNumber).join(", ")}`
          );
          continue;
        }

        // Create the journal entry as "posted" (historical import)
        const [entry] = await db
          .insert(journalEntries)
          .values({
            companyId,
            fiscalYearId: fiscalYear.id,
            date: sieEntry.date,
            description: sieEntry.description || `SIE import ${sieEntry.series}${sieEntry.number}`,
            status: "posted",
            source: "sie_import",
            createdBy: "system",
            approvedBy: "sie_import",
            approvedAt: new Date(),
            postedAt: new Date(),
          })
          .returning();

        // Create transaction rows
        const rows = sieEntry.transactions.map((trans, index) => ({
          journalEntryId: entry.id,
          accountId: existingMap.get(trans.accountNumber)!,
          // SIE: positive = debit, negative = credit
          debit: String(Math.max(0, trans.amount)),
          credit: String(Math.max(0, -trans.amount)),
          description: trans.description,
          sortOrder: index,
        }));

        await db.insert(journalEntryRows).values(rows);
        result.entriesImported++;
      }
    }

    // Audit log
    await insertAuditLog(companyId, "company", companyId, "import", "system", {
      type: "sie4",
      source: sie.program,
      accounts: result.accountsImported,
      entries: result.entriesImported,
    });

    result.success = true;
  } catch (error) {
    result.errors.push(
      `Parsningsfel: ${error instanceof Error ? error.message : "Okant fel"}`
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard/journal-entries");
  revalidatePath("/dashboard/settings");

  return result;
}
