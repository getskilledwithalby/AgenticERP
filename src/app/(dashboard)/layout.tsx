"use client";

import { useState } from "react";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TopNav } from "@/components/layout/top-nav";
import { ChatPanel } from "@/components/layout/chat-panel";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [chatOpen, setChatOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="hidden w-56 shrink-0 border-r md:block">
        <SidebarNav />
      </aside>

      {/* Main Content + Top Nav */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav chatOpen={chatOpen} onToggleChat={() => setChatOpen(!chatOpen)} />

        <div className="flex flex-1 overflow-hidden">
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>

          {/* Chat Panel */}
          <aside
            className={cn(
              "w-[420px] shrink-0 transition-all duration-200",
              chatOpen ? "block" : "hidden"
            )}
          >
            <ChatPanel />
          </aside>
        </div>
      </div>
    </div>
  );
}
