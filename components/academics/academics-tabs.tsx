"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClassesTab } from "@/components/academics/classes-tab";
import { SubjectsTab } from "@/components/academics/subjects-tab";
import type { ClassListItem, SubjectListItem, TeacherOption } from "@/lib/types/academics";

export function AcademicsTabs({
  initialClasses,
  initialSubjects,
  teachers,
}: {
  initialClasses: ClassListItem[];
  initialSubjects: SubjectListItem[];
  teachers: TeacherOption[];
}) {
  const [tab, setTab] = useState("classes");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="classes">Classes</TabsTrigger>
        <TabsTrigger value="subjects">Subjects</TabsTrigger>
      </TabsList>
      <TabsContent value="classes" className="mt-4">
        <ClassesTab initialClasses={initialClasses} teachers={teachers} />
      </TabsContent>
      <TabsContent value="subjects" className="mt-4">
        <SubjectsTab initialSubjects={initialSubjects} classes={initialClasses} teachers={teachers} />
      </TabsContent>
    </Tabs>
  );
}
