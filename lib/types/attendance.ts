export type AttendanceStatus = "Present" | "Absent" | "Late";

export interface AttendanceRosterEntry {
  student: { _id: string; name: string; studentId: string };
  status: AttendanceStatus | null;
}

export interface AttendanceForDateResponse {
  date: string;
  alreadyMarked: boolean;
  roster: AttendanceRosterEntry[];
  classPercentage: { daysRecorded: number; percentage: number | null };
}

export interface AttendanceHistoryItem {
  _id: string;
  date: string;
  section: string;
  records: { student: string; status: AttendanceStatus }[];
}
