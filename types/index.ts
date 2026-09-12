export const ROLES = ["ADMIN", "TEACHER", "STAFF"] as const;
export type Role = (typeof ROLES)[number];

export const STUDENT_STATUSES = ["Active", "Inactive", "Graduated"] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const STAFF_STATUSES = ["Active", "Inactive"] as const;
export type StaffStatus = (typeof STAFF_STATUSES)[number];

export const GENDERS = ["Male", "Female", "Other"] as const;
export type Gender = (typeof GENDERS)[number];

export const ADMISSION_STATUSES = ["New", "Under Review", "Approved", "Rejected"] as const;
export type AdmissionStatus = (typeof ADMISSION_STATUSES)[number];

export const ATTENDANCE_STATUSES = ["Present", "Absent", "Late"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const FEE_STATUSES = ["Paid", "Partial", "Pending", "Overdue"] as const;
export type FeeStatus = (typeof FEE_STATUSES)[number];

export const SUBJECT_STATUSES = ["Active", "Inactive"] as const;
export type SubjectStatus = (typeof SUBJECT_STATUSES)[number];

export const EXAM_TYPES = ["Unit Test", "Midterm", "Final", "Quiz", "Assignment"] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

export const GRADES = ["A+", "A", "B+", "B", "C+", "C", "D", "F"] as const;
export type Grade = (typeof GRADES)[number];

export const RESULT_STATUSES = ["Pass", "Fail"] as const;
export type ResultStatus = (typeof RESULT_STATUSES)[number];

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const NOTICE_CATEGORIES = ["Holiday", "Exam", "Event", "General", "Emergency"] as const;
export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number];

export const NOTICE_STATUSES = ["Draft", "Published"] as const;
export type NoticeStatus = (typeof NOTICE_STATUSES)[number];

export const NOTICE_AUDIENCES = ["Everyone", "Teachers", "Staff", "Students"] as const;
export type NoticeAudience = (typeof NOTICE_AUDIENCES)[number];

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
