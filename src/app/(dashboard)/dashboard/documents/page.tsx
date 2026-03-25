import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Paperclip, Upload } from "lucide-react";

export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        title="Dokument"
        description="Fakturor, kvitton och andra underlag"
        actions={
          <Button size="sm" variant="outline">
            <Upload className="h-4 w-4 mr-1" />
            Ladda upp
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Paperclip className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm">Inga dokument uppladdade</p>
          <p className="text-xs mt-1">
            Dra och slapp fakturor eller kvitton har
          </p>
        </CardContent>
      </Card>
    </>
  );
}
