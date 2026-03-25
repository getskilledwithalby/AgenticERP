import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ENTRY_STATUS_LABELS } from "@/lib/constants";
import { formatAmount } from "@/lib/accounting/validation";
import { getJournalEntries } from "@/lib/db/queries/journal-entries";
import { getCompanyContext } from "@/lib/company-context";
import { NoDatabase } from "@/components/empty-state";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";

async function JournalEntryTable({
  companyId,
  status,
}: {
  companyId: string;
  status?: "draft" | "pending_approval" | "posted" | "rejected";
}) {
  const entries = await getJournalEntries({ companyId, status });

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FileText className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm">Inga verifikationer</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20 font-mono">Ver.nr</TableHead>
            <TableHead className="w-28">Datum</TableHead>
            <TableHead>Beskrivning</TableHead>
            <TableHead className="w-24">Kalla</TableHead>
            <TableHead className="w-32">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const statusInfo = ENTRY_STATUS_LABELS[entry.status] ?? {
              label: entry.status,
              variant: "secondary" as const,
            };

            return (
              <TableRow key={entry.id}>
                <TableCell className="font-mono font-medium">
                  <Link
                    href={`/dashboard/journal-entries/${entry.id}`}
                    className="hover:underline"
                  >
                    {entry.verificationSeries}
                    {entry.verificationNumber}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {entry.date}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/dashboard/journal-entries/${entry.id}`}
                    className="hover:underline"
                  >
                    {entry.description}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {entry.source}
                </TableCell>
                <TableCell>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

export default async function JournalEntriesPage() {
  let context;
  try {
    context = await getCompanyContext();
  } catch {
    return (
      <>
        <PageHeader title="Verifikationer" />
        <NoDatabase />
      </>
    );
  }

  if (!context) {
    return (
      <>
        <PageHeader title="Verifikationer" />
        <NoDatabase />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Verifikationer"
        description={`Rakenskapsar ${context.fiscalYear?.name ?? "—"}`}
        actions={
          <Link
            href="/dashboard/journal-entries/new"
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            <Plus className="h-4 w-4" />
            Ny verifikation
          </Link>
        }
      />

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Alla</TabsTrigger>
          <TabsTrigger value="draft">Utkast</TabsTrigger>
          <TabsTrigger value="pending">Vantar</TabsTrigger>
          <TabsTrigger value="posted">Bokforda</TabsTrigger>
          <TabsTrigger value="rejected">Avslagna</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <JournalEntryTable companyId={context.company.id} />
        </TabsContent>
        <TabsContent value="draft" className="mt-4">
          <JournalEntryTable
            companyId={context.company.id}
            status="draft"
          />
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <JournalEntryTable
            companyId={context.company.id}
            status="pending_approval"
          />
        </TabsContent>
        <TabsContent value="posted" className="mt-4">
          <JournalEntryTable
            companyId={context.company.id}
            status="posted"
          />
        </TabsContent>
        <TabsContent value="rejected" className="mt-4">
          <JournalEntryTable
            companyId={context.company.id}
            status="rejected"
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
