import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" description="School overview at a glance." />
      <Card>
        <CardHeader>
          <CardTitle>Coming up on Day 4</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Summary cards, charts, and recent activity — wired to real database aggregates
          once Students, Attendance, Fees, Admissions, and Exams are implemented.
        </CardContent>
      </Card>
    </div>
  );
}
