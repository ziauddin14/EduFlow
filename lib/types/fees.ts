export interface FeeListItem {
  _id: string;
  student: { _id: string; name: string; studentId: string; class: { _id: string; name: string } | null } | null;
  title: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: "Paid" | "Partial" | "Pending" | "Overdue";
  notes: string;
  payments: { amount: number; date: string; method: string }[];
}

export interface FeeSummary {
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  recordCount: number;
  collectedPercentage: number;
}
