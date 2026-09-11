import type { Role } from "@/types";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardList,
  CalendarCheck,
  Wallet,
  BookOpen,
  FileText,
  CalendarDays,
  Megaphone,
  BarChart3,
  Sparkles,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Teachers & Staff", href: "/teachers", icon: GraduationCap },
  { label: "Admissions", href: "/admissions", icon: ClipboardList },
  { label: "Attendance", href: "/attendance", icon: CalendarCheck },
  { label: "Fees", href: "/fees", icon: Wallet },
  { label: "Classes & Subjects", href: "/academics", icon: BookOpen },
  { label: "Exams & Results", href: "/exams", icon: FileText },
  { label: "Timetable", href: "/academics/timetable", icon: CalendarDays },
  { label: "Notices", href: "/notices", icon: Megaphone },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "AI Assistant", href: "/ai-assistant", icon: Sparkles },
];

/**
 * Static role -> visible nav items map. Deliberately simple (no dynamic
 * permission engine) per the MVP spec's "avoid unnecessary complex RBAC"
 * instruction. Server-side route handlers are the real enforcement point;
 * this only controls what each role sees in the sidebar.
 */
const ROLE_NAV: Record<Role, string[]> = {
  ADMIN: NAV_ITEMS.map((item) => item.href),
  TEACHER: ["/dashboard", "/attendance", "/exams", "/timetable", "/ai-assistant"],
  STAFF: ["/dashboard", "/students", "/admissions", "/notices"],
};

export function getNavItemsForRole(role: Role): NavItem[] {
  const allowed = new Set(ROLE_NAV[role]);
  return NAV_ITEMS.filter((item) => allowed.has(item.href));
}
