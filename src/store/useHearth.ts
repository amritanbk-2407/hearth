import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { buildDemoData, emptyData } from '../data/seed';
import { nextOccurrence, todayISO } from '../lib/dates';
import { rupees, uid } from '../lib/format';
import { computeHealthScore } from '../logic/score';
import type {
  Alert,
  Asset,
  Bill,
  Chore,
  Expense,
  ExpenseCategory,
  FixUp,
  HearthData,
  Member,
  Module,
  Note,
  ShoppingItem,
  StockItem,
} from '../types';

/**
 * Hearth local database
 * ---------------------
 * A single Zustand store persisted to the device (localStorage) under the key
 * `hearth-db`. Each array in HearthData is one "table". All writes go through
 * the actions below, which also append to the activity log so every change is
 * traceable ("who did what, when").
 */

type New<T> = Omit<T, 'id'>;

export interface HearthActions {
  // setup
  loadDemo: () => void;
  createHousehold: (householdName: string, yourName: string) => void;
  resetAll: () => void;
  refresh: () => void;
  setCurrentMember: (id: string) => void;

  // chores
  addChore: (c: Omit<Chore, 'id' | 'createdAt' | 'active'>) => void;
  updateChore: (id: string, patch: Partial<Chore>) => void;
  deleteChore: (id: string) => void;
  completeChore: (id: string) => void;
  undoCompletion: (completionId: string) => void;

  // bills & expenses
  addBill: (b: Omit<Bill, 'id' | 'createdAt' | 'isPaid'>) => void;
  updateBill: (id: string, patch: Partial<Bill>) => void;
  deleteBill: (id: string) => void;
  markBillPaid: (id: string) => void;
  markBillUnpaid: (id: string) => void;
  addExpense: (e: New<Expense>) => void;
  deleteExpense: (id: string) => void;

  // stock & shopping
  addStock: (s: Omit<StockItem, 'id' | 'updatedAt'>) => void;
  updateStock: (id: string, patch: Partial<StockItem>) => void;
  deleteStock: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  addStockToShopping: (stockId: string) => void;
  addLowStockToShopping: () => number;
  addShoppingItem: (i: Pick<ShoppingItem, 'name' | 'quantity' | 'unit'>) => void;
  toggleShopping: (id: string) => void;
  deleteShopping: (id: string) => void;
  clearBoughtShopping: () => void;

  // home care
  addAsset: (a: New<Asset>) => void;
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  logService: (assetId: string, cost?: number) => void;
  addFixUp: (f: Omit<FixUp, 'id' | 'createdAt'>) => void;
  updateFixUp: (id: string, patch: Partial<FixUp>) => void;
  deleteFixUp: (id: string) => void;
  completeFixUp: (id: string, cost?: number) => void;

  // household
  addMember: (m: Pick<Member, 'name' | 'role'>) => void;
  updateMember: (id: string, patch: Partial<Member>) => void;
  removeMember: (id: string) => void;

  // notes
  addNote: (n: Pick<Note, 'title' | 'body' | 'color'>) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // smart hearth
  dismissAlert: (id: string) => void;
  restoreAlerts: () => void;
  runAlertAction: (a: Alert) => void;
  markNotified: (ids: string[]) => void;
  setNotificationsEnabled: (on: boolean) => void;
}

export type HearthState = HearthData & HearthActions;

