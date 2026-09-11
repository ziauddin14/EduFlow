export interface StudentListItem {
  _id: string;
  studentId: string;
  name: string;
  avatarUrl: string | null;
  dob: string;
  gender: "Male" | "Female" | "Other";
  class: { _id: string; name: string } | null;
  section: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
  admissionDate: string;
  status: "Active" | "Inactive" | "Graduated";
}

export interface StudentDetail extends Omit<StudentListItem, "class"> {
  class: { _id: string; name: string; sections: string[] } | null;
}

export interface StudentAttendanceSummary {
  totalDays: number;
  present: number;
  late: number;
  absent: number;
  percentage: number | null;
}

export interface StudentFeeSummary {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  recordCount: number;
}

export interface StudentResultSummaryItem {
  _id: string;
  percentage: number;
  grade: string;
  status: "Pass" | "Fail";
  exam: { _id: string; name: string; date: string } | null;
}

export interface StudentDetailResponse {
  student: StudentDetail;
  attendanceSummary: StudentAttendanceSummary;
  feeSummary: StudentFeeSummary;
  resultSummary: StudentResultSummaryItem[];
}
