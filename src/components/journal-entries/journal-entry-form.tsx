"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createJournalEntry } from "@/actions/journal-entries";
import { formatAmount } from "@/lib/accounting/validation";
import { Plus, Trash2, Save, AlertCircle } from "lucide-react";

interface Row {
  accountNumber: string;
  debit: string;
  credit: string;
  description: string;
}

const emptyRow = (): Row => ({
  accountNumber: "",
  debit: "",
  credit: "",
  description: "",
});

interface JournalEntryFormProps {
  companyId: string;
}

export function JournalEntryForm({ companyId }: JournalEntryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState<Row[]>([emptyRow(), emptyRow()]);
  const [errors, setErrors] = useState<string[]>([]);

  const totalDebit = rows.reduce(
    (sum, r) => sum + (parseFloat(r.debit) || 0),
    0
  );
  const totalCredit = rows.reduce(
    (sum, r) => sum + (parseFloat(r.credit) || 0),
    0
  );
  const isBalanced =
    totalDebit > 0 &&
    totalCredit > 0 &&
    Math.abs(totalDebit - totalCredit) < 0.001;

  const updateRow = (index: number, field: keyof Row, value: string) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index: number) => {
    if (rows.length <= 2) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    setErrors([]);

    const entryRows = rows
      .filter((r) => r.accountNumber && (r.debit || r.credit))
      .map((r) => ({
        accountNumber: r.accountNumber,
        debit: parseFloat(r.debit) || 0,
        credit: parseFloat(r.credit) || 0,
        description: r.description || undefined,
      }));

    startTransition(async () => {
      const result = await createJournalEntry({
        companyId,
        date,
        description,
        rows: entryRows,
      });

      if (!result.success) {
        setErrors(result.errors);
      } else {
        router.push(`/dashboard/journal-entries/${result.entryId}`);
      }
    });
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verifikationsdetaljer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Datum</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Beskrivning</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="T.ex. Kontorshyra mars 2026"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Row editor */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Konteringsrader</CardTitle>
            <div className="text-sm mt-1">
              {isBalanced ? (
                <Badge variant="outline" className="text-green-500 border-green-500/30">
                  Balanserad
                </Badge>
              ) : totalDebit > 0 || totalCredit > 0 ? (
                <Badge variant="outline" className="text-destructive border-destructive/30">
                  Differens: {formatAmount(Math.abs(totalDebit - totalCredit))}
                </Badge>
              ) : null}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4 mr-1" />
            Rad
          </Button>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Konto</TableHead>
              <TableHead>Beskrivning</TableHead>
              <TableHead className="w-36">Debet</TableHead>
              <TableHead className="w-36">Kredit</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    value={row.accountNumber}
                    onChange={(e) =>
                      updateRow(index, "accountNumber", e.target.value)
                    }
                    placeholder="1930"
                    className="font-mono"
                    maxLength={4}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.description}
                    onChange={(e) =>
                      updateRow(index, "description", e.target.value)
                    }
                    placeholder="Valfri radtext"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.debit}
                    onChange={(e) => updateRow(index, "debit", e.target.value)}
                    placeholder="0,00"
                    className="font-mono text-right"
                    disabled={!!row.credit && parseFloat(row.credit) > 0}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.credit}
                    onChange={(e) => updateRow(index, "credit", e.target.value)}
                    placeholder="0,00"
                    className="font-mono text-right"
                    disabled={!!row.debit && parseFloat(row.debit) > 0}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeRow(index)}
                    disabled={rows.length <= 2}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="font-medium">
                Summa
              </TableCell>
              <TableCell className="text-right font-mono font-bold">
                {formatAmount(totalDebit)}
              </TableCell>
              <TableCell className="text-right font-mono font-bold">
                {formatAmount(totalCredit)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="border-destructive/50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="text-sm space-y-1">
                {errors.map((error, i) => (
                  <p key={i}>{error}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/journal-entries")}
        >
          Avbryt
        </Button>
        <Button onClick={handleSubmit} disabled={isPending || !isBalanced}>
          <Save className="h-4 w-4 mr-1" />
          {isPending ? "Sparar..." : "Skapa verifikation"}
        </Button>
      </div>
    </div>
  );
}
