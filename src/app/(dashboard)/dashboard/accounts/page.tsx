import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ACCOUNT_CLASSES } from "@/lib/constants";
import { getAccountsByClass } from "@/lib/db/queries/accounts";
import { getCompanyContext } from "@/lib/company-context";
import { NoDatabase } from "@/components/empty-state";
import { BookOpen } from "lucide-react";

export default async function AccountsPage() {
  let context;
  try {
    context = await getCompanyContext();
  } catch {
    return (
      <>
        <PageHeader title="Kontoplan" description="BAS 2026" />
        <NoDatabase />
      </>
    );
  }

  if (!context) {
    return (
      <>
        <PageHeader title="Kontoplan" description="BAS 2026" />
        <NoDatabase />
      </>
    );
  }

  const accountsByClass = await getAccountsByClass(context.company.id);

  return (
    <>
      <PageHeader
        title="Kontoplan"
        description={`BAS 2026 — ${context.company.name}`}
      />

      <div className="grid gap-4">
        {Object.entries(ACCOUNT_CLASSES).map(([cls, names]) => {
          const classAccounts = accountsByClass.get(Number(cls)) ?? [];

          return (
            <Card key={cls}>
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono font-bold">{cls}xxx</span>
                  <span className="text-muted-foreground">—</span>
                  <span>{names.sv}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {classAccounts.length} konton
                  </Badge>
                </CardTitle>
              </CardHeader>
              {classAccounts.length > 0 && (
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24 font-mono">Konto</TableHead>
                        <TableHead>Namn</TableHead>
                        <TableHead className="w-24 text-right">Moms</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-mono font-medium">
                            {account.accountNumber}
                          </TableCell>
                          <TableCell>
                            <span>{account.name}</span>
                            {account.nameEn && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({account.nameEn})
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {account.vatCode && (
                              <Badge variant="outline" className="font-mono">
                                {account.vatCode}%
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
