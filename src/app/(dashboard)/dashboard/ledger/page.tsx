import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/lib/accounting/validation";
import { getAccounts, getAccountByNumber } from "@/lib/db/queries/accounts";
import { getLedgerForAccount } from "@/lib/db/queries/journal-entries";
import { getCompanyContext } from "@/lib/company-context";
import { NoDatabase } from "@/components/empty-state";
import { Landmark } from "lucide-react";
import Link from "next/link";

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  let context;
  try {
    context = await getCompanyContext();
  } catch {
    return (
      <>
        <PageHeader title="Huvudbok" />
        <NoDatabase />
      </>
    );
  }

  if (!context) {
    return (
      <>
        <PageHeader title="Huvudbok" />
        <NoDatabase />
      </>
    );
  }

  const allAccounts = await getAccounts(context.company.id);

  // If an account is selected, show its ledger
  let ledgerData = null;
  let selectedAccount = null;

  if (params.account) {
    selectedAccount = await getAccountByNumber(
      context.company.id,
      params.account
    );
    if (selectedAccount) {
      ledgerData = await getLedgerForAccount(
        context.company.id,
        selectedAccount.id,
        params.from,
        params.to
      );
    }
  }

  // Calculate running balance
  let runningBalance = 0;
  const ledgerWithBalance = (ledgerData ?? []).map((row) => {
    const debit = parseFloat(row.debit);
    const credit = parseFloat(row.credit);
    runningBalance += debit - credit;
    return { ...row, runningBalance };
  });

  return (
    <>
      <PageHeader
        title="Huvudbok"
        description="Kontoutdrag per konto med lopande saldo"
      />

      {/* Account selector */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <form className="flex items-end gap-3">
            <div className="space-y-1.5 flex-1 max-w-xs">
              <label className="text-sm font-medium">Konto</label>
              <select
                name="account"
                defaultValue={params.account ?? ""}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-mono"
              >
                <option value="">Valj konto...</option>
                {allAccounts.map((acc) => (
                  <option key={acc.id} value={acc.accountNumber}>
                    {acc.accountNumber} — {acc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Fran</label>
              <input
                type="date"
                name="from"
                defaultValue={params.from ?? ""}
                className="flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Till</label>
              <input
                type="date"
                name="to"
                defaultValue={params.to ?? ""}
                className="flex h-8 rounded-md border border-input bg-background px-3 py-1 text-sm font-mono"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              Visa
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Ledger table */}
      {selectedAccount ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="font-mono">{selectedAccount.accountNumber}</span>
              <span className="text-muted-foreground">—</span>
              <span>{selectedAccount.name}</span>
              {ledgerWithBalance.length > 0 && (
                <Badge variant="secondary" className="ml-auto font-mono">
                  Saldo: {formatAmount(runningBalance)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>

          {ledgerWithBalance.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28 font-mono">Datum</TableHead>
                  <TableHead className="w-20 font-mono">Ver.nr</TableHead>
                  <TableHead>Beskrivning</TableHead>
                  <TableHead className="w-28 text-right font-mono">
                    Debet
                  </TableHead>
                  <TableHead className="w-28 text-right font-mono">
                    Kredit
                  </TableHead>
                  <TableHead className="w-32 text-right font-mono">
                    Saldo
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerWithBalance.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono">{row.date}</TableCell>
                    <TableCell className="font-mono">
                      <Link
                        href={`/dashboard/journal-entries/${row.journalEntryId}`}
                        className="hover:underline"
                      >
                        {row.verificationSeries}
                        {row.verificationNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {row.rowDescription || row.entryDescription}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(row.debit) > 0
                        ? formatAmount(parseFloat(row.debit))
                        : ""}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(row.credit) > 0
                        ? formatAmount(parseFloat(row.credit))
                        : ""}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatAmount(row.runningBalance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <CardContent className="text-center py-8 text-sm text-muted-foreground">
              Inga bokforda transaktioner for detta konto
            </CardContent>
          )}
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Landmark className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">Valj ett konto for att visa huvudboken</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
