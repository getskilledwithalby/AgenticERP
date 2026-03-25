"use client";

import { Button } from "@/components/ui/button";
import { approveJournalEntry, rejectJournalEntry } from "@/actions/journal-entries";
import { CheckCircle, XCircle } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface ApprovalActionsProps {
  entryId: string;
  status: string;
}

export function ApprovalActions({ entryId, status }: ApprovalActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (status === "posted" || status === "rejected") {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const result = await approveJournalEntry(entryId, "system");
            if (!result.success) {
              alert(result.error);
            }
            router.refresh();
          });
        }}
      >
        <CheckCircle className="h-4 w-4 mr-1" />
        Godkann & bokfor
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            const result = await rejectJournalEntry(entryId, "system");
            if (!result.success) {
              alert(result.error);
            }
            router.refresh();
          });
        }}
      >
        <XCircle className="h-4 w-4 mr-1" />
        Avslaa
      </Button>
    </div>
  );
}
