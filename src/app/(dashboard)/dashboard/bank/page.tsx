import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeftRight, Upload } from "lucide-react";

export default function BankPage() {
  return (
    <>
      <PageHeader
        title="Banktransaktioner"
        description="Importerade transaktioner och matchning"
        actions={
          <Button size="sm" variant="outline">
            <Upload className="h-4 w-4 mr-1" />
            Importera
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ArrowLeftRight className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm">Inga banktransaktioner importerade</p>
          <p className="text-xs mt-1">
            Importera en SIE-fil eller anslut via Enable Banking
          </p>
        </CardContent>
      </Card>
    </>
  );
}
