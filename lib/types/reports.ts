export interface StudentOverviewReport {
  total: number;
  byClass: { className: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

export interface AttendanceReport {
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number | null;
  byClass: { className: string; present: number; absent: number; late: number; total: number; percentage: number }[];
}

export interface FeesReport {
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  collectedPercentage: number;
  byClass: { className: string; total: number; collected: number }[];
  statusCounts: { status: string; count: number }[];
}

export interface AdmissionsReport {
  total: number;
  byStatus: { status: string; count: number }[];
  conversionRate: number;
}

export interface ResultsReport {
  totalResults: number;
  averagePercentage: number;
  passCount: number;
  failCount: number;
  passRate: number;
  byClass: { className: string; averagePercentage: number }[];
  bySubject: { subjectName: string; averagePercentage: number }[];
}
