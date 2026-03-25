import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SIEImport } from "@/components/sie/sie-import";
import { SIEExport } from "@/components/sie/sie-export";
import { getCompanyContext } from "@/lib/company-context";
import { NoDatabase } from "@/components/empty-state";

export default async function SettingsPage() {
  let context;
  try {
    context = await getCompanyContext();
  } catch {
    return (
      <>
        <PageHeader title="Installningar" />
        <NoDatabase />
      </>
    );
  }

  if (!context) {
    return (
      <>
        <PageHeader title="Installningar" />
        <NoDatabase />
      </>
    );
  }

  const { company, fiscalYear } = context;

  return (
    <>
      <PageHeader
        title="Installningar"
        description="Foretags- och systeminstallningar"
      />

      <div className="grid gap-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Foretagsinformation</CardTitle>
            <CardDescription>Grunduppgifter om foretaget</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Foretagsnamn</span>
              <span className="font-medium">{company.name}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Organisationsnummer</span>
              <span className="font-mono">{company.orgNumber ?? "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Momsregistreringsnummer
              </span>
              <span className="font-mono">{company.vatNumber ?? "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Momsperiod</span>
              <Badge variant="secondary">
                {company.vatPeriodType === "monthly"
                  ? "Manadsvis"
                  : "Kvartalsvis"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rakenskapsar</CardTitle>
            <CardDescription>Aktiva och avslutade rakenskapsar</CardDescription>
          </CardHeader>
          <CardContent>
            {fiscalYear ? (
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{fiscalYear.name}</span>
                  <span className="text-muted-foreground ml-2">
                    {fiscalYear.startDate} — {fiscalYear.endDate}
                  </span>
                </div>
                <Badge>Aktivt</Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Inget aktivt rakenskapsar
              </p>
            )}
          </CardContent>
        </Card>

        <SIEImport companyId={company.id} />

        {fiscalYear && (
          <SIEExport
            companyId={company.id}
            fiscalYearId={fiscalYear.id}
            fiscalYearName={fiscalYear.name}
          />
        )}
      </div>
    </>
  );
}
