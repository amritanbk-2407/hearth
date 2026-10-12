import { CheckCircle2, Lock, Receipt, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BillRow } from '../components/rows';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Fab,
  Field,
  MemberPicker,
  PillPicker,
  ProgressBar,
  Segmented,
  Sheet,
  toast,
} from '../components/ui';
import { daysUntil, monthKey, prettyDate, shiftDays, shortDate } from '../lib/dates';
import { rupees, titleCase } from '../lib/format';
import { useNewParam, useToday } from '../lib/hooks';
import { billVisual } from '../lib/icons';
import { can } from '../logic/permissions';
import { useHearth, useMe } from '../store/useHearth';
import type { Bill, BillCategory, BillRecurrence, ExpenseCategory } from '../types';

const BILL_CATS: BillCategory[] = ['electricity', 'water', 'internet', 'gas', 'rent', 'phone', 'subscription', 'other'];
const EXP_CATS: ExpenseCategory[] = ['groceries', 'utilities', 'food', 'household', 'repairs', 'transport', 'other'];
export const EXP_COLORS: Record<ExpenseCategory, string> = {
  groceries: '#f59e0b',
  utilities: '#7c5cfc',
  food: '#f43f5e',
  household: '#10b981',
  repairs: '#0ea5e9',
  transport: '#14b8a6',
  other: '#94a3b8',
};

function BillForm({ bill, onDone }: { bill?: Bill; onDone: () => void }) {
  const s = useHearth();
  const today = useToday();
  const [name, setName] = useState(bill?.name ?? '');
  const [category, setCategory] = useState<BillCategory>(bill?.category ?? 'electricity');
  const [amount, setAmount] = useState(bill ? String(bill.amount) : '');
  const [dueDate, setDueDate] = useState(bill?.dueDate ?? shiftDays(today, 7));
  const [recurrence, setRecurrence] = useState<BillRecurrence>(bill?.recurrence ?? 'monthly');
  const [autopay, setAutopay] = useState(bill?.autopay ?? false);
  const valid = name.trim() && Number(amount) > 0;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        const data = { name: name.trim(), category, amount: Number(amount), dueDate, recurrence, autopay };
        if (bill) {
          s.updateBill(bill.id, data);
          toast('Bill updated');
        } else {
          s.addBill(data);
          toast('Bill added');
        }
        onDone();
      }}
    >
      <Field label="Bill name">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Electricity Bill" />
      </Field>
      <div>
        <span className="label">Category</span>
        <div className="grid grid-cols-4 gap-2">
          {BILL_CATS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setCategory(c)}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-2 text-[11px] font-semibold ${category === c ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-ink-soft'}`}
            >
              {billVisual[c].icon(18)}
              {titleCase(c === 'subscription' ? 'OTT/Subs' : c)}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (₹)">
          <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" />
        </Field>
        <Field label="Due date">
          <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
      </div>
      <div>
        <span className="label">Repeats</span>
        <PillPicker
          value={recurrence}
          onChange={setRecurrence}
          options={[
            { value: 'none', label: 'One time' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'quarterly', label: 'Quarterly' },
            { value: 'yearly', label: 'Yearly' },
          ]}
        />
      </div>
      <label className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
        <span className="text-[14px] font-semibold">Autopay is set up</span>
        <input type="checkbox" checked={autopay} onChange={(e) => setAutopay(e.target.checked)} className="h-5 w-5 accent-brand-500" />
      </label>
      <div className="flex gap-3">
        {bill && (
          <Button
            variant="danger"
            onClick={() => {
              s.deleteBill(bill.id);
              toast('Bill deleted');
              onDone();
            }}
          >
            <Trash2 size={18} />
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={!valid}>
          {bill ? 'Save changes' : 'Add bill'}
        </Button>
      </div>
    </form>
  );
}

function ExpenseForm({ onDone }: { onDone: () => void }) {
  const s = useHearth();
  const today = useToday();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('groceries');
  const [date, setDate] = useState(today);
  const [paidById, setPaidBy] = useState<string | null>(s.currentMemberId);
  const valid = title.trim() && Number(amount) > 0;
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        s.addExpense({ title: title.trim(), amount: Number(amount), category, date, paidById });
        toast('Expense logged');
        onDone();
      }}
    >
      <Field label="What was it for?">
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Vegetables" autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (₹)">
          <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" />
        </Field>
        <Field label="Date">
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <div>
        <span className="label">Category</span>
        <PillPicker value={category} onChange={setCategory} options={EXP_CATS.map((c) => ({ value: c, label: titleCase(c) }))} />
      </div>
      <div>
        <span className="label">Paid by</span>
        <MemberPicker members={s.members.filter((m) => m.role !== 'helper')} value={paidById} onChange={setPaidBy} allowNone={false} />
      </div>
      <Button type="submit" className="w-full" disabled={!valid}>
        Log expense
      </Button>
    </form>
  );
}

