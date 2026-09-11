"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkAttendanceTab } from "@/components/attendance/mark-attendance-tab";
import { HistoryTab } from "@/components/attendance/history-tab";
import { DailySummaryTab } from "@/components/attendance/daily-summary-tab";
import type { ClassListItem } from "@/lib/types/academics";

export function AttendancePageClient({ classes }: { classes: ClassListItem[] }) {
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "ADMIN";
  const [tab, setTab] = useState("mark");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="mark">Mark attendance</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        {isAdmin && <TabsTrigger value="summary">Daily summary</TabsTrigger>}
      </TabsList>
      <TabsContent value="mark" className="mt-4">
        <MarkAttendanceTab classes={classes} />
      </TabsContent>
      <TabsContent value="history" className="mt-4">
        <HistoryTab classes={classes} />
      </TabsContent>
      {isAdmin && (
        <TabsContent value="summary" className="mt-4">
          <DailySummaryTab />
        </TabsContent>
      )}
    </Tabs>
  );
}
