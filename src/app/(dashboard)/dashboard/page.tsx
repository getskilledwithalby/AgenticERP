import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { NoDatabase } from "@/components/empty-state";
import { ENTRY_STATUS_LABELS } from "@/lib/constants";
import { formatAmount } from "@/lib/accounting/validation";
import { getCompanyContext } from "@/lib/company-context";
import {
  getJournalEntryCount,
  getRecentJournalEntries,
} from "@/lib/db/queries/journal-entries";
import { getAccountBalance } from "@/lib/db/queries/accounts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  FileText,
  ArrowLeftRight,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  let context;
  try {
    context = await getCompanyContext();
  } catch {
    return (
      <>
        <PageHeader title="Oversikt" />
        <NoDatabase />
      </>
    );
  }

  if (!context) {
    return (
      <>
        <PageHeader title="Oversikt" />
        <NoDatabase />
      </>
    );
  }

  const companyId = context.company.id;

  // Fetch metrics in parallel
  const [bankBalance, pendingCount, recentEntries] = await Promise.all([
    getAccountBalance(companyId, "1930"),
    getJournalEntryCount(companyId, "draft"),
    getRecentJournalEntries(companyId, 10),
  ]);

  return (
    <>
      <PageHeader
        title="Oversikt"
        description={`${context.company.name} — Rakenskapsar ${context.fiscalYear?.name ?? "—"}`}
      />

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banksaldo</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {bankBalance ? formatAmount(bankBalance.balance) : "0,00"} kr
            </div>
            <p className="text-xs text-muted-foreground">Konto 1930</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bokforda verifikationer
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {recentEntries.length}
            </div>
            <p className="text-xs text-muted-foreground">senaste</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vantar godkannande
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">utkast/vaentande</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rakenskapsar
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {context.fiscalYear?.name ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {context.fiscalYear
                ? `${context.fiscalYear.startDate} — ${context.fiscalYear.endDate}`
                : "Inget aktivt"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Senaste verifikationer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentEntries.length > 0 ? (
            <div className="space-y-2">
              {recentEntries.map((entry) => {
                const statusInfo = ENTRY_STATUS_LABELS[entry.status];
                return (
                  <Link
                    key={entry.id}
                    href={`/dashboard/journal-entries/${entry.id}`}
                    className="flex items-center justify-between py-2 px-2 rounded hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium w-10">
                        {entry.verificationSeries}
                        {entry.verificationNumber}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {entry.date}
                      </span>
                      <span className="text-sm">{entry.description}</span>
                    </div>
                    <Badge variant={statusInfo?.variant ?? "secondary"}>
                      {statusInfo?.label ?? entry.status}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
              <FileText className="h-8 w-8 mb-2 opacity-50" />
              <p>Inga verifikationer annu</p>
              <p className="text-xs mt-1">
                Importera en SIE-fil eller skapa en verifikation
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
