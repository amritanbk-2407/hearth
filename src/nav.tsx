import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardList,
  FileText,
  Home,
  IndianRupee,
  Package,
  Search,
  Settings,
  StickyNote,
  Users,
  Wrench,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { Tone } from './components/ui';

export interface NavItem {
  to: string;
  title: string; // module name from the proposal
  label: string; // plain-language label
  tone: Tone;
  icon: (size?: number) => ReactNode;
}

export const MODULES: NavItem[] = [
  { to: '/', title: 'House Pulse', label: 'Dashboard', tone: 'green', icon: (s = 20) => <Home size={s} /> },
  { to: '/chores', title: 'Daily Rhythm', label: 'Chores', tone: 'purple', icon: (s = 20) => <ClipboardList size={s} /> },
  { to: '/bills', title: 'Money Watch', label: 'Bills & expenses', tone: 'green', icon: (s = 20) => <IndianRupee size={s} /> },
  { to: '/stock', title: 'Pantry Pulse', label: 'Stock & shopping', tone: 'amber', icon: (s = 20) => <Package size={s} /> },
  { to: '/fixups', title: 'Home Care', label: 'Fix-ups & maintenance', tone: 'blue', icon: (s = 20) => <Wrench size={s} /> },
  { to: '/household', title: 'Household', label: 'Members & roles', tone: 'rose', icon: (s = 20) => <Users size={s} /> },
  { to: '/alerts', title: 'Smart Hearth', label: 'Alerts & suggestions', tone: 'purple', icon: (s = 20) => <Bell size={s} /> },
  { to: '/calendar', title: 'Calendar', label: 'Everything by date', tone: 'teal', icon: (s = 20) => <CalendarDays size={s} /> },
  { to: '/insights', title: 'Insights', label: 'Analytics & fairness', tone: 'blue', icon: (s = 20) => <BarChart3 size={s} /> },
  { to: '/reports', title: 'Reports', label: 'Monthly household report', tone: 'slate', icon: (s = 20) => <FileText size={s} /> },
  { to: '/notes', title: 'Notes', label: 'Shared notes', tone: 'amber', icon: (s = 20) => <StickyNote size={s} /> },
  { to: '/activity', title: 'Activity', label: 'Who did what', tone: 'slate', icon: (s = 20) => <Activity size={s} /> },
  { to: '/search', title: 'Search', label: 'Find anything', tone: 'slate', icon: (s = 20) => <Search size={s} /> },
  { to: '/settings', title: 'Settings', label: 'Profile, reminders, data', tone: 'slate', icon: (s = 20) => <Settings size={s} /> },
];

export const moduleFor = (path: string) =>
  MODULES.find((m) => (m.to === '/' ? path === '/' : path.startsWith(m.to)));
