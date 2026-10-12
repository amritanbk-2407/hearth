import { Search as SearchIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, type Tone } from '../components/ui';
import { rupees } from '../lib/format';
import { can } from '../logic/permissions';
import { useHearth, useMe } from '../store/useHearth';

interface Hit {
  type: string;
  tone: Tone;
  title: string;
  sub: string;
  to: string;
}

export default function Search() {
  const s = useHearth();
  const me = useMe();
  const [q, setQ] = useState('');

  const hits = useMemo<Hit[]>(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const has = (...xs: Array<string | undefined>) => xs.some((x) => x?.toLowerCase().includes(term));
    const out: Hit[] = [];
    s.chores.filter((c) => has(c.title, c.room, c.notes)).forEach((c) => out.push({ type: 'Chore', tone: 'purple', title: c.title, sub: c.room, to: '/chores' }));
    if (can(me?.role, 'viewMoney')) {
      s.bills.filter((b) => has(b.name, b.category)).forEach((b) => out.push({ type: 'Bill', tone: 'green', title: b.name, sub: rupees(b.amount), to: '/bills' }));
      s.expenses.filter((e) => has(e.title, e.category)).slice(0, 8).forEach((e) => out.push({ type: 'Expense', tone: 'green', title: e.title, sub: `${rupees(e.amount)} · ${e.date}`, to: '/bills' }));
    }
    s.stock.filter((x) => has(x.name, x.category, x.location)).forEach((x) => out.push({ type: 'Stock', tone: 'amber', title: x.name, sub: `${x.quantity} ${x.unit} left`, to: '/stock' }));
    s.shopping.filter((x) => !x.done && has(x.name)).forEach((x) => out.push({ type: 'Shopping', tone: 'rose', title: x.name, sub: `${x.quantity} ${x.unit}`, to: '/stock?tab=shopping' }));
    s.assets.filter((a) => has(a.name, a.brand, a.location)).forEach((a) => out.push({ type: 'Appliance', tone: 'blue', title: a.name, sub: a.brand ?? '', to: '/fixups' }));
    s.fixups.filter((f) => has(f.title, f.vendor, f.notes)).forEach((f) => out.push({ type: 'Fix-up', tone: 'blue', title: f.title, sub: f.status, to: '/fixups' }));
    s.notes.filter((n) => has(n.title, n.body)).forEach((n) => out.push({ type: 'Note', tone: 'teal', title: n.title, sub: n.body.split('\n')[0] ?? '', to: '/notes' }));
    s.members.filter((m) => has(m.name)).forEach((m) => out.push({ type: 'Member', tone: 'rose', title: m.name, sub: m.role, to: '/household' }));
    return out;
  }, [q, s, me]);

  return (
    <div className="space-y-4">
      <div className="card flex items-center gap-2 px-4">
        <SearchIcon size={20} className="text-ink-mute" />
        <input
          className="w-full bg-transparent py-3.5 text-[15px] outline-none placeholder:text-ink-mute"
          placeholder="Search chores, bills, items, notes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
      </div>
      {q.trim().length >= 2 && (
        <Card className="px-4">
          {hits.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-soft">No results for “{q}”</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {hits.map((h, i) => (
                <Link key={i} to={h.to} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold">{h.title}</div>
                    <div className="truncate text-[12px] capitalize text-ink-soft">{h.sub}</div>
                  </div>
                  <Badge tone={h.tone}>{h.type}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}
      {q.trim().length < 2 && (
        <div className="flex flex-wrap gap-2">
          {['milk', 'bill', 'AC', 'kitchen', 'plumber'].map((t) => (
            <button key={t} onClick={() => setQ(t)} className="rounded-full bg-white px-3 py-1.5 text-[13px] font-semibold text-ink-soft shadow-card">
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
