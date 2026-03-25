import { tool } from "ai";
import { z } from "zod";
import {
  searchAccounts as dbSearchAccounts,
  getAccountBalance as dbGetAccountBalance,
} from "@/lib/db/queries/accounts";
import {
  getJournalEntries,
  getJournalEntryWithRows,
  getLedgerForAccount,
} from "@/lib/db/queries/journal-entries";
import { getAccountByNumber } from "@/lib/db/queries/accounts";
import { createJournalEntry } from "@/actions/journal-entries";
import { parseSIE } from "@/lib/sie/parser";
import { formatAmount } from "@/lib/accounting/validation";
import { db } from "@/lib/db";
import {
  journalEntryRows,
  journalEntries,
  accounts,
} from "@/lib/db/schema";
import { eq, and, sql, between } from "drizzle-orm";

export function createAccountingTools(companyId: string) {
  return {
    // ═══════════════════════════════════════════
    // INTERACTION TOOLS
    // ═══════════════════════════════════════════

    askQuestions: tool({
      description:
        "Stall flera fragor till anvandaren pa en gang med fordefinierade svarsalternativ. Anvandaren besvarar alla fragor och skickar ett samlat svar. Anvand detta ALLTID nar du behover information fran anvandaren. Samla ALLA fragor du behover i ett enda anrop. Verktyget pausar konversationen tills anvandaren svarar.",
      inputSchema: z.object({
        title: z
          .string()
          .optional()
          .describe("Rubrik som visas overst, t.ex. 'Jag behover lite mer information'"),
        questions: z
          .array(
            z.object({
              id: z.string().describe("Unikt ID for fragan, t.ex. 'date', 'payment', 'vat'"),
              question: z.string().describe("Fragan som ska stallas"),
              options: z
                .array(
                  z.object({
                    label: z.string().describe("Kort etikett"),
                    description: z
                      .string()
                      .optional()
                      .describe("Forklaring"),
                    value: z.string().describe("Vardet som returneras"),
                  })
                )
                .describe("Svarsalternativ (2-4 st)"),
            })
          )
          .describe("1-5 fragor att stalla samtidigt"),
      }),
      execute: async ({ title, questions }) => {
        return {
          status: "WAITING_FOR_USER",
          title,
          questions,
          instruction:
            "STOPP. Du har stallt fragor till anvandaren. Vagra absolut att fortsatta, skapa verifikationer, eller svara pa fragorna sjalv. Skriv BARA en kort mening som 'Svara pa fragorna ovan sa skapar jag verifikationen.' och INGET mer.",
        };
      },
    }),

    // ═══════════════════════════════════════════
    // LEDGER QUERY TOOLS (read-only)
    // ═══════════════════════════════════════════

    searchAccounts: tool({
      description:
        "Sok i BAS-kontoplanen efter kontonummer, namn eller kontoklass. Returnerar matchande konton.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("Sokterm: kontonummer, namn eller del av namn"),
      }),
      execute: async ({ query }) => {
        const results = await dbSearchAccounts(companyId, query);
        return results.map((a) => ({
          number: a.accountNumber,
          name: a.name,
          nameEn: a.nameEn,
          class: a.accountClass,
          vatCode: a.vatCode,
        }));
      },
    }),

    getAccountBalance: tool({
      description:
        "Hamta saldo for ett specifikt konto, valfritt for en viss period. Returnerar debet, kredit och saldo.",
      inputSchema: z.object({
        accountNumber: z
          .string()
          .describe("BAS-kontonummer, t.ex. 1930"),
        fromDate: z
          .string()
          .optional()
          .describe("Fran datum (YYYY-MM-DD)"),
        toDate: z.string().optional().describe("Till datum (YYYY-MM-DD)"),
      }),
      execute: async ({ accountNumber, fromDate, toDate }) => {
        const result = await dbGetAccountBalance(
          companyId,
          accountNumber,
          fromDate,
          toDate
        );
        if (!result)
          return { error: `Konto ${accountNumber} hittades inte` };
        return {
          ...result,
          debitFormatted: formatAmount(result.debit),
          creditFormatted: formatAmount(result.credit),
          balanceFormatted: formatAmount(result.balance),
        };
      },
    }),

    getTrialBalance: tool({
      description:
        "Hamta saldobalans (trial balance) for alla konton i en period. Visar summa debet och kredit per konto.",
      inputSchema: z.object({
        fromDate: z.string().describe("Fran datum (YYYY-MM-DD)"),
        toDate: z.string().describe("Till datum (YYYY-MM-DD)"),
      }),
      execute: async ({ fromDate, toDate }) => {
        const result = await db
          .select({
            accountNumber: accounts.accountNumber,
            accountName: accounts.name,
            accountClass: accounts.accountClass,
            totalDebit: sql<string>`COALESCE(SUM(${journalEntryRows.debit}), 0)`,
            totalCredit: sql<string>`COALESCE(SUM(${journalEntryRows.credit}), 0)`,
          })
          .from(journalEntryRows)
          .innerJoin(
            journalEntries,
            eq(journalEntryRows.journalEntryId, journalEntries.id)
          )
          .innerJoin(
            accounts,
            eq(journalEntryRows.accountId, accounts.id)
          )
          .where(
            and(
              eq(journalEntries.companyId, companyId),
              eq(journalEntries.status, "posted"),
              sql`${journalEntries.date} >= ${fromDate}`,
              sql`${journalEntries.date} <= ${toDate}`
            )
          )
          .groupBy(
            accounts.accountNumber,
            accounts.name,
            accounts.accountClass
          )
          .orderBy(accounts.accountNumber);

        return result.map((r) => ({
          account: r.accountNumber,
          name: r.accountName,
          class: r.accountClass,
          debit: parseFloat(r.totalDebit),
          credit: parseFloat(r.totalCredit),
          balance: parseFloat(r.totalDebit) - parseFloat(r.totalCredit),
        }));
      },
    }),

    searchJournalEntries: tool({
      description:
        "Sok bland verifikationer efter beskrivning, datum eller status.",
      inputSchema: z.object({
        query: z
          .string()
          .optional()
          .describe("Sokterm i beskrivning"),
        status: z
          .enum(["draft", "pending_approval", "posted", "rejected"])
          .optional()
          .describe("Filtrera pa status"),
        fromDate: z.string().optional().describe("Fran datum"),
        toDate: z.string().optional().describe("Till datum"),
      }),
      execute: async ({ query, status, fromDate, toDate }) => {
        let entries = await getJournalEntries({
          companyId,
          status: status as any,
          limit: 20,
        });

        // Filter by query if provided
        if (query) {
          const q = query.toLowerCase();
          entries = entries.filter((e) =>
            e.description.toLowerCase().includes(q)
          );
        }

        // Filter by date range
        if (fromDate) entries = entries.filter((e) => e.date >= fromDate);
        if (toDate) entries = entries.filter((e) => e.date <= toDate);

        return entries.map((e) => ({
          id: e.id,
          verNr: `${e.verificationSeries}${e.verificationNumber}`,
          date: e.date,
          description: e.description,
          status: e.status,
          source: e.source,
        }));
      },
    }),

    // ═══════════════════════════════════════════
    // WRITE TOOLS (always create drafts)
    // ═══════════════════════════════════════════

    createDraftJournalEntry: tool({
      description:
        "Skapa en ny verifikation som utkast. Rader maste balansera (summa debet = summa kredit). Anvandaren maste godkanna innan bokforing.",
      inputSchema: z.object({
        date: z.string().describe("Verifikationsdatum (YYYY-MM-DD)"),
        description: z.string().describe("Beskrivning av transaktionen"),
        rows: z
          .array(
            z.object({
              accountNumber: z
                .string()
                .describe("BAS-kontonummer (4 siffror)"),
              debit: z.number().describe("Debetbelopp (0 om kredit)"),
              credit: z.number().describe("Kreditbelopp (0 om debet)"),
              description: z
                .string()
                .optional()
                .describe("Valfri radtext"),
            })
          )
          .describe("Konteringsrader (minst 2, maste balansera)"),
      }),
      execute: async ({ date, description, rows }) => {
        const result = await createJournalEntry({
          companyId,
          date,
          description,
          rows: rows.map((r) => ({
            accountNumber: r.accountNumber,
            debit: r.debit,
            credit: r.credit,
            description: r.description,
          })),
          source: "agent",
          createdBy: "agent",
        });

        if (!result.success) {
          return { error: result.errors.join("; ") };
        }

        return {
          success: true,
          entryId: result.entryId,
          message: `Verifikation skapad som utkast. Anvandaren maste godkanna den i dashboarden.`,
          link: `/dashboard/journal-entries/${result.entryId}`,
        };
      },
    }),

    classifyTransaction: tool({
      description:
        "Klassificera en transaktion baserat pa beskrivning, belopp och motpart. Foreslaar BAS-konton och skapar en verifikation.",
      inputSchema: z.object({
        description: z
          .string()
          .describe("Transaktionsbeskrivning fran banken"),
        amount: z
          .number()
          .describe("Belopp (positivt = inbetalning, negativt = utbetalning)"),
        counterpart: z
          .string()
          .optional()
          .describe("Motpart / betalningsmottagare"),
        date: z.string().describe("Transaktionsdatum (YYYY-MM-DD)"),
      }),
      execute: async ({ description, amount, counterpart, date }) => {
        // The agent itself does the classification via its LLM reasoning.
        // This tool just provides structure for the classification output.
        return {
          transaction: { description, amount, counterpart, date },
          instruction:
            "Analysera transaktionen och anvand createDraftJournalEntry for att skapa en verifikation. Forklara ditt resonemang for anvandaren.",
        };
      },
    }),

    // ═══════════════════════════════════════════
    // REPORTING TOOLS
    // ═══════════════════════════════════════════

    generateIncomeStatement: tool({
      description:
        "Generera resultatrakning for en period. Visar intakter (3xxx), kostnader (4-7xxx) och resultat.",
      inputSchema: z.object({
        fromDate: z.string().describe("Fran datum (YYYY-MM-DD)"),
        toDate: z.string().describe("Till datum (YYYY-MM-DD)"),
      }),
      execute: async ({ fromDate, toDate }) => {
        const result = await db
          .select({
            accountNumber: accounts.accountNumber,
            accountName: accounts.name,
            accountClass: accounts.accountClass,
            totalDebit: sql<string>`COALESCE(SUM(${journalEntryRows.debit}), 0)`,
            totalCredit: sql<string>`COALESCE(SUM(${journalEntryRows.credit}), 0)`,
          })
          .from(journalEntryRows)
          .innerJoin(
            journalEntries,
            eq(journalEntryRows.journalEntryId, journalEntries.id)
          )
          .innerJoin(
            accounts,
            eq(journalEntryRows.accountId, accounts.id)
          )
          .where(
            and(
              eq(journalEntries.companyId, companyId),
              eq(journalEntries.status, "posted"),
              sql`${accounts.accountClass} >= 3`,
              sql`${journalEntries.date} >= ${fromDate}`,
              sql`${journalEntries.date} <= ${toDate}`
            )
          )
          .groupBy(
            accounts.accountNumber,
            accounts.name,
            accounts.accountClass
          )
          .orderBy(accounts.accountNumber);

        let totalRevenue = 0;
        let totalCosts = 0;

        const lines = result.map((r) => {
          const balance =
            parseFloat(r.totalCredit) - parseFloat(r.totalDebit);
          if (r.accountClass === 3) {
            totalRevenue += balance;
          } else {
            totalCosts += parseFloat(r.totalDebit) - parseFloat(r.totalCredit);
          }
          return {
            account: r.accountNumber,
            name: r.accountName,
            amount: r.accountClass === 3 ? balance : parseFloat(r.totalDebit) - parseFloat(r.totalCredit),
          };
        });

        return {
          period: `${fromDate} — ${toDate}`,
          lines,
          totalRevenue,
          totalCosts,
          netResult: totalRevenue - totalCosts,
        };
      },
    }),

    generateBalanceSheet: tool({
      description:
        "Generera balansrakning per ett visst datum. Visar tillgangar (1xxx), skulder och eget kapital (2xxx).",
      inputSchema: z.object({
        asOfDate: z.string().describe("Balansdatum (YYYY-MM-DD)"),
      }),
      execute: async ({ asOfDate }) => {
        const result = await db
          .select({
            accountNumber: accounts.accountNumber,
            accountName: accounts.name,
            accountClass: accounts.accountClass,
            totalDebit: sql<string>`COALESCE(SUM(${journalEntryRows.debit}), 0)`,
            totalCredit: sql<string>`COALESCE(SUM(${journalEntryRows.credit}), 0)`,
          })
          .from(journalEntryRows)
          .innerJoin(
            journalEntries,
            eq(journalEntryRows.journalEntryId, journalEntries.id)
          )
          .innerJoin(
            accounts,
            eq(journalEntryRows.accountId, accounts.id)
          )
          .where(
            and(
              eq(journalEntries.companyId, companyId),
              eq(journalEntries.status, "posted"),
              sql`${accounts.accountClass} <= 2`,
              sql`${journalEntries.date} <= ${asOfDate}`
            )
          )
          .groupBy(
            accounts.accountNumber,
            accounts.name,
            accounts.accountClass
          )
          .orderBy(accounts.accountNumber);

        let totalAssets = 0;
        let totalLiabilitiesEquity = 0;

        const lines = result.map((r) => {
          const balance =
            parseFloat(r.totalDebit) - parseFloat(r.totalCredit);
          if (r.accountClass === 1) {
            totalAssets += balance;
          } else {
            totalLiabilitiesEquity += -balance;
          }
          return {
            account: r.accountNumber,
            name: r.accountName,
            balance: r.accountClass === 1 ? balance : -balance,
          };
        });

        return {
          asOfDate,
          lines,
          totalAssets,
          totalLiabilitiesEquity,
        };
      },
    }),

    calculateVAT: tool({
      description:
        "Berakna moms (VAT) for en period. Visar utgaende moms (forsaljning), ingaende moms (inkop) och nettomoms.",
      inputSchema: z.object({
        fromDate: z.string().describe("Periodens startdatum (YYYY-MM-DD)"),
        toDate: z.string().describe("Periodens slutdatum (YYYY-MM-DD)"),
      }),
      execute: async ({ fromDate, toDate }) => {
        // Get output VAT (2610, 2620, 2630) and input VAT (2641, 2642, 2643)
        const result = await db
          .select({
            accountNumber: accounts.accountNumber,
            accountName: accounts.name,
            totalDebit: sql<string>`COALESCE(SUM(${journalEntryRows.debit}), 0)`,
            totalCredit: sql<string>`COALESCE(SUM(${journalEntryRows.credit}), 0)`,
          })
          .from(journalEntryRows)
          .innerJoin(
            journalEntries,
            eq(journalEntryRows.journalEntryId, journalEntries.id)
          )
          .innerJoin(
            accounts,
            eq(journalEntryRows.accountId, accounts.id)
          )
          .where(
            and(
              eq(journalEntries.companyId, companyId),
              eq(journalEntries.status, "posted"),
              sql`${accounts.accountNumber} LIKE '26%'`,
              sql`${journalEntries.date} >= ${fromDate}`,
              sql`${journalEntries.date} <= ${toDate}`
            )
          )
          .groupBy(accounts.accountNumber, accounts.name)
          .orderBy(accounts.accountNumber);

        let outputVat = 0;
        let inputVat = 0;

        const details = result.map((r) => {
          const credit = parseFloat(r.totalCredit);
          const debit = parseFloat(r.totalDebit);
          const isOutput = r.accountNumber.startsWith("261") || r.accountNumber.startsWith("262") || r.accountNumber.startsWith("263");

          if (isOutput) {
            outputVat += credit - debit;
          } else {
            inputVat += debit - credit;
          }

          return {
            account: r.accountNumber,
            name: r.accountName,
            amount: isOutput ? credit - debit : debit - credit,
          };
        });

        return {
          period: `${fromDate} — ${toDate}`,
          details,
          outputVat,
          inputVat,
          netVat: outputVat - inputVat,
          toPay: outputVat - inputVat > 0,
        };
      },
    }),
  };
}
