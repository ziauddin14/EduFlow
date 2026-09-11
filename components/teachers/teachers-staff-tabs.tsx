"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeachersTab } from "@/components/teachers/teachers-tab";
import { StaffTab } from "@/components/teachers/staff-tab";
import type { TeacherListItem, StaffListItem } from "@/lib/types/teachers";
import type { ClassListItem, SubjectListItem } from "@/lib/types/academics";

export function TeachersStaffTabs({
  initialTeachers,
  initialStaff,
  classes,
  subjects,
}: {
  initialTeachers: TeacherListItem[];
  initialStaff: StaffListItem[];
  classes: ClassListItem[];
  subjects: SubjectListItem[];
}) {
  const [tab, setTab] = useState("teachers");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="teachers">Teachers</TabsTrigger>
        <TabsTrigger value="staff">Staff</TabsTrigger>
      </TabsList>
      <TabsContent value="teachers" className="mt-4">
        <TeachersTab initialTeachers={initialTeachers} classes={classes} subjects={subjects} />
      </TabsContent>
      <TabsContent value="staff" className="mt-4">
        <StaffTab initialStaff={initialStaff} />
      </TabsContent>
    </Tabs>
  );
}