function BillDetail({ bill, onEdit, onClose }: { bill: Bill; onEdit: () => void; onClose: () => void }) {
  const s = useHearth();
  const me = useMe();
  const today = useToday();
  const v = billVisual[bill.category];
  const n = daysUntil(bill.dueDate, today);
  const canManage = can(me?.role, 'manageMoney');
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-3xl bg-slate-50 p-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-brand-600 shadow-card">{v.icon(26)}</div>
        <div className="flex-1">
          <div className="text-[26px] font-extrabold leading-none">{rupees(bill.amount)}</div>
          <div className="mt-1 text-[13px] text-ink-soft">
            Due {prettyDate(bill.dueDate)} · {bill.recurrence === 'none' ? 'One time' : titleCase(bill.recurrence)}
            {bill.autopay && ' · Autopay'}
          </div>
        </div>
        {bill.isPaid ? <Badge tone="green">Paid</Badge> : <Badge tone="rose">{n < 0 ? 'Overdue' : 'Unpaid'}</Badge>}
      </div>
      {bill.paidOn && <p className="text-[13px] text-ink-soft">Last paid on {prettyDate(bill.paidOn)}.</p>}
      {canManage && (
        <div className="flex gap-3">
          {bill.isPaid ? (
            <Button
              variant="soft"
              className="flex-1"
              onClick={() => {
                s.markBillUnpaid(bill.id);
                toast('Marked unpaid');
                onClose();
              }}
            >
              <RotateCcw size={18} /> Mark unpaid
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={() => {
                s.markBillPaid(bill.id);
                toast(`${bill.name} paid ✓ — added to expenses`);
                onClose();
              }}
            >
              <CheckCircle2 size={18} /> Mark as paid
            </Button>
          )}
          <Button variant="soft" onClick={onEdit}>
            Edit
          </Button>
        </div>
      )}
    </div>
  );
}

