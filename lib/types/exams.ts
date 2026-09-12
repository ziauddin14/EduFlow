export interface ExamListItem {
  _id: string;
  name: string;
  type: string;
  class: { _id: string; name: string } | null;
  subject: { _id: string; name: string; code: string } | null;
  date: string;
  maxMarks: number;
  passingMarks: number;
  resultCount: number;
}

export interface ResultEntry {
  student: { _id: string; name: string; studentId: string };
  resultId: string | null;
  obtainedMarks: number | null;
  percentage: number | null;
  grade: string | null;
  status: "Pass" | "Fail" | null;
}

export interface ExamResultsResponse {
  exam: {
    _id: string;
    name: string;
    type: string;
    class: { _id: string; name: string } | null;
    subject: { _id: string; name: string } | null;
    date: string;
    maxMarks: number;
    passingMarks: number;
  };
  entries: ResultEntry[];
}