const AVATAR_COLORS = ['#7c5cfc', '#0ea5e9', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6'];

/** Every bill payment is recorded as a "utilities" expense (rent, power, internet, …). */
const BILL_EXPENSE_CATEGORY: ExpenseCategory = 'utilities';

export const useHearth = create<HearthState>()(
  persist(
    (set, get) => {
      /** Append an activity entry for the current member. */
      const log = (module: Module, message: string) => {
        const s = get();
        set({
          activity: [
            { id: uid(), at: new Date().toISOString(), memberId: s.currentMemberId, module, message },
            ...s.activity,
          ].slice(0, 300),
        });
      };

      return {
        ...emptyData(),

        // ------------------------------------------------------------ setup
        loadDemo: () => {
          set({ ...buildDemoData() });
          get().refresh();
        },

        createHousehold: (householdName, yourName) => {
          const me: Member = {
            id: uid(),
            name: yourName.trim(),
            role: 'admin',
            color: AVATAR_COLORS[0]!,
            joinedAt: new Date().toISOString(),
          };
          set({
            ...emptyData(),
            household: {
              id: uid(),
              name: householdName.trim(),
              inviteCode: `HRTH-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
              createdAt: new Date().toISOString(),
            },
            members: [me],
            currentMemberId: me.id,
          });
          log('household', `created the household “${householdName.trim()}”`);
          get().refresh();
        },

        resetAll: () => set({ ...emptyData() }),

        /**
         * Daily housekeeping, run on app start:
         *  - rolls paid recurring bills into their next cycle once due date passes
         *  - records today's House Health Score for the trend chart
         */
        refresh: () => {
          const today = todayISO();
          const s = get();
          if (!s.household) return;
          const bills = s.bills.map((b) => {
            if (!b.isPaid || b.recurrence === 'none' || b.dueDate >= today) return b;
            let due = b.dueDate;
            while (due < today) due = nextOccurrence(due, b.recurrence);
            return { ...b, dueDate: due, isPaid: false, paidOn: undefined };
          });
          set({ bills });
          const { score } = computeHealthScore(get(), today);
          const history = get().scoreHistory.filter((h) => h.date !== today);
          set({ scoreHistory: [...history, { date: today, score }].slice(-60) });
        },

        setCurrentMember: (id) => set({ currentMemberId: id }),

        // ----------------------------------------------------------- chores
        addChore: (c) => {
          set((s) => ({ chores: [...s.chores, { ...c, id: uid(), active: true, createdAt: new Date().toISOString() }] }));
          log('chores', `added chore “${c.title}”`);
        },
        updateChore: (id, patch) => set((s) => ({ chores: s.chores.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
        deleteChore: (id) => {
          const c = get().chores.find((x) => x.id === id);
          set((s) => ({ chores: s.chores.filter((x) => x.id !== id) }));
          if (c) log('chores', `deleted chore “${c.title}”`);
        },
        completeChore: (id) => {
          const s = get();
          const c = s.chores.find((x) => x.id === id);
          if (!c) return;
          const today = todayISO();
          const completion = {
            id: uid(),
            choreId: c.id,
            title: c.title,
            memberId: s.currentMemberId ?? c.assigneeId,
            effort: c.effort,
            date: today,
            forDueDate: c.dueDate,
            at: new Date().toISOString(),
          };
          let nextDue = c.dueDate;
          if (c.recurrence !== 'none') {
            nextDue = nextOccurrence(c.dueDate, c.recurrence);
            while (nextDue <= today) nextDue = nextOccurrence(nextDue, c.recurrence);
          }
          set({
            completions: [...s.completions, completion],
            chores: s.chores.map((x) =>
              x.id === id ? { ...x, dueDate: nextDue, active: c.recurrence !== 'none' } : x,
            ),
          });
          log('chores', `completed “${c.title}”`);
        },
        undoCompletion: (completionId) => {
          const s = get();
          const comp = s.completions.find((x) => x.id === completionId);
          if (!comp) return;
          set({
            completions: s.completions.filter((x) => x.id !== completionId),
            chores: s.chores.map((c) => (c.id === comp.choreId ? { ...c, dueDate: comp.forDueDate, active: true } : c)),
          });
          log('chores', `marked “${comp.title}” as not done`);
        },

        // ------------------------------------------------- bills & expenses
        addBill: (b) => {
          set((s) => ({ bills: [...s.bills, { ...b, id: uid(), isPaid: false, createdAt: new Date().toISOString() }] }));
          log('bills', `added bill “${b.name}” (${rupees(b.amount)})`);
        },
        updateBill: (id, patch) => set((s) => ({ bills: s.bills.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
        deleteBill: (id) => {
          const b = get().bills.find((x) => x.id === id);
          set((s) => ({ bills: s.bills.filter((x) => x.id !== id) }));
          if (b) log('bills', `deleted bill “${b.name}”`);
        },
        markBillPaid: (id) => {
          const s = get();
          const b = s.bills.find((x) => x.id === id);
          if (!b || b.isPaid) return;
          const today = todayISO();
          const expense: Expense = {
            id: uid(),
            title: b.name,
            amount: b.amount,
            category: BILL_EXPENSE_CATEGORY,
            date: today,
            paidById: s.currentMemberId,
            billId: b.id,
          };
          // overdue recurring bills roll straight to the next cycle
          let patch: Partial<Bill> = { isPaid: true, paidOn: today };
          if (b.recurrence !== 'none' && b.dueDate < today) {
            let due = nextOccurrence(b.dueDate, b.recurrence);
            while (due < today) due = nextOccurrence(due, b.recurrence);
            patch = { isPaid: false, paidOn: today, dueDate: due };
          }
          set({
            bills: s.bills.map((x) => (x.id === id ? { ...x, ...patch } : x)),
            expenses: [expense, ...s.expenses],
          });
          log('bills', `paid ${b.name} (${rupees(b.amount)})`);
        },
        markBillUnpaid: (id) => {
          const s = get();
          const b = s.bills.find((x) => x.id === id);
          if (!b) return;
          // remove the most recent expense created by paying this bill
          const idx = s.expenses.findIndex((e) => e.billId === id);
          set({
            bills: s.bills.map((x) => (x.id === id ? { ...x, isPaid: false, paidOn: undefined } : x)),
            expenses: idx >= 0 ? s.expenses.filter((_, i) => i !== idx) : s.expenses,
          });
          log('bills', `marked ${b.name} as unpaid`);
        },
        addExpense: (e) => {
          set((s) => ({ expenses: [{ ...e, id: uid() }, ...s.expenses] }));
          log('bills', `logged expense ${e.title} (${rupees(e.amount)})`);
        },
        deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

        // ------------------------------------------------ stock & shopping
        addStock: (item) => {
          set((s) => ({ stock: [...s.stock, { ...item, id: uid(), updatedAt: new Date().toISOString() }] }));
          log('stock', `added ${item.name} to stock`);
        },
        updateStock: (id, patch) =>
          set((s) => ({
            stock: s.stock.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x)),
          })),
        deleteStock: (id) => {
          const it = get().stock.find((x) => x.id === id);
          set((s) => ({ stock: s.stock.filter((x) => x.id !== id) }));
          if (it) log('stock', `removed ${it.name} from stock`);
        },
        adjustStock: (id, delta) =>
          set((s) => ({
            stock: s.stock.map((x) =>
              x.id === id
                ? {
                    ...x,
                    quantity: Math.max(0, Math.round((x.quantity + delta) * 100) / 100),
                    updatedAt: new Date().toISOString(),
                  }
                : x,
            ),
          })),
        addStockToShopping: (stockId) => {
          const s = get();
          const it = s.stock.find((x) => x.id === stockId);
          if (!it || s.shopping.some((i) => !i.done && i.stockItemId === stockId)) return;
          const qty = Math.max(1, Math.round((it.capacity - it.quantity) * 100) / 100);
          set({
            shopping: [
              {
                id: uid(),
                name: it.name,
                quantity: qty,
                unit: it.unit,
                stockItemId: it.id,
                done: false,
                addedById: s.currentMemberId,
                addedAt: new Date().toISOString(),
              },
              ...s.shopping,
            ],
          });
          log('stock', `added ${it.name} to the shopping list`);
        },
        addLowStockToShopping: () => {
          const s = get();
          const low = s.stock.filter(
            (x) => x.quantity <= x.threshold && !s.shopping.some((i) => !i.done && i.stockItemId === x.id),
          );
          low.forEach((x) => get().addStockToShopping(x.id));
          return low.length;
        },
        addShoppingItem: (i) => {
          set((s) => ({
            shopping: [
              { ...i, id: uid(), done: false, addedById: s.currentMemberId, addedAt: new Date().toISOString() },
              ...s.shopping,
            ],
          }));
          log('stock', `added ${i.name} to the shopping list`);
        },
        /** Ticking off a linked item restocks it automatically. */
        toggleShopping: (id) => {
          const s = get();
          const item = s.shopping.find((x) => x.id === id);
          if (!item) return;
          const nowDone = !item.done;
          let stock = s.stock;
          if (item.stockItemId) {
            const sign = nowDone ? 1 : -1;
            stock = s.stock.map((x) =>
              x.id === item.stockItemId
                ? (() => {
                    const quantity = Math.max(0, Math.round((x.quantity + sign * item.quantity) * 100) / 100);
                    // a bigger pack than usual raises what "full" means for this item
                    return { ...x, quantity, capacity: Math.max(x.capacity, quantity), updatedAt: new Date().toISOString() };
                  })()
                : x,
            );
          }
          set({ shopping: s.shopping.map((x) => (x.id === id ? { ...x, done: nowDone } : x)), stock });
          if (nowDone) log('stock', `bought ${item.name}${item.stockItemId ? ' — stock updated' : ''}`);
        },
        deleteShopping: (id) => set((s) => ({ shopping: s.shopping.filter((x) => x.id !== id) })),
        clearBoughtShopping: () => set((s) => ({ shopping: s.shopping.filter((x) => !x.done) })),

        // -------------------------------------------------------- home care
        addAsset: (a) => {
          set((s) => ({ assets: [...s.assets, { ...a, id: uid() }] }));
          log('fixups', `added appliance “${a.name}”`);
        },
        updateAsset: (id, patch) => set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
        deleteAsset: (id) => {
          const a = get().assets.find((x) => x.id === id);
          set((s) => ({ assets: s.assets.filter((x) => x.id !== id) }));
          if (a) log('fixups', `removed appliance “${a.name}”`);
        },
        logService: (assetId, cost) => {
          const s = get();
          const a = s.assets.find((x) => x.id === assetId);
          if (!a) return;
          const today = todayISO();
          const now = new Date().toISOString();
          // close any open maintenance task for this asset, otherwise add a history record
          const open = s.fixups.find((f) => f.assetId === assetId && f.kind === 'maintenance' && f.status !== 'done');
          const fixups = open
            ? s.fixups.map((f) => (f.id === open.id ? { ...f, status: 'done' as const, completedAt: now, cost: cost ?? f.cost } : f))
            : [
                {
                  id: uid(),
                  title: `${a.name} service`,
                  kind: 'maintenance' as const,
                  status: 'done' as const,
                  priority: 'medium' as const,
                  assetId,
                  cost,
                  createdAt: now,
                  completedAt: now,
                },
                ...s.fixups,
              ];
          set({
            assets: s.assets.map((x) => (x.id === assetId ? { ...x, lastServiced: today } : x)),
            fixups,
            expenses: cost ? [{ id: uid(), title: `${a.name} service`, amount: cost, category: 'repairs', date: today, paidById: s.currentMemberId }, ...s.expenses] : s.expenses,
          });
          log('fixups', `logged a service for ${a.name}`);
        },
        addFixUp: (f) => {
          set((s) => ({ fixups: [{ ...f, id: uid(), createdAt: new Date().toISOString() }, ...s.fixups] }));
          log('fixups', `${f.kind === 'repair' ? 'reported' : 'scheduled'} “${f.title}”`);
        },
        updateFixUp: (id, patch) => set((s) => ({ fixups: s.fixups.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
        deleteFixUp: (id) => set((s) => ({ fixups: s.fixups.filter((f) => f.id !== id) })),
        completeFixUp: (id, cost) => {
          const s = get();
          const f = s.fixups.find((x) => x.id === id);
          if (!f) return;
          const now = new Date().toISOString();
          const finalCost = cost ?? f.cost;
          set({
            fixups: s.fixups.map((x) => (x.id === id ? { ...x, status: 'done', completedAt: now, cost: finalCost } : x)),
            assets:
              f.assetId && f.kind === 'maintenance'
                ? s.assets.map((a) => (a.id === f.assetId ? { ...a, lastServiced: todayISO() } : a))
                : s.assets,
            expenses: finalCost
              ? [{ id: uid(), title: f.title, amount: finalCost, category: 'repairs', date: todayISO(), paidById: s.currentMemberId }, ...s.expenses]
              : s.expenses,
          });
          log('fixups', `completed “${f.title}”`);
        },

        // -------------------------------------------------------- household
        addMember: (m) => {
          const s = get();
          const color = AVATAR_COLORS[s.members.length % AVATAR_COLORS.length]!;
          set({ members: [...s.members, { ...m, id: uid(), color, joinedAt: new Date().toISOString() }] });
          log('household', `added ${m.name} as ${m.role}`);
        },
        updateMember: (id, patch) => {
          const m = get().members.find((x) => x.id === id);
          set((s) => ({ members: s.members.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
          if (m && patch.role && patch.role !== m.role) log('household', `changed ${m.name}'s role to ${patch.role}`);
        },
        removeMember: (id) => {
          const s = get();
          const m = s.members.find((x) => x.id === id);
          if (!m) return;
          set({
            members: s.members.filter((x) => x.id !== id),
            chores: s.chores.map((c) => (c.assigneeId === id ? { ...c, assigneeId: null } : c)),
            currentMemberId: s.currentMemberId === id ? (s.members.find((x) => x.id !== id)?.id ?? null) : s.currentMemberId,
          });
          log('household', `removed ${m.name} from the household`);
        },

        // ------------------------------------------------------------ notes
        addNote: (n) => {
          const now = new Date().toISOString();
          set((s) => ({
            notes: [{ ...n, id: uid(), pinned: false, authorId: s.currentMemberId, createdAt: now, updatedAt: now }, ...s.notes],
          }));
          log('notes', `created note “${n.title}”`);
        },
        updateNote: (id, patch) =>
          set((s) => ({
            notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)),
          })),
        deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

        // ----------------------------------------------------- smart hearth
        dismissAlert: (id) => set((s) => ({ dismissedAlerts: [...s.dismissedAlerts, id] })),
        restoreAlerts: () => set({ dismissedAlerts: [] }),
        runAlertAction: (a) => {
          if (!a.action) return;
          const st = get();
          if (a.action.kind === 'addToShopping') st.addStockToShopping(a.action.entityId);
          if (a.action.kind === 'markBillPaid') st.markBillPaid(a.action.entityId);
          if (a.action.kind === 'logService') st.logService(a.action.entityId);
        },
        markNotified: (ids) => set((s) => ({ notifiedAlerts: [...new Set([...s.notifiedAlerts, ...ids])].slice(-500) })),
        setNotificationsEnabled: (on) => set({ notificationsEnabled: on }),
      };
    },
    {
      name: 'hearth-db',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        // persist data only, not functions
        const data: HearthData = {
          household: s.household,
          members: s.members,
          chores: s.chores,
          completions: s.completions,
          bills: s.bills,
          expenses: s.expenses,
          stock: s.stock,
          shopping: s.shopping,
          assets: s.assets,
          fixups: s.fixups,
          notes: s.notes,
          activity: s.activity,
          scoreHistory: s.scoreHistory,
          dismissedAlerts: s.dismissedAlerts,
          notifiedAlerts: s.notifiedAlerts,
          currentMemberId: s.currentMemberId,
          notificationsEnabled: s.notificationsEnabled,
        };
        return data;
      },
    },
  ),
);

/** Convenience hook: the member currently using the app. */
export const useMe = () =>
  useHearth((s) => s.members.find((m) => m.id === s.currentMemberId) ?? s.members[0]);

export const memberName = (members: Member[], id: string | null | undefined) =>
  members.find((m) => m.id === id)?.name ?? 'Unassigned';
