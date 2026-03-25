"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { importSIEFile, type ImportSIEResult } from "@/actions/sie";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

interface SIEImportProps {
  companyId: string;
}

export function SIEImport({ companyId }: SIEImportProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportSIEResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;

      startTransition(async () => {
        const importResult = await importSIEFile(companyId, content);
        setResult(importResult);
      });
    };
    reader.readAsText(file, "utf-8");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Importera SIE-fil</CardTitle>
        <CardDescription>
          Importera kontoplan och verifikationer fran Fortnox, Visma eller andra
          system. Stodjer SIE4-format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".se,.si,.sie,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-muted-foreground/50"
        >
          {isPending ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
              <p className="text-sm font-medium">Importerar {fileName}...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                {fileName ?? "Klicka for att valja SIE-fil"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                .se, .si, .sie eller .txt
              </p>
            </>
          )}
        </div>

        {result && (
          <div className="space-y-3">
            {/* Status */}
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              <span className="font-medium text-sm">
                {result.success ? "Import klar" : "Import misslyckades"}
              </span>
            </div>

            {/* Company info */}
            {result.companyName && (
              <div className="text-sm text-muted-foreground">
                Foretag: {result.companyName}
                {result.orgNumber && ` (${result.orgNumber})`}
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-3">
              <Badge variant="secondary">
                <FileText className="h-3 w-3 mr-1" />
                {result.accountsImported} nya konton
              </Badge>
              {result.accountsSkipped > 0 && (
                <Badge variant="outline">
                  {result.accountsSkipped} befintliga (hoppade over)
                </Badge>
              )}
              <Badge variant="secondary">
                {result.entriesImported} verifikationer
              </Badge>
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="rounded-md bg-yellow-500/10 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  Varningar ({result.warnings.length})
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5 max-h-32 overflow-y-auto">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="rounded-md bg-destructive/10 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-1">
                  <AlertCircle className="h-4 w-4" />
                  Fel ({result.errors.length})
                </div>
                <ul className="text-xs space-y-0.5">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
