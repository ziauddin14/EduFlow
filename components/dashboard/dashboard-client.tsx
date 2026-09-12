import Link from "next/link";
import { format } from "date-fns";
import { Users, GraduationCap, CalendarCheck, Wallet, ClipboardList, FileText, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/reports/kpi-card";
import type { FeeSummary } from "@/lib/types/fees";

interface DailySummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number | null;
}

interface UpcomingExam {
  _id: string;
  name: string;
  date: string;
  class: { name: string } | null;
  subject: { name: string } | null;
}

interface RecentNotice {
  _id: string;
  title: string;
  category: string;
  date: string;
}

export function DashboardClient({
  studentCount,
  teacherCount,
  todaysAttendance,
  feeSummary,
  activeAdmissions,
  upcomingExams,
  recentNotices,
}: {
  studentCount: number;
  teacherCount: number;
  todaysAttendance: DailySummary;
  feeSummary: FeeSummary;
  activeAdmissions: number;
  upcomingExams: UpcomingExam[];
  recentNotices: RecentNotice[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total students" value={studentCount} icon={Users} />
        <KpiCard label="Total teachers" value={teacherCount} icon={GraduationCap} />
        <KpiCard
          label="Today's attendance"
          value={todaysAttendance.percentage !== null ? `${todaysAttendance.percentage}%` : "Not marked"}
          sublabel={todaysAttendance.total > 0 ? `${todaysAttendance.present + todaysAttendance.late}/${todaysAttendance.total} present` : undefined}
          icon={CalendarCheck}
          tone="success"
        />
        <KpiCard label="Active admissions" value={activeAdmissions} icon={ClipboardList} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Fee collection" value={`$${feeSummary.collectedAmount.toLocaleString()}`} sublabel={`${feeSummary.collectedPercentage}% of total`} icon={Wallet} tone="success" />
        <KpiCard label="Pending fees" value={`$${feeSummary.pendingAmount.toLocaleString()}`} tone="warning" />
        <KpiCard label="Overdue fees" value={`$${feeSummary.overdueAmount.toLocaleString()}`} tone="destructive" />
        <KpiCard label="Upcoming exams" value={upcomingExams.length} icon={FileText} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Upcoming exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingExams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming exams scheduled.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingExams.map((exam) => (
                  <li key={exam._id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{exam.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {exam.class?.name} &middot; {exam.subject?.name}
                      </p>
                    </div>
                    <Badge variant="secondary">{format(new Date(exam.date), "MMM d")}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4" />
              Recent notices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentNotices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No published notices yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentNotices.map((notice) => (
                  <li key={notice._id} className="flex items-center justify-between text-sm">
                    <p className="font-medium">{notice.title}</p>
                    <Badge variant="outline">{notice.category}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/students" className="text-sm text-primary hover:underline">
            View students
          </Link>
          <span className="text-muted-foreground">&middot;</span>
          <Link href="/attendance" className="text-sm text-primary hover:underline">
            Mark attendance
          </Link>
          <span className="text-muted-foreground">&middot;</span>
          <Link href="/fees" className="text-sm text-primary hover:underline">
            Manage fees
          </Link>
          <span className="text-muted-foreground">&middot;</span>
          <Link href="/reports" className="text-sm text-primary hover:underline">
            View reports
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
