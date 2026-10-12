import { shiftDays, todayISO } from '../lib/dates';
import type {
  Activity,
  Asset,
  Bill,
  Chore,
  ChoreCompletion,
  Expense,
  FixUp,
  HearthData,
  Member,
  Note,
  ShoppingItem,
  StockItem,
} from '../types';

/**
 * Demo household used for presentations. All dates are generated relative to
 * "today" so the demo always looks current, whatever day it is opened.
 */
export function buildDemoData(today: string = todayISO()): HearthData {
  const d = (n: number) => shiftDays(today, n);
  const ts = (n: number, h = 9, m = 0) =>
    `${d(n)}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

  const members: Member[] = [
    { id: 'm-amrita', name: 'Amrita', role: 'admin', color: '#7c5cfc', joinedAt: ts(-120) },
    { id: 'm-rohan', name: 'Rohan', role: 'member', color: '#0ea5e9', joinedAt: ts(-118) },
    { id: 'm-priya', name: 'Priya', role: 'member', color: '#f43f5e', joinedAt: ts(-110) },
    { id: 'm-lakshmi', name: 'Lakshmi', role: 'helper', color: '#f59e0b', joinedAt: ts(-90) },
  ];

  const chore = (
    id: string,
    title: string,
    room: string,
    assigneeId: string,
    priority: Chore['priority'],
    effort: number,
    recurrence: Chore['recurrence'],
    dueDate: string,
  ): Chore => ({
    id,
    title,
    room,
    assigneeId,
    priority,
    effort,
    recurrence,
    dueDate,
    active: true,
    createdAt: ts(-60),
  });

  const chores: Chore[] = [
    // pending today / overdue
    chore('c-kitchen', 'Clean Kitchen', 'Kitchen', 'm-amrita', 'high', 3, 'daily', d(0)),
    chore('c-laundry', 'Laundry', 'Utility', 'm-priya', 'medium', 3, 'weekly', d(0)),
    chore('c-fridge', 'Clean the fridge', 'Kitchen', 'm-rohan', 'medium', 3, 'monthly', d(-2)),
    // done today (next occurrence is in the future)
    chore('c-plants', 'Water Plants', 'Balcony', 'm-rohan', 'low', 1, 'daily', d(1)),
    chore('c-trash', 'Take out trash', 'Kitchen', 'm-rohan', 'medium', 1, 'daily', d(1)),
    chore('c-mop', 'Mop floors', 'Whole house', 'm-lakshmi', 'medium', 2, 'daily', d(1)),
    chore('c-table', 'Wipe dining table', 'Dining', 'm-amrita', 'low', 1, 'daily', d(1)),
    chore('c-bottles', 'Fill water bottles', 'Kitchen', 'm-priya', 'low', 1, 'daily', d(1)),
    // upcoming
    chore('c-vacuum', 'Vacuum living room', 'Living room', 'm-priya', 'medium', 3, 'weekly', d(2)),
    chore('c-bath', 'Clean bathrooms', 'Bathrooms', 'm-amrita', 'high', 4, 'weekly', d(3)),
    chore('c-grocery', 'Weekly grocery run', 'Outside', 'm-amrita', 'medium', 3, 'weekly', d(4)),
    chore('c-sheets', 'Change bedsheets', 'Bedrooms', 'm-priya', 'low', 2, 'weekly', d(5)),
    chore('c-fans', 'Dust ceiling fans', 'Whole house', 'm-rohan', 'low', 2, 'monthly', d(12)),
  ];

  // ---- completion history (drives streak, fairness and insights) ----------
  const completions: ChoreCompletion[] = [];
  const done = (choreId: string, title: string, memberId: string, effort: number, day: number, hour = 10) =>
    completions.push({
      id: `cc-${choreId}-${day}`,
      choreId,
      title,
      memberId,
      effort,
      date: d(day),
      forDueDate: d(day),
      at: ts(day, hour),
    });

  for (let i = 1; i <= 24; i++) {
    const day = -i;
    done('c-kitchen', 'Clean Kitchen', 'm-amrita', 3, day, 21);
    done('c-plants', 'Water Plants', 'm-rohan', 1, day, 8);
    if (i % 4 !== 0) done('c-trash', 'Take out trash', 'm-rohan', 1, day, 22);
    done('c-mop', 'Mop floors', 'm-lakshmi', 2, day, 11);
    if (i % 2 === 0) done('c-table', 'Wipe dining table', 'm-amrita', 1, day, 14);
    if (i % 3 === 0) done('c-bottles', 'Fill water bottles', 'm-priya', 1, day, 19);
    if (i % 7 === 0) {
      done('c-laundry', 'Laundry', 'm-priya', 3, day, 17);
      done('c-vacuum', 'Vacuum living room', 'm-priya', 3, day, 16);
      done('c-bath', 'Clean bathrooms', 'm-amrita', 4, day, 12);
      done('c-grocery', 'Weekly grocery run', 'm-amrita', 3, day, 18);
      done('c-sheets', 'Change bedsheets', 'm-priya', 2, day, 10);
    }
  }
  // today
  done('c-plants', 'Water Plants', 'm-rohan', 1, 0, 8);
  done('c-trash', 'Take out trash', 'm-rohan', 1, 0, 8);
  done('c-mop', 'Mop floors', 'm-lakshmi', 2, 0, 10);
  done('c-table', 'Wipe dining table', 'm-amrita', 1, 0, 9);
  done('c-bottles', 'Fill water bottles', 'm-priya', 1, 0, 9);
  // today's completions point at today's occurrence
  for (const c of completions) if (c.date === today) c.forDueDate = today;

  // ---- bills ---------------------------------------------------------------
  const bill = (
    id: string,
    name: string,
    category: Bill['category'],
    amount: number,
    dueDate: string,
    recurrence: Bill['recurrence'],
    isPaid: boolean,
    autopay = false,
  ): Bill => ({
    id,
    name,
    category,
    amount,
    dueDate,
    recurrence,
    isPaid,
    paidOn: isPaid ? d(-2) : undefined,
    autopay,
    createdAt: ts(-100),
  });

  const bills: Bill[] = [
    bill('b-elec', 'Electricity Bill', 'electricity', 1240, d(1), 'monthly', false),
    bill('b-water', 'Water Bill', 'water', 650, d(5), 'quarterly', false),
    bill('b-net', 'Internet Bill', 'internet', 749, d(10), 'monthly', true, true),
    bill('b-mobile', 'Mobile Postpaid', 'phone', 399, d(6), 'monthly', false, true),
    bill('b-rent', 'House Rent', 'rent', 18000, d(19), 'monthly', false),
    bill('b-ott', 'OTT Subscription', 'subscription', 199, d(12), 'monthly', true, true),
    bill('b-gas', 'Piped Gas', 'gas', 540, d(22), 'monthly', false),
    bill('b-society', 'Society Maintenance', 'other', 2500, d(-3), 'quarterly', false),
  ];

  // ---- expenses (this month + last 5 months for insights) -----------------
  const expenses: Expense[] = [];
  let ex = 0;
  const spend = (title: string, amount: number, category: Expense['category'], day: number, who = 'm-amrita') =>
    expenses.push({ id: `e-${++ex}`, title, amount, category, date: d(day), paidById: who });

  const monthly: Array<[string, number, Expense['category']]> = [
    ['House Rent', 18000, 'utilities'],
    ['Electricity Bill', 1180, 'utilities'],
    ['Internet Bill', 749, 'utilities'],
  ];
  for (let m = 1; m <= 5; m++) {
    const base = -m * 30;
    monthly.forEach(([t, a, c], i) => spend(t, a + (i === 1 ? m * 35 : 0), c, base - i));
    spend('Monthly groceries — DMart', 5200 + m * 180, 'groceries', base - 4, 'm-amrita');
    spend('Vegetables & fruits', 1400 + m * 60, 'groceries', base - 10, 'm-priya');
    spend('Weekend dinner', 1100 + (m % 2) * 400, 'food', base - 7, 'm-rohan');
    spend('Auto & metro', 900, 'transport', base - 12, 'm-rohan');
    spend('Cleaning supplies', 650, 'household', base - 15, 'm-priya');
  }
  // this month — groceries noticeably higher (triggers the spending-spike rule)
  spend('Monthly groceries — DMart', 7900, 'groceries', -6, 'm-amrita');
  spend('Vegetables & fruits', 1850, 'groceries', -3, 'm-priya');
  spend('Internet Bill', 749, 'utilities', -2, 'm-rohan');
  spend('OTT Subscription', 199, 'utilities', -2, 'm-rohan');
  spend('Plumber visit — bathroom', 450, 'repairs', -8, 'm-amrita');
  spend('Pizza night', 980, 'food', -4, 'm-priya');
  spend('Cab to station', 320, 'transport', -1, 'm-rohan');

  // ---- stock ---------------------------------------------------------------
  const item = (
    id: string,
    name: string,
    category: StockItem['category'],
    quantity: number,
    capacity: number,
    threshold: number,
    unit: string,
    expiryDate?: string,
    location = 'Kitchen',
  ): StockItem => ({ id, name, category, quantity, capacity, threshold, unit, expiryDate, location, updatedAt: ts(-1) });

  const stock: StockItem[] = [
    item('s-detergent', 'Detergent', 'cleaning', 0.4, 2, 0.5, 'kg', undefined, 'Utility'),
    item('s-rice', 'Rice', 'kitchen', 1.5, 10, 2, 'kg'),
    item('s-tp', 'Toilet Paper', 'toiletries', 3, 10, 3, 'rolls', undefined, 'Bathroom'),
    item('s-milk', 'Milk', 'kitchen', 2, 4, 1, 'L', d(6), 'Fridge'),
    item('s-curd', 'Curd', 'kitchen', 1, 2, 0, 'cups', d(8), 'Fridge'),
    item('s-bread', 'Bread', 'kitchen', 1, 2, 0, 'packs', d(2), 'Kitchen'),
    item('s-eggs', 'Eggs', 'kitchen', 10, 30, 6, 'pcs', d(9), 'Fridge'),
    item('s-atta', 'Wheat Atta', 'kitchen', 6, 10, 2, 'kg'),
    item('s-oil', 'Cooking Oil', 'kitchen', 3, 5, 1, 'L'),
    item('s-sugar', 'Sugar', 'kitchen', 2, 3, 0.5, 'kg'),
    item('s-tea', 'Tea Powder', 'kitchen', 0.5, 1, 0.2, 'kg'),
    item('s-dal', 'Toor Dal', 'kitchen', 2, 4, 0.5, 'kg'),
    item('s-dish', 'Dishwash Liquid', 'cleaning', 2, 3, 1, 'bottles'),
    item('s-floor', 'Floor Cleaner', 'cleaning', 1, 2, 0.5, 'L', undefined, 'Utility'),
    item('s-paste', 'Toothpaste', 'toiletries', 2, 4, 1, 'tubes', undefined, 'Bathroom'),
    item('s-soap', 'Bath Soap', 'toiletries', 5, 8, 2, 'bars', undefined, 'Bathroom'),
  ];

  const shopping: ShoppingItem[] = [
    { id: 'sh-1', name: 'Rice', quantity: 10, unit: 'kg', stockItemId: 's-rice', done: false, addedById: 'm-amrita', addedAt: ts(-1) },
    { id: 'sh-2', name: 'Tomatoes', quantity: 1, unit: 'kg', done: false, addedById: 'm-priya', addedAt: ts(-1) },
    { id: 'sh-3', name: 'Onions', quantity: 2, unit: 'kg', done: false, addedById: 'm-priya', addedAt: ts(-1) },
    { id: 'sh-4', name: 'Bananas', quantity: 12, unit: 'pcs', done: false, addedById: 'm-rohan', addedAt: ts(0, 8) },
    { id: 'sh-5', name: 'Butter', quantity: 1, unit: 'pack', done: true, addedById: 'm-amrita', addedAt: ts(-3) },
  ];

  // ---- home care -----------------------------------------------------------
  const assets: Asset[] = [
    { id: 'a-ac', name: 'Bedroom AC', type: 'appliance', brand: 'Voltas 1.5T', location: 'Master bedroom', purchaseDate: d(-700), warrantyUntil: d(395), serviceIntervalDays: 90, lastServiced: d(-89) },
    { id: 'a-wm', name: 'Washing Machine', type: 'appliance', brand: 'LG 7kg', location: 'Utility', purchaseDate: d(-900), warrantyUntil: d(-170), serviceIntervalDays: 180, lastServiced: d(-60) },
    { id: 'a-ro', name: 'Water Purifier', type: 'appliance', brand: 'Kent RO', location: 'Kitchen', purchaseDate: d(-500), warrantyUntil: d(230), serviceIntervalDays: 120, lastServiced: d(-125) },
    { id: 'a-fridge', name: 'Refrigerator', type: 'appliance', brand: 'Samsung 253L', location: 'Kitchen', purchaseDate: d(-345), warrantyUntil: d(20), serviceIntervalDays: 365, lastServiced: d(-200) },
    { id: 'a-geyser', name: 'Geyser', type: 'fixture', brand: 'Bajaj 15L', location: 'Bathroom', purchaseDate: d(-1100), serviceIntervalDays: 365, lastServiced: d(-150) },
    { id: 'a-inverter', name: 'Inverter Battery', type: 'electronics', brand: 'Luminous', location: 'Hall', purchaseDate: d(-600), warrantyUntil: d(500), serviceIntervalDays: 90, lastServiced: d(-40) },
    { id: 'a-scooter', name: 'Scooter', type: 'vehicle', brand: 'Honda Activa', location: 'Parking', purchaseDate: d(-800), serviceIntervalDays: 120, lastServiced: d(-70) },
  ];

  const fixups: FixUp[] = [
    { id: 'f-ac', title: 'AC Service', kind: 'maintenance', status: 'scheduled', priority: 'medium', assetId: 'a-ac', assigneeId: 'm-rohan', dueDate: d(1), vendor: 'CoolCare Services', createdAt: ts(-5) },
    { id: 'f-tap', title: 'Kitchen Tap Leak', kind: 'repair', status: 'open', priority: 'high', assigneeId: 'm-rohan', dueDate: d(3), vendor: 'Plumber — Suresh', createdAt: ts(-4), notes: 'Drips from the base, needs a new washer.' },
    { id: 'f-switch', title: 'Loose switchboard in bedroom', kind: 'repair', status: 'open', priority: 'medium', assigneeId: null, createdAt: ts(-10) },
    { id: 'f-paint', title: 'Balcony wall repainting', kind: 'repair', status: 'scheduled', priority: 'low', assigneeId: 'm-amrita', dueDate: d(16), vendor: 'Asian Paints partner', cost: 4500, createdAt: ts(-2) },
    // history
    { id: 'f-h1', title: 'Washing machine service', kind: 'maintenance', status: 'done', priority: 'medium', assetId: 'a-wm', cost: 600, vendor: 'LG Service', createdAt: ts(-62), completedAt: ts(-60) },
    { id: 'f-h2', title: 'Fan regulator replaced', kind: 'repair', status: 'done', priority: 'low', cost: 350, vendor: 'Electrician — Ramesh', createdAt: ts(-16), completedAt: ts(-15) },
    { id: 'f-h3', title: 'Bathroom tile regrouting', kind: 'repair', status: 'done', priority: 'medium', cost: 1500, vendor: 'Plumber — Suresh', createdAt: ts(-34), completedAt: ts(-30) },
    { id: 'f-h4', title: 'Inverter battery top-up', kind: 'maintenance', status: 'done', priority: 'low', assetId: 'a-inverter', cost: 200, createdAt: ts(-40), completedAt: ts(-40) },
    { id: 'f-h5', title: 'Scooter service', kind: 'maintenance', status: 'done', priority: 'medium', assetId: 'a-scooter', cost: 850, vendor: 'Honda service centre', createdAt: ts(-70), completedAt: ts(-70) },
  ];

  const notes: Note[] = [
    { id: 'n-1', title: 'Important contacts', body: 'Plumber — Suresh\nElectrician — Ramesh\nGas agency — call before the 20th\nSociety office — Ground floor, 10am–6pm', color: 'yellow', pinned: true, authorId: 'm-amrita', createdAt: ts(-30), updatedAt: ts(-2) },
    { id: 'n-2', title: 'Guests on Saturday', body: '• Order sweets\n• Clean guest room\n• Extra milk & curd\n• Book cab for pickup', color: 'pink', pinned: true, authorId: 'm-priya', createdAt: ts(-1), updatedAt: ts(-1) },
    { id: 'n-3', title: 'Monthly budget', body: 'Target: ₹32,000 including rent.\nKeep groceries under ₹7,000.', color: 'green', pinned: false, authorId: 'm-amrita', createdAt: ts(-20), updatedAt: ts(-6) },
    { id: 'n-4', title: 'Wi-Fi', body: 'Network: Hearth_302\nPassword is on the router sticker.', color: 'blue', pinned: false, authorId: 'm-rohan', createdAt: ts(-50), updatedAt: ts(-50) },
  ];

  const activity: Activity[] = [
    { id: 'ac-1', at: ts(0, 10), memberId: 'm-lakshmi', module: 'chores', message: 'completed “Mop floors”' },
    { id: 'ac-2', at: ts(0, 9, 30), memberId: 'm-priya', module: 'chores', message: 'completed “Fill water bottles”' },
    { id: 'ac-3', at: ts(0, 9), memberId: 'm-amrita', module: 'chores', message: 'completed “Wipe dining table”' },
    { id: 'ac-4', at: ts(0, 8, 15), memberId: 'm-rohan', module: 'stock', message: 'added Bananas to the shopping list' },
    { id: 'ac-5', at: ts(0, 8), memberId: 'm-rohan', module: 'chores', message: 'completed “Water Plants”' },
    { id: 'ac-6', at: ts(-1, 20), memberId: 'm-priya', module: 'notes', message: 'created note “Guests on Saturday”' },
    { id: 'ac-7', at: ts(-1, 18), memberId: 'm-amrita', module: 'stock', message: 'added Rice to the shopping list' },
    { id: 'ac-8', at: ts(-2, 12), memberId: 'm-rohan', module: 'bills', message: 'paid Internet Bill (₹749)' },
    { id: 'ac-9', at: ts(-2, 11), memberId: 'm-amrita', module: 'fixups', message: 'scheduled “Balcony wall repainting”' },
    { id: 'ac-10', at: ts(-4, 19), memberId: 'm-rohan', module: 'fixups', message: 'reported “Kitchen Tap Leak”' },
    { id: 'ac-11', at: ts(-5, 10), memberId: 'm-rohan', module: 'fixups', message: 'booked “AC Service” with CoolCare Services' },
    { id: 'ac-12', at: ts(-6, 17), memberId: 'm-amrita', module: 'bills', message: 'logged expense Monthly groceries — DMart (₹7,900)' },
  ];

  const trend = [74, 78, 81, 76, 72, 79, 83, 85, 80, 77, 82, 86, 84];
  const scoreHistory = trend.map((score, i) => ({ date: d(i - trend.length), score }));

  return {
    household: { id: 'h-1', name: 'Flat 302, Palm Residency', inviteCode: 'HRTH-302', createdAt: ts(-120) },
    members,
    chores,
    completions,
    bills,
    expenses,
    stock,
    shopping,
    assets,
    fixups,
    notes,
    activity,
    scoreHistory,
    dismissedAlerts: [],
    notifiedAlerts: [],
    currentMemberId: 'm-amrita',
    notificationsEnabled: false,
  };
}

export function emptyData(): HearthData {
  return {
    household: null,
    members: [],
    chores: [],
    completions: [],
    bills: [],
    expenses: [],
    stock: [],
    shopping: [],
    assets: [],
    fixups: [],
    notes: [],
    activity: [],
    scoreHistory: [],
    dismissedAlerts: [],
    notifiedAlerts: [],
    currentMemberId: null,
    notificationsEnabled: false,
  };
}
