import clsx from 'clsx';
import { AlertOctagon, AlertTriangle, BellRing, Info, Lightbulb, RotateCcw, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, EmptyState, FilterChips, severityTone, toast, toneBg } from '../components/ui';
import { useAlerts } from '../lib/hooks';
import { can } from '../logic/permissions';
import { RULES } from '../logic/rules';
import { useHearth, useMe } from '../store/useHearth';
import type { Severity } from '../types';

const sevIcon: Record<Severity, React.ReactNode> = {
  critical: <AlertOctagon size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
  tip: <Lightbulb size={18} />,
};

export default function Alerts() {
  const alerts = useAlerts();
  const s = useHearth();
  const me = useMe();
  const [filter, setFilter] = useState<'all' | Severity>('all');
  const [showRules, setShowRules] = useState(false);
  const list = alerts.filter((a) => filter === 'all' || a.severity === filter);
  const count = (sev: Severity) => alerts.filter((a) => a.severity === sev).length;

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-card">
        <div className="flex items-center gap-2">
          <Sparkles size={20} />
          <h2 className="text-[18px] font-extrabold">Smart Hearth</h2>
        </div>
        <p className="mt-1 text-[13px] text-white/80">
          {RULES.length} household rules watch your chores, bills, stock and appliances, then suggest what to do next.
        </p>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {(['critical', 'warning', 'info', 'tip'] as Severity[]).map((sev) => (
            <div key={sev} className="rounded-2xl bg-white/15 py-2">
              <div className="text-[20px] font-extrabold">{count(sev)}</div>
              <div className="text-[11px] capitalize text-white/80">{sev === 'tip' ? 'Tips' : sev}</div>
            </div>
          ))}
        </div>
      </div>

      {!s.notificationsEnabled && (
        <Link to="/settings" className="card flex items-center gap-3 p-4">
          <BellRing className="text-brand-500" size={22} />
          <div className="flex-1 text-[13px]">
            <b>Turn on device reminders</b>
            <div className="text-ink-soft">Get notified about urgent alerts even when the app is closed.</div>
          </div>
        </Link>
      )}

      <FilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: `All (${alerts.length})` },
          { value: 'critical', label: 'Critical' },
          { value: 'warning', label: 'Warnings' },
          { value: 'info', label: 'Info' },
          { value: 'tip', label: 'Tips' },
        ]}
      />

      {list.length === 0 ? (
        <Card>
          <EmptyState icon={<Sparkles />} title="All clear!" hint="Nothing needs your attention right now." />
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-2xl', toneBg[severityTone[a.severity]])}>{sevIcon[a.severity]}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold leading-snug">{a.title}</div>
                  <div className="mt-0.5 text-[13px] text-ink-soft">{a.message}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {a.action && (can(me?.role, 'manageMoney') || a.action.kind !== 'markBillPaid') && (
                      <button
                        onClick={() => {
                          s.runAlertAction(a);
                          toast(`${a.action!.label} ✓`);
                        }}
                        className="rounded-xl bg-brand-500 px-3 py-1.5 text-[12px] font-bold text-white"
                      >
                        {a.action.label}
                      </button>
                    )}
                    <Link to={a.route} className="rounded-xl bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-ink-soft">
                      Open
                    </Link>
                  </div>
                </div>
                <button onClick={() => s.dismissAlert(a.id)} className="p-1 text-ink-mute" aria-label="Dismiss">
                  <X size={18} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-center gap-4">
        {s.dismissedAlerts.length > 0 && (
          <button onClick={s.restoreAlerts} className="flex items-center gap-1 text-[13px] font-semibold text-brand-600">
            <RotateCcw size={14} /> Restore {s.dismissedAlerts.length} dismissed
          </button>
        )}
        <button onClick={() => setShowRules((v) => !v)} className="text-[13px] font-semibold text-brand-600">
          {showRules ? 'Hide' : 'How it works'}
        </button>
      </div>

      {showRules && (
        <Card className="p-4">
          <p className="mb-3 text-[15px] font-bold">Active rules</p>
          <ol className="space-y-2.5">
            {RULES.map((r, i) => (
              <li key={r.id} className="flex gap-3 text-[13px]">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-600">{i + 1}</span>
                <div>
                  <b>{r.name}</b>
                  <div className="text-ink-soft">{r.description}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}
