import { Card, CardContent } from "@/components/ui/card";
import { Database } from "lucide-react";

export function NoDatabase() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Database className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm font-medium">Ingen databas ansluten</p>
        <p className="text-xs mt-1 max-w-md text-center">
          Konfigurera DATABASE_URL i .env.local for att ansluta till Neon
          Postgres. Kor sedan{" "}
          <code className="font-mono bg-muted px-1 rounded">
            npm run db:push
          </code>{" "}
          och{" "}
          <code className="font-mono bg-muted px-1 rounded">
            npm run db:seed
          </code>
          .
        </p>
      </CardContent>
    </Card>
  );
}
