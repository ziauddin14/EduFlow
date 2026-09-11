export interface ClassListItem {
  _id: string;
  name: string;
  sections: string[];
  classTeacher: { _id: string; name: string } | null;
  studentCount: number;
  subjectCount: number;
  teacherCount: number;
}

export interface SubjectListItem {
  _id: string;
  name: string;
  code: string;
  class: { _id: string; name: string } | null;
  teacher: { _id: string; name: string } | null;
  status: "Active" | "Inactive";
}

export interface TeacherOption {
  _id: string;
  name: string;
  designation: string;
}
