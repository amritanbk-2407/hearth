import { format, parseISO, subMonths } from 'date-fns';
import { Scale, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Avatar, Badge, Card, ProgressBar } from '../components/ui';
import { monthKey, shiftDays } from '../lib/dates';
import { rupees, titleCase } from '../lib/format';
import { useHealthScore, useToday } from '../lib/hooks';
import { analyseFairness } from '../logic/fairness';
import { can } from '../logic/permissions';
import { isLowStock } from '../logic/selectors';
import { useHearth, useMe } from '../store/useHearth';
import type { ExpenseCategory } from '../types';
import { EXP_COLORS } from './Bills';

const axis = { fontSize: 11, fill: '#9a9db3' };

export default function Insights() {
  const s = useHearth();
  const me = useMe();
  const today = useToday();
  const health = useHealthScore();
  const fair = useMemo(() => analyseFairness(s.members, s.completions, today), [s.members, s.completions, today]);

  const trend = s.scoreHistory.slice(-14).map((h) => ({ day: format(parseISO(h.date), 'd MMM'), score: h.score }));

  const last7 = Array.from({ length: 7 }, (_, i) => shiftDays(today, i - 6)).map((d) => ({
    day: format(parseISO(d), 'EEE'),
    done: s.completions.filter((c) => c.date === d).length,
  }));

  const months = Array.from({ length: 6 }, (_, i) => monthKey(format(subMonths(parseISO(today), 5 - i), 'yyyy-MM-dd')));
  const monthly = months.map((m) => ({
    month: format(parseISO(`${m}-01`), 'MMM'),
    total: s.expenses.filter((e) => e.date.startsWith(m)).reduce((a, e) => a + e.amount, 0),
  }));
  const thisMonth = monthKey(today);
  const byCat = Object.entries(
    s.expenses
      .filter((e) => e.date.startsWith(thisMonth))
      .reduce<Record<string, number>>((acc, e) => ({ ...acc, [e.category]: (acc[e.category] ?? 0) + e.amount }), {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const healthyStock = s.stock.length ? Math.round(((s.stock.length - s.stock.filter(isLowStock).length) / s.stock.length) * 100) : 100;
  const showMoney = can(me?.role, 'viewMoney');

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <p className="flex items-center gap-2 text-[15px] font-bold">
            <TrendingUp size={18} className="text-emerald-500" /> House Health trend
          </p>
          <Badge tone="green">Today {health.score}%</Badge>
        </div>
        <p className="mb-2 text-[12px] text-ink-soft">Daily House Pulse score over the last two weeks</p>
        <div className="h-40">
          <ResponsiveContainer>
            <LineChart data={trend} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <XAxis dataKey="day" tick={axis} tickLine={false} axisLine={false} interval={2} />
              <YAxis domain={[40, 100]} tick={axis} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
              <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <p className="flex items-center gap-2 text-[15px] font-bold">
          <Scale size={18} className="text-brand-500" /> Fair share of chores
        </p>
        <p className="mb-3 text-[12px] text-ink-soft">Effort points completed in the last 30 days (helpers excluded)</p>
        <div className="mb-4 flex items-center gap-4 rounded-2xl bg-brand-50 p-3">
          <div className="text-center">
            <div className="text-[28px] font-extrabold text-brand-600">{fair.index.toFixed(2)}</div>
            <div className="text-[11px] font-semibold text-brand-600/80">Fairness index</div>
          </div>
          <div className="text-[12px] text-ink-soft">
            <b className="text-ink">{fair.label}.</b> 1.00 means everyone does an equal share. Calculated with Jain's fairness index.
          </div>
        </div>
        <div className="space-y-3">
          {fair.loads.map((l) => {
            const m = s.members.find((x) => x.id === l.memberId);
            return (
              <div key={l.memberId} className="flex items-center gap-3">
                <Avatar member={m} size={32} />
                <div className="flex-1">
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="font-semibold">{l.name}</span>
                    <span className="text-ink-soft">
                      {l.count} chores · <b className="text-ink">{Math.round(l.share * 100)}%</b>
                    </span>
                  </div>
                  <ProgressBar value={l.share * 100} tone={fair.overloaded?.memberId === l.memberId ? 'rose' : 'purple'} />
                </div>
              </div>
            );
          })}
        </div>
        {fair.overloaded && (
          <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-[12px] text-amber-800">
            💡 {fair.overloaded.name} is doing {Math.round(fair.overloaded.share * 100)}% of the work. Try moving one recurring chore to{' '}
            {(fair.underloaded ?? [...fair.loads].sort((a, b) => a.effort - b.effort)[0])?.name}.
          </p>
        )}
      </Card>

      <Card className="p-4">
        <p className="text-[15px] font-bold">Chores completed this week</p>
        <div className="mt-2 h-36">
          <ResponsiveContainer>
            <BarChart data={last7} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
              <XAxis dataKey="day" tick={axis} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#f3f0ff' }} />
              <Bar dataKey="done" name="Chores" fill="#7c5cfc" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {showMoney && (
        <>
          <Card className="p-4">
            <p className="text-[15px] font-bold">Monthly spending</p>
            <div className="mt-2 h-40">
              <ResponsiveContainer>
                <BarChart data={monthly} margin={{ top: 8, right: 0, left: -10, bottom: 0 }}>
                  <XAxis dataKey="month" tick={axis} tickLine={false} axisLine={false} />
                  <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v) => [rupees(Number(v)), 'Spent']} cursor={{ fill: '#ecfdf5' }} />
                  <Bar dataKey="total" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-[15px] font-bold">This month by category</p>
            <div className="flex items-center gap-2">
              <div className="h-40 w-40 shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={42} outerRadius={68} paddingAngle={2} stroke="none">
                      {byCat.map((c) => (
                        <Cell key={c.name} fill={EXP_COLORS[c.name as ExpenseCategory]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [rupees(Number(v)), titleCase(String(n))]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {byCat.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: EXP_COLORS[c.name as ExpenseCategory] }} />
                      {titleCase(c.name)}
                    </span>
                    <b>{rupees(c.value)}</b>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </>
      )}

      <Card className="p-4">
        <p className="text-[15px] font-bold">Pantry health</p>
        <p className="mb-2 text-[12px] text-ink-soft">Share of items above their low-stock level</p>
        <div className="flex items-center gap-3">
          <ProgressBar value={healthyStock} tone={healthyStock >= 80 ? 'green' : 'amber'} className="h-3 flex-1" />
          <b>{healthyStock}%</b>
        </div>
      </Card>
    </div>
  );
}
