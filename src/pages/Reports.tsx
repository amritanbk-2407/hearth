import { addMonths, format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { useState } from 'react';
import { Button, Card } from '../components/ui';
import { monthKey } from '../lib/dates';
import { rupees, titleCase } from '../lib/format';
import { useAlerts, useHealthScore, useToday } from '../lib/hooks';
import { analyseFairness } from '../logic/fairness';
import { can } from '../logic/permissions';
import { useHearth, useMe } from '../store/useHearth';

function Row({ cells, bold }: { cells: Array<string | number>; bold?: boolean }) {
  return (
    <tr className={bold ? 'font-bold' : ''}>
      {cells.map((c, i) => (
        <td key={i} className={`border-b border-slate-100 py-2 ${i > 0 ? 'text-right' : ''}`}>
          {c}
        </td>
      ))}
    </tr>
  );
}

/** Printable monthly household report (use the browser's Print → Save as PDF). */
export default function Reports() {
  const s = useHearth();
  const me = useMe();
  const today = useToday();
  const health = useHealthScore();
  const alerts = useAlerts();
  const [offset, setOffset] = useState(0);
  const monthDate = addMonths(parseISO(`${monthKey(today)}-01`), offset);
  const m = format(monthDate, 'yyyy-MM');
  const label = format(monthDate, 'MMMM yyyy');

  const comps = s.completions.filter((c) => c.date.startsWith(m));
  const exp = s.expenses.filter((e) => e.date.startsWith(m));
  const spent = exp.reduce((a, e) => a + e.amount, 0);
  const cats = Object.entries(exp.reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.category]: (acc[e.category] ?? 0) + e.amount }), {})).sort(
    (a, b) => b[1] - a[1],
  );
  const repairs = s.fixups.filter((f) => f.status === 'done' && f.completedAt?.startsWith(m));
  const lastDay = format(addMonths(monthDate, 1), 'yyyy-MM-dd');
  const fair = analyseFairness(s.members, comps, lastDay < today ? lastDay : today, 31);
  const showMoney = can(me?.role, 'viewMoney');

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setOffset((o) => o - 1)} className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-card" aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <span className="text-[15px] font-bold">{label}</span>
          <button
            onClick={() => setOffset((o) => Math.min(0, o + 1))}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-card disabled:opacity-40"
            disabled={offset === 0}
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <Button className="!py-2 text-[13px]" onClick={() => window.print()}>
          <Printer size={16} /> Print / PDF
        </Button>
      </div>

      <Card className="p-5 text-[13px]">
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-mute">Hearth · Monthly household report</p>
        <h2 className="mt-1 text-[20px] font-extrabold">{s.household?.name}</h2>
        <p className="text-ink-soft">
          {label} · generated {format(new Date(), 'd MMM yyyy, h:mm a')} by {me?.name}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            ['House Health', `${health.score}%`],
            ['Chores done', comps.length],
            showMoney ? ['Spent', rupees(spent)] : ['Open alerts', alerts.length],
            ['Repairs done', repairs.length],
          ].map(([k, v]) => (
            <div key={String(k)} className="rounded-2xl bg-slate-50 p-3">
              <div className="text-[11px] text-ink-mute">{k}</div>
              <div className="text-[18px] font-extrabold">{v}</div>
            </div>
          ))}
        </div>

        <h3 className="mb-1 mt-5 font-bold">Chores by member</h3>
        <table className="w-full">
          <tbody>
            <Row cells={['Member', 'Chores', 'Effort', 'Share']} bold />
            {fair.loads.map((l) => (
              <Row key={l.memberId} cells={[l.name, l.count, l.effort, `${Math.round(l.share * 100)}%`]} />
            ))}
          </tbody>
        </table>
        <p className="mt-1 text-[12px] text-ink-soft">
          Fairness index {fair.index.toFixed(2)} ({fair.label})
        </p>

        {showMoney && (
          <>
            <h3 className="mb-1 mt-5 font-bold">Spending by category</h3>
            <table className="w-full">
              <tbody>
                {cats.map(([c, v]) => (
                  <Row key={c} cells={[titleCase(c), rupees(v)]} />
                ))}
                <Row cells={['Total', rupees(spent)]} bold />
              </tbody>
            </table>

            <h3 className="mb-1 mt-5 font-bold">Bills status</h3>
            <table className="w-full">
              <tbody>
                {s.bills.map((b) => (
                  <Row key={b.id} cells={[b.name, rupees(b.amount), b.isPaid ? 'Paid' : 'Unpaid']} />
                ))}
              </tbody>
            </table>
          </>
        )}

        <h3 className="mb-1 mt-5 font-bold">Repairs & maintenance completed</h3>
        {repairs.length === 0 ? (
          <p className="text-ink-soft">None this month.</p>
        ) : (
          <table className="w-full">
            <tbody>
              {repairs.map((f) => (
                <Row key={f.id} cells={[f.title, f.cost ? rupees(f.cost) : '—']} />
              ))}
            </tbody>
          </table>
        )}

        <h3 className="mb-1 mt-5 font-bold">Open Smart Hearth alerts</h3>
        <ul className="list-disc space-y-0.5 pl-5">
          {alerts.slice(0, 8).map((a) => (
            <li key={a.id}>{a.title}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
