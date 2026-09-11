export interface TeacherListItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  subjects: { _id: string; name: string; code: string }[];
  classes: { _id: string; name: string }[];
  joiningDate: string;
  status: "Active" | "Inactive";
}

export interface StaffListItem {
  _id: string;
  name: string;
  email: string;
  status: "Active" | "Inactive";
}
