import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ENTRY_STATUS_LABELS } from "@/lib/constants";
import { formatAmount } from "@/lib/accounting/validation";
import { getJournalEntryWithRows } from "@/lib/db/queries/journal-entries";
import { getAuditLogForEntity } from "@/lib/db/queries/audit";
import { ApprovalActions } from "@/components/journal-entries/approval-actions";
import { notFound } from "next/navigation";

export default async function JournalEntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let entry;
  try {
    entry = await getJournalEntryWithRows(id);
  } catch {
    notFound();
  }

  if (!entry) {
    notFound();
  }

  const statusInfo = ENTRY_STATUS_LABELS[entry.status] ?? {
    label: entry.status,
    variant: "secondary" as const,
  };

  const totalDebit = entry.rows.reduce(
    (sum, r) => sum + parseFloat(r.debit),
    0
  );
  const totalCredit = entry.rows.reduce(
    (sum, r) => sum + parseFloat(r.credit),
    0
  );
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;

  const auditEntries = await getAuditLogForEntity("journal_entry", id);

  return (
    <>
      <PageHeader
        title={`Verifikation ${entry.verificationSeries}${entry.verificationNumber}`}
        description={entry.description}
        actions={
          <ApprovalActions entryId={entry.id} status={entry.status} />
        }
      />

      {/* Header info */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Status</div>
            <Badge variant={statusInfo.variant} className="mt-1">
              {statusInfo.label}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Datum</div>
            <div className="font-mono mt-1">{entry.date}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Kalla</div>
            <div className="mt-1 text-sm">{entry.source}</div>
          </CardContent>
        </Card>
      </div>

      {/* Entry rows */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Konteringsrader</CardTitle>
          <CardDescription>
            {isBalanced ? (
              <span className="text-green-500">Balanserad</span>
            ) : (
              <span className="text-destructive">
                Obalanserad — differens{" "}
                {formatAmount(Math.abs(totalDebit - totalCredit))}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24 font-mono">Konto</TableHead>
              <TableHead>Kontonamn</TableHead>
              <TableHead>Beskrivning</TableHead>
              <TableHead className="w-20">Moms</TableHead>
              <TableHead className="w-32 text-right font-mono">
                Debet
              </TableHead>
              <TableHead className="w-32 text-right font-mono">
                Kredit
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entry.rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono font-medium">
                  {row.accountNumber}
                </TableCell>
                <TableCell>{row.accountName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.description}
                </TableCell>
                <TableCell className="text-sm">
                  {row.vatRate && (
                    <Badge variant="outline" className="font-mono">
                      {row.vatRate}%
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {parseFloat(row.debit) > 0 ? formatAmount(parseFloat(row.debit)) : ""}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {parseFloat(row.credit) > 0
                    ? formatAmount(parseFloat(row.credit))
                    : ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4} className="font-medium">
                Summa
              </TableCell>
              <TableCell className="text-right font-mono font-bold">
                {formatAmount(totalDebit)}
              </TableCell>
              <TableCell className="text-right font-mono font-bold">
                {formatAmount(totalCredit)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      {/* Audit trail */}
      {auditEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Handelselog</CardTitle>
            <CardDescription>
              Alla andringar enligt Bokforingslagen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditEntries.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <div className="text-xs text-muted-foreground font-mono w-36 shrink-0">
                    {log.timestamp.toISOString().replace("T", " ").slice(0, 19)}
                  </div>
                  <div>
                    <span className="font-medium">{log.actor}</span>{" "}
                    <span className="text-muted-foreground">{log.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
