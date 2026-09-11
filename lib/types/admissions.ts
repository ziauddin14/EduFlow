export interface AdmissionListItem {
  _id: string;
  applicantName: string;
  guardianName: string;
  contact: string;
  desiredClass: { _id: string; name: string } | null;
  applicationDate: string;
  status: "New" | "Under Review" | "Approved" | "Rejected";
  notes: string;
}

export interface AdmissionDetail extends Omit<AdmissionListItem, "desiredClass"> {
  desiredClass: { _id: string; name: string; sections: string[] } | null;
}