export default function Bills() {
  const s = useHearth();
  const me = useMe();
  const today = useToday();
  const [tab, setTab] = useState<'bills' | 'expenses'>('bills');
  const [adding, setAdding] = useNewParam();
  const [viewing, setViewing] = useState<Bill | null>(null);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [addingExpense, setAddingExpense] = useState(false);

  if (!can(me?.role, 'viewMoney')) {
    return (
      <Card>
        <EmptyState icon={<Lock />} title="Money is private" hint="Helpers can't view bills or expenses. Ask an admin for access." />
      </Card>
    );
  }

  const month = monthKey(today);
  const monthExpenses = s.expenses.filter((e) => e.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date));
  const spent = monthExpenses.reduce((a, e) => a + e.amount, 0);
  const unpaid = s.bills.filter((b) => !b.isPaid);
  const unpaidTotal = unpaid.reduce((a, b) => a + b.amount, 0);

  const overdue = unpaid.filter((b) => daysUntil(b.dueDate, today) < 0);
  const soon = unpaid.filter((b) => daysUntil(b.dueDate, today) >= 0 && daysUntil(b.dueDate, today) <= 7);
  const later = unpaid.filter((b) => daysUntil(b.dueDate, today) > 7);
  const paid = s.bills.filter((b) => b.isPaid);
  const sortDue = (a: Bill, b: Bill) => a.dueDate.localeCompare(b.dueDate);

  const byCat = EXP_CATS.map((c) => ({ c, amt: monthExpenses.filter((e) => e.category === c).reduce((a, e) => a + e.amount, 0) }))
    .filter((x) => x.amt > 0)
    .sort((a, b) => b.amt - a.amt);

  const section = (title: string, list: Bill[]) =>
    list.length > 0 && (
      <Card className="px-4 pb-1 pt-3">
        <p className="text-[12px] font-bold uppercase tracking-wider text-ink-mute">
          {title} · {list.length}
        </p>
        <div className="divide-y divide-slate-100">
          {list.sort(sortDue).map((b) => (
            <BillRow key={b.id} bill={b} today={today} onClick={() => setViewing(b)} />
          ))}
        </div>
      </Card>
    );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white shadow-card">
          <div className="text-[12px] font-semibold text-white/80">Spent this month</div>
          <div className="mt-1 text-[24px] font-extrabold">{rupees(spent)}</div>
          <div className="text-[12px] text-white/80">{monthExpenses.length} transactions</div>
        </div>
        <div className="card p-4">
          <div className="text-[12px] font-semibold text-ink-soft">Unpaid bills</div>
          <div className="mt-1 text-[24px] font-extrabold text-rose-500">{rupees(unpaidTotal)}</div>
          <div className="text-[12px] text-ink-soft">
            {unpaid.length} bills{overdue.length ? ` · ${overdue.length} overdue` : ''}
          </div>
        </div>
      </div>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'bills', label: 'Bills', count: s.bills.length },
          { value: 'expenses', label: 'Expenses', count: monthExpenses.length },
        ]}
      />

      {tab === 'bills' && (
        <>
          {s.bills.length === 0 && (
            <Card>
              <EmptyState icon={<Receipt />} title="No bills yet" hint="Add electricity, rent, internet and more." />
            </Card>
          )}
          {section('Overdue', overdue)}
          {section('Due in the next 7 days', soon)}
          {section('Later', later)}
          {section('Paid', paid)}
        </>
      )}

      {tab === 'expenses' && (
        <>
          <Card className="p-4">
            <p className="mb-3 text-[15px] font-bold">Where the money went · {new Date().toLocaleString('en-IN', { month: 'long' })}</p>
            <div className="space-y-3">
              {byCat.map(({ c, amt }) => (
                <div key={c}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: EXP_COLORS[c] }} />
                      {titleCase(c)}
                    </span>
                    <span className="font-bold">{rupees(amt)}</span>
                  </div>
                  <ProgressBar value={(amt / spent) * 100} tone="purple" className="h-1.5" />
                </div>
              ))}
            </div>
          </Card>
          <Card className="px-4">
            <div className="divide-y divide-slate-100">
              {monthExpenses.map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-[11px] font-bold text-white" style={{ background: EXP_COLORS[e.category] }}>
                    {shortDate(e.date).split(' ')[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold">{e.title}</div>
                    <div className="text-[12px] text-ink-soft">
                      {titleCase(e.category)} · {shortDate(e.date)} · {s.members.find((m) => m.id === e.paidById)?.name ?? '—'}
                    </div>
                  </div>
                  <div className="text-[15px] font-bold">{rupees(e.amount)}</div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {can(me?.role, 'manageMoney') && (
        <Fab label={tab === 'bills' ? 'Bill' : 'Expense'} onClick={() => (tab === 'bills' ? setAdding(true) : setAddingExpense(true))} />
      )}
      <Sheet open={adding} onClose={() => setAdding(false)} title="New bill">
        <BillForm onDone={() => setAdding(false)} />
      </Sheet>
      <Sheet open={addingExpense} onClose={() => setAddingExpense(false)} title="Log an expense">
        <ExpenseForm onDone={() => setAddingExpense(false)} />
      </Sheet>
      <Sheet open={!!viewing} onClose={() => setViewing(null)} title={viewing?.name ?? ''}>
        {viewing && (
          <BillDetail
            bill={s.bills.find((b) => b.id === viewing.id) ?? viewing}
            onClose={() => setViewing(null)}
            onEdit={() => {
              setEditing(viewing);
              setViewing(null);
            }}
          />
        )}
      </Sheet>
      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Edit bill">
        {editing && <BillForm key={editing.id} bill={editing} onDone={() => setEditing(null)} />}
      </Sheet>
    </div>
  );
}
