"use client";

import { Building2, MessageSquare, PanelRightOpen, PanelRightClose } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopNavProps {
  chatOpen: boolean;
  onToggleChat: () => void;
}

export function TopNav({ chatOpen, onToggleChat }: TopNavProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span className="font-medium text-foreground">Demo AB</span>
          <span className="text-xs">(556123-4567)</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleChat}
          className="gap-2"
        >
          {chatOpen ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm">AI Assistent</span>
        </Button>
      </div>
    </header>
  );
}
