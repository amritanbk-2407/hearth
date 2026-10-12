import clsx from 'clsx';
import {
  Activity as PulseIcon,
  ChevronDown,
  ClipboardList,
  IndianRupee,
  NotebookPen,
  Package,
  Plus,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HouseArt from '../components/HouseArt';
import { BillRow, DoneChoreRow, HomeCareRow, PendingChoreRow, StockBarRow, type HomeCareItem } from '../components/rows';
import { Card, ProgressBar, ScoreRing, SectionHeader, severityTone, toast, toneBg, toneSoftCard, type Tone } from '../components/ui';
import { daysUntil } from '../lib/dates';
import { rupees } from '../lib/format';
import { useAlerts, useHealthScore, useToday } from '../lib/hooks';
import { can } from '../logic/permissions';
import { lowStock, nextServiceDate, pendingChores, serviceStatus } from '../logic/selectors';
import { computeStreak } from '../logic/streak';
import { useHearth, useMe } from '../store/useHearth';

function StatCard({ to, tone, icon, value, label, sub }: { to: string; tone: Tone; icon: React.ReactNode; value: number; label: string; sub: string }) {
  const subColor: Record<Tone, string> = {
    purple: 'text-brand-500',
    green: 'text-emerald-600',
    amber: 'text-amber-600',
    blue: 'text-sky-600',
    rose: 'text-rose-500',
    slate: 'text-slate-500',
    teal: 'text-teal-600',
  };
  return (
    <Link to={to} className={clsx('w-[118px] shrink-0 rounded-3xl border p-3.5 shadow-card active:scale-[0.98]', toneSoftCard[tone])}>
      <div className="flex items-center gap-2">
        <div className={clsx('grid h-9 w-9 place-items-center rounded-xl', toneBg[tone])}>{icon}</div>
        <span className="text-[26px] font-extrabold leading-none">{value}</span>
      </div>
      <div className="mt-2 text-[14px] font-bold">{label}</div>
      <div className={clsx('text-[12px] font-semibold', subColor[tone])}>{sub}</div>
    </Link>
  );
}

export default function Home() {
  const s = useHearth();
  const me = useMe();
  const today = useToday();
  const health = useHealthScore();
  const alerts = useAlerts();
  const navigate = useNavigate();
  const [showBreakdown, setShowBreakdown] = useState(false);

  const streak = computeStreak(s.completions, today);
  const pending = pendingChores(s.chores, today).sort((a, b) =>
    a.dueDate === b.dueDate ? ['high', 'medium', 'low'].indexOf(a.priority) - ['high', 'medium', 'low'].indexOf(b.priority) : a.dueDate.localeCompare(b.dueDate),
  );
  const doneToday = s.completions.filter((c) => c.date === today).sort((a, b) => b.at.localeCompare(a.at));
  const totalToday = pending.length + doneToday.length;

  const upcomingBills = [...s.bills].sort((a, b) => Number(a.isPaid) - Number(b.isPaid) || a.dueDate.localeCompare(b.dueDate));
  const billsDueSoon = s.bills.filter((b) => !b.isPaid && daysUntil(b.dueDate, today) <= 7).length;
  const totalUnpaid = s.bills.filter((b) => !b.isPaid && daysUntil(b.dueDate, today) <= 30).reduce((a, b) => a + b.amount, 0);

  const low = lowStock(s.stock).sort((a, b) => a.quantity / a.capacity - b.quantity / b.capacity);

  const homeCare: HomeCareItem[] = useMemo(() => {
    const open = s.fixups
      .filter((f) => f.status !== 'done')
      .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
      .map((f) => ({ kind: 'fixup' as const, fixup: f, asset: s.assets.find((a) => a.id === f.assetId) }));
    const coveredAssets = new Set(open.map((o) => o.fixup.assetId).filter(Boolean));
    const assets = s.assets
      .filter((a) => !coveredAssets.has(a.id) && serviceStatus(a, today) !== 'none')
      .sort((a, b) => (nextServiceDate(a) ?? '').localeCompare(nextServiceDate(b) ?? ''))
      .map((a) => ({ kind: 'asset' as const, asset: a }));
    return [...open.slice(0, 2), ...assets.slice(0, 1)];
  }, [s.fixups, s.assets, today]);
  const fixupsDue = s.fixups.filter((f) => f.status !== 'done' && f.dueDate && daysUntil(f.dueDate, today) <= 3).length;

  const canChores = can(me?.role, 'completeChores');
  const canMoney = can(me?.role, 'viewMoney');
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-4">
      <p className="px-1 text-[14px] text-ink-soft">
        {greeting}, <span className="font-bold text-ink">{me?.name}</span> 👋
      </p>

      {/* ---------------- House Pulse ---------------- */}
      <section className="relative overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-[#e9f8f1] via-[#f2fbf7] to-[#eef6ff] p-5 shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] font-extrabold">House Pulse</h2>
              <PulseIcon size={20} className="text-emerald-500" />
            </div>
            <p className="text-[13px] text-ink-soft">Overall household health</p>
          </div>
          <HouseArt className="pointer-events-none -mb-3 -mr-2 -mt-3 w-[112px] shrink-0" />
        </div>
        <div className="relative mt-1 flex items-center gap-4">
          <div className="rounded-full bg-white/70 p-1">
            <ScoreRing score={health.score} label={health.label} size={124} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold leading-snug">
              {health.message.split('!')[0]}
              {health.message.includes('!') ? (
                <>
                  <span className="text-emerald-600">!</span>
                  {health.message.split('!')[1]}
                </>
              ) : null}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-card">
              <span className="text-lg">🔥</span>
              <div>
                <div className="text-[14px] font-extrabold leading-tight">{streak} Day Streak</div>
                <div className="text-[11px] text-ink-soft">{streak ? 'Keep going!' : 'Finish a chore to start'}</div>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowBreakdown((v) => !v)}
          className="mt-4 flex items-center gap-1 text-[12px] font-bold text-emerald-700"
        >
          How is this calculated?
          <ChevronDown size={14} className={clsx('transition', showBreakdown && 'rotate-180')} />
        </button>
        {showBreakdown && (
          <div className="mt-3 space-y-2.5 rounded-2xl bg-white/80 p-3">
            {health.components.map((c) => (
              <div key={c.key}>
                <div className="flex justify-between text-[12px]">
                  <span className="font-bold">
                    {c.label} <span className="font-medium text-ink-mute">· {c.detail}</span>
                  </span>
                  <span className="font-bold">
                    {c.points}/{c.weight}
                  </span>
                </div>
                <ProgressBar value={c.ratio * 100} tone={c.ratio >= 0.8 ? 'green' : c.ratio >= 0.5 ? 'amber' : 'rose'} className="mt-1 h-1.5" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------------- Stat cards ---------------- */}
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        <StatCard to="/chores" tone="purple" icon={<ClipboardList size={18} />} value={totalToday} label="Chores" sub={`${pending.length} pending`} />
        {canMoney && <StatCard to="/bills" tone="green" icon={<IndianRupee size={18} />} value={billsDueSoon} label="Bills" sub="Due soon" />}
        <StatCard to="/stock" tone="amber" icon={<Package size={18} />} value={low.length} label="Low Stock" sub="Items low" />
        <StatCard to="/fixups" tone="blue" icon={<Wrench size={18} />} value={fixupsDue} label="Fix-ups" sub="Due soon" />
        <StatCard to="/household" tone="rose" icon={<Users size={18} />} value={s.members.length} label="Members" sub="Active" />
      </div>

      {/* ---------------- Smart Hearth ---------------- */}
      {alerts.length > 0 && (
        <Card className="p-4">
          <SectionHeader icon={<Sparkles size={18} />} title="Smart Hearth" to="/alerts" />
          <div className="space-y-2">
            {alerts.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                <div className={clsx('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl', toneBg[severityTone[a.severity]])}>
                  <ShieldAlert size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-bold leading-snug">{a.title}</div>
                  <div className="text-[12px] text-ink-soft">{a.message}</div>
                </div>
                {a.action && (canMoney || a.action.kind !== 'markBillPaid') && (
                  <button
                    onClick={() => {
                      s.runAlertAction(a);
                      toast(`${a.action!.label} ✓`);
                    }}
                    className="shrink-0 rounded-xl bg-brand-500 px-2.5 py-1.5 text-[12px] font-bold text-white"
                  >
                    {a.action.label}
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ---------------- Today's chores ---------------- */}
      <Card className="p-4">
        <SectionHeader icon={<ClipboardList size={18} />} title="Today's Chores" to="/chores" />
        {totalToday === 0 ? (
          <p className="py-4 text-center text-sm text-ink-soft">Nothing due today 🎉</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {pending.slice(0, 4).map((c) => (
              <PendingChoreRow
                key={c.id}
                chore={c}
                members={s.members}
                today={today}
                onToggle={() => {
                  if (!canChores) return;
                  s.completeChore(c.id);
                  toast(`“${c.title}” done ✓`);
                }}
              />
            ))}
            {doneToday.slice(0, Math.max(0, 5 - Math.min(pending.length, 4))).map((c) => (
              <DoneChoreRow key={c.id} completion={c} members={s.members} onToggle={() => s.undoCompletion(c.id)} />
            ))}
          </div>
        )}
        <div className="mt-2 flex items-center gap-3">
          <span className="text-[14px] font-semibold">Progress</span>
          <ProgressBar value={totalToday ? (doneToday.length / totalToday) * 100 : 100} className="flex-1" />
          <span className="text-[14px] font-semibold">
            {doneToday.length} / {totalToday}
          </span>
        </div>
      </Card>

      {/* ---------------- Bills ---------------- */}
      {canMoney && (
        <Card className="p-4">
          <SectionHeader icon={<IndianRupee size={18} />} title="Upcoming Bills" to="/bills" />
          <div className="divide-y divide-slate-100">
            {upcomingBills.slice(0, 3).map((b) => (
              <BillRow key={b.id} bill={b} today={today} onClick={() => navigate('/bills')} />
            ))}
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-[15px] font-semibold">Total Unpaid</span>
            <span className="text-[20px] font-extrabold text-rose-500">{rupees(totalUnpaid)}</span>
          </div>
        </Card>
      )}

      {/* ---------------- Low stock ---------------- */}
      <Card className="p-4">
        <SectionHeader icon={<Package size={18} />} title="Low Stock Alerts" to="/stock" />
        {low.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-soft">Everything is well stocked</p>
        ) : (
          low.slice(0, 3).map((i) => <StockBarRow key={i.id} item={i} onClick={() => navigate('/stock')} />)
        )}
      </Card>

      {/* ---------------- Fix-ups ---------------- */}
      <Card className="p-4">
        <SectionHeader icon={<Wrench size={18} />} title="Fix-ups & Maintenance" to="/fixups" />
        <div className="divide-y divide-slate-100">
          {homeCare.map((h) => (
            <HomeCareRow key={h.kind === 'asset' ? h.asset.id : h.fixup.id} item={h} today={today} onClick={() => navigate('/fixups')} />
          ))}
        </div>
      </Card>

      {/* ---------------- Quick actions ---------------- */}
      <section>
        <h2 className="mb-3 px-1 text-[16px] font-bold">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Add Chore', to: '/chores?new=1', icon: <Plus size={20} />, tone: 'purple' as Tone },
            { label: 'Add Bill', to: '/bills?new=1', icon: <IndianRupee size={20} />, tone: 'green' as Tone, money: true },
            { label: 'Add Item', to: '/stock?new=1', icon: <Package size={20} />, tone: 'amber' as Tone },
            { label: 'Add Fix-up', to: '/fixups?new=1', icon: <Wrench size={20} />, tone: 'blue' as Tone },
            { label: 'Shopping List', to: '/stock?tab=shopping', icon: <ShoppingCart size={20} />, tone: 'rose' as Tone },
            { label: 'Add Note', to: '/notes?new=1', icon: <NotebookPen size={20} />, tone: 'teal' as Tone },
          ]
            .filter((q) => !q.money || can(me?.role, 'manageMoney'))
            .map((q) => (
              <Link key={q.label} to={q.to} className="card flex flex-col items-center gap-2 px-2 py-4 active:scale-[0.97]">
                <div className={clsx('grid h-10 w-10 place-items-center rounded-full', toneBg[q.tone])}>{q.icon}</div>
                <span className="text-center text-[13px] font-semibold">{q.label}</span>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
