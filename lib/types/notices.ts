export interface NoticeListItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  audience: string;
  date: string;
  status: "Draft" | "Published";
  createdBy: { _id: string; name: string } | null;
  createdAt: string;
}
