import {
  BarChart3,
  Bot,
  CalendarDays,
  HeartHandshake,
  Layers,
  LayoutDashboard,
  Library,
  MonitorPlay,
  NotebookPen,
  ScanSearch,
  Settings,
  Stethoscope,
  UserRoundSearch,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  phase2?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analyze", label: "Analyze Question", icon: ScanSearch },
  { href: "/questions", label: "My Question Bank", icon: Library },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/videos", label: "Video Library", icon: MonitorPlay },
  { href: "/calendar", label: "Study Calendar", icon: CalendarDays },
  { href: "/cases", label: "Clinical Cases", icon: Stethoscope, phase2: true },
  { href: "/notebook", label: "My Medical Notebook", icon: NotebookPen },
  { href: "/analytics", label: "Performance Analytics", icon: BarChart3 },
  { href: "/tutor", label: "AI Tutor", icon: Bot, phase2: true },
  { href: "/mentors", label: "Find a Mentor", icon: UserRoundSearch },
  { href: "/wellbeing", label: "Mental Health", icon: HeartHandshake },
  { href: "/settings", label: "Settings", icon: Settings },
];
