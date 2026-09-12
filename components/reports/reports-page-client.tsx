"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentOverviewTab } from "@/components/reports/student-overview-tab";
import { AttendanceReportTab } from "@/components/reports/attendance-report-tab";
import { FeesReportTab } from "@/components/reports/fees-report-tab";
import { AdmissionsReportTab } from "@/components/reports/admissions-report-tab";
import { ResultsReportTab } from "@/components/reports/results-report-tab";
import type { StudentOverviewReport, AttendanceReport, FeesReport, AdmissionsReport, ResultsReport } from "@/lib/types/reports";
import type { ClassListItem, SubjectListItem } from "@/lib/types/academics";

export function ReportsPageClient({
  studentOverview,
  attendance,
  fees,
  admissions,
  results,
  classes,
  subjects,
  filters,
}: {
  studentOverview: StudentOverviewReport;
  attendance: AttendanceReport;
  fees: FeesReport;
  admissions: AdmissionsReport;
  results: ResultsReport;
  classes: ClassListItem[];
  subjects: SubjectListItem[];
  filters: { classId: string; subjectId: string; from: string; to: string };
}) {
  const [tab, setTab] = useState("students");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="flex-wrap">
        <TabsTrigger value="students">Students</TabsTrigger>
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
        <TabsTrigger value="fees">Fees</TabsTrigger>
        <TabsTrigger value="admissions">Admissions</TabsTrigger>
        <TabsTrigger value="results">Results</TabsTrigger>
      </TabsList>
      <TabsContent value="students" className="mt-4">
        <StudentOverviewTab data={studentOverview} />
      </TabsContent>
      <TabsContent value="attendance" className="mt-4">
        <AttendanceReportTab data={attendance} classes={classes} filters={filters} />
      </TabsContent>
      <TabsContent value="fees" className="mt-4">
        <FeesReportTab data={fees} />
      </TabsContent>
      <TabsContent value="admissions" className="mt-4">
        <AdmissionsReportTab data={admissions} />
      </TabsContent>
      <TabsContent value="results" className="mt-4">
        <ResultsReportTab data={results} classes={classes} subjects={subjects} filters={filters} />
      </TabsContent>
    </Tabs>
  );
}
