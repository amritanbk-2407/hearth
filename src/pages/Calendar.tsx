import clsx from 'clsx';
import { addMonths, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui';
import { prettyDate, shiftDays, toISODate } from '../lib/dates';
import { useToday } from '../lib/hooks';
import { buildEvents, EVENT_COLORS, type EventKind } from '../logic/calendar';
import { useHearth } from '../store/useHearth';

const LEGEND: Array<[EventKind, string]> = [
  ['chore', 'Chores'],
  ['bill', 'Bills'],
  ['service', 'Fix-ups'],
  ['expiry', 'Expiry'],
];

export default function CalendarPage() {
  const s = useHearth();
  const today = useToday();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(today);

  const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const from = toISODate(gridStart);
  const to = toISODate(gridEnd);
  const events = useMemo(() => buildEvents(s, from, to), [s, from, to]);

  const days: string[] = [];
  for (let d = from; d <= to; d = shiftDays(d, 1)) days.push(d);
  const month = format(cursor, 'yyyy-MM');
  const dayEvents = events.filter((e) => e.date === selected).sort((a, b) => Number(a.done) - Number(b.done));

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => setCursor((c) => addMonths(c, -1))} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100" aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <div className="text-[17px] font-extrabold">{format(cursor, 'MMMM yyyy')}</div>
          <button onClick={() => setCursor((c) => addMonths(c, 1))} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100" aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 text-center text-[11px] font-bold text-ink-mute">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {days.map((d) => {
            const ev = events.filter((e) => e.date === d && !e.done);
            const kinds = [...new Set(ev.map((e) => (e.kind === 'fixup' ? 'service' : e.kind)))].slice(0, 4);
            const inMonth = d.startsWith(month);
            return (
              <button
                key={d}
                onClick={() => setSelected(d)}
                className={clsx(
                  'mx-auto flex h-12 w-11 flex-col items-center justify-center rounded-2xl text-[14px] font-semibold transition',
                  selected === d ? 'bg-brand-500 text-white' : d === today ? 'bg-brand-50 text-brand-700' : '',
                  !inMonth && selected !== d && 'text-ink-mute/50',
                )}
              >
                {Number(d.slice(8))}
                <span className="mt-0.5 flex h-1.5 gap-0.5">
                  {kinds.map((k) => (
                    <span key={k} className="h-1.5 w-1.5 rounded-full" style={{ background: selected === d ? 'white' : EVENT_COLORS[k] }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-3 text-[11px] text-ink-soft">
          {LEGEND.map(([k, l]) => (
            <span key={k} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: EVENT_COLORS[k] }} />
              {l}
            </span>
          ))}
        </div>
      </Card>

      <Card className="px-4 pb-2 pt-3">
        <p className="text-[12px] font-bold uppercase tracking-wider text-ink-mute">
          {selected === today ? 'Today · ' : ''}
          {prettyDate(selected)}
        </p>
        {dayEvents.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-soft">Nothing scheduled</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {dayEvents.map((e, i) => (
              <Link key={i} to={e.route} className="flex items-center gap-3 py-3">
                <span className="h-9 w-1.5 rounded-full" style={{ background: EVENT_COLORS[e.kind] }} />
                <div className="flex-1">
                  <div className={clsx('text-[15px] font-semibold', e.done && 'text-ink-mute line-through')}>{e.title}</div>
                  <div className="text-[12px] capitalize text-ink-soft">{e.kind === 'service' ? 'Maintenance' : e.kind}</div>
                </div>
                {e.done && <CheckCircle2 size={18} className="text-emerald-500" />}
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
