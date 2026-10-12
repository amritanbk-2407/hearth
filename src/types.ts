// ---------------------------------------------------------------------------
// Hearth data model
// Every entity below maps to one "table" in the local database (see store/).
// Dates are stored as ISO strings: "YYYY-MM-DD" for calendar dates and full
// ISO timestamps for moments in time.
// ---------------------------------------------------------------------------

export type ID = string;

export type Role = 'admin' | 'member' | 'helper';

export interface Household {
  id: ID;
  name: string;
  inviteCode: string;
  createdAt: string;
}

export interface Member {
  id: ID;
  name: string;
  role: Role;
  color: string; // tailwind-friendly hex used for avatar
  joinedAt: string;
}

export type Priority = 'low' | 'medium' | 'high';
export type ChoreRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Chore {
  id: ID;
  title: string;
  room: string;
  assigneeId: ID | null;
  priority: Priority;
  effort: number; // 1 (quick) .. 5 (heavy) — used for fairness analysis
  recurrence: ChoreRecurrence;
  dueDate: string; // next occurrence (YYYY-MM-DD)
  active: boolean; // false once a one-time chore is done
  notes?: string;
  createdAt: string;
}

export interface ChoreCompletion {
  id: ID;
  choreId: ID;
  title: string; // snapshot so history survives deletes
  memberId: ID | null;
  effort: number;
  date: string; // day it was completed (YYYY-MM-DD)
  forDueDate: string; // the occurrence that was completed (used for undo)
  at: string;
}

export type BillCategory =
  | 'electricity'
  | 'water'
  | 'internet'
  | 'gas'
  | 'rent'
  | 'phone'
  | 'subscription'
  | 'other';

export type BillRecurrence = 'none' | 'monthly' | 'quarterly' | 'yearly';

export interface Bill {
  id: ID;
  name: string;
  category: BillCategory;
  amount: number;
  dueDate: string;
  recurrence: BillRecurrence;
  isPaid: boolean; // status of the current cycle
  paidOn?: string;
  autopay?: boolean;
  createdAt: string;
}

export type ExpenseCategory =
  | 'groceries'
  | 'utilities'
  | 'repairs'
  | 'household'
  | 'food'
  | 'transport'
  | 'other';

export interface Expense {
  id: ID;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  paidById: ID | null;
  billId?: ID;
}

export type StockCategory = 'kitchen' | 'cleaning' | 'toiletries' | 'other';

export interface StockItem {
  id: ID;
  name: string;
  category: StockCategory;
  quantity: number;
  capacity: number; // what "full" looks like, for the % left bar
  threshold: number; // low when quantity <= threshold
  unit: string;
  expiryDate?: string;
  location?: string;
  updatedAt: string;
}

export interface ShoppingItem {
  id: ID;
  name: string;
  quantity: number;
  unit: string;
  stockItemId?: ID;
  done: boolean;
  addedById: ID | null;
  addedAt: string;
}

export type AssetType = 'appliance' | 'electronics' | 'fixture' | 'vehicle';

export interface Asset {
  id: ID;
  name: string;
  type: AssetType;
  brand?: string;
  location?: string;
  purchaseDate?: string;
  warrantyUntil?: string;
  serviceIntervalDays?: number;
  lastServiced?: string;
}

export type FixUpKind = 'repair' | 'maintenance';
export type FixUpStatus = 'open' | 'scheduled' | 'done';

export interface FixUp {
  id: ID;
  title: string;
  kind: FixUpKind;
  status: FixUpStatus;
  priority: Priority;
  assetId?: ID;
  assigneeId?: ID | null;
  dueDate?: string;
  vendor?: string;
  cost?: number;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export type NoteColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple';

export interface Note {
  id: ID;
  title: string;
  body: string;
  color: NoteColor;
  pinned: boolean;
  authorId: ID | null;
  createdAt: string;
  updatedAt: string;
}

export type Module =
  | 'chores'
  | 'bills'
  | 'stock'
  | 'fixups'
  | 'household'
  | 'notes'
  | 'system';

export interface Activity {
  id: ID;
  at: string;
  memberId: ID | null;
  module: Module;
  message: string;
}

export interface ScoreSnapshot {
  date: string;
  score: number;
}

// ---------------------------------------------------------------------------
// Smart Hearth alerts are *derived* from the data above by the rules engine
// (logic/rules.ts). They are never stored — only dismissals are.
// ---------------------------------------------------------------------------

export type Severity = 'critical' | 'warning' | 'info' | 'tip';

export interface Alert {
  id: string; // stable: rule + entity + cycle, so dismissals stick per cycle
  rule: string;
  severity: Severity;
  module: Module;
  title: string;
  message: string;
  route: string;
  action?: { label: string; kind: 'addToShopping' | 'markBillPaid' | 'logService'; entityId: ID };
}

export interface HearthData {
  household: Household | null;
  members: Member[];
  chores: Chore[];
  completions: ChoreCompletion[];
  bills: Bill[];
  expenses: Expense[];
  stock: StockItem[];
  shopping: ShoppingItem[];
  assets: Asset[];
  fixups: FixUp[];
  notes: Note[];
  activity: Activity[];
  scoreHistory: ScoreSnapshot[];
  dismissedAlerts: string[];
  notifiedAlerts: string[];
  currentMemberId: ID | null;
  notificationsEnabled: boolean;
}
