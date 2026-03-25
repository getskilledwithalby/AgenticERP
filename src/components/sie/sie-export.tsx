"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download } from "lucide-react";

interface SIEExportProps {
  companyId: string;
  fiscalYearId: string;
  fiscalYearName: string;
}

export function SIEExport({
  companyId,
  fiscalYearId,
  fiscalYearName,
}: SIEExportProps) {
  const handleExport = () => {
    window.open(
      `/api/sie/export?companyId=${companyId}&fiscalYearId=${fiscalYearId}`,
      "_blank"
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Exportera SIE-fil</CardTitle>
        <CardDescription>
          Exportera kontoplan och bokforda verifikationer i SIE4-format for
          import i andra system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">Rakenskapsar:</span>{" "}
            <span className="font-medium">{fiscalYearName}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Exportera SIE4
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
