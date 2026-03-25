import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function BalanceSheetPage() {
  return (
    <>
      <PageHeader
        title="Balansrakning"
        description="Tillgangar, skulder och eget kapital"
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <BarChart3 className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm">Ingen data att visa annu</p>
        </CardContent>
      </Card>
    </>
  );
}
