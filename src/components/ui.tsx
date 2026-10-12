import clsx from 'clsx';
import { ChevronRight, X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { create } from 'zustand';
import { initials } from '../lib/format';
import type { Member, Priority, Severity } from '../types';

// ---------------------------------------------------------------- tones
export type Tone = 'purple' | 'green' | 'amber' | 'blue' | 'rose' | 'slate' | 'teal';

export const toneBg: Record<Tone, string> = {
  purple: 'bg-brand-50 text-brand-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-sky-50 text-sky-600',
  rose: 'bg-rose-50 text-rose-500',
  slate: 'bg-slate-100 text-slate-500',
  teal: 'bg-teal-50 text-teal-600',
};

export const toneSoftCard: Record<Tone, string> = {
  purple: 'bg-gradient-to-br from-brand-50 to-white border-brand-100',
  green: 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100',
  amber: 'bg-gradient-to-br from-amber-50 to-white border-amber-100',
  blue: 'bg-gradient-to-br from-sky-50 to-white border-sky-100',
  rose: 'bg-gradient-to-br from-rose-50 to-white border-rose-100',
  slate: 'bg-gradient-to-br from-slate-50 to-white border-slate-100',
  teal: 'bg-gradient-to-br from-teal-50 to-white border-teal-100',
};

export const priorityTone: Record<Priority, Tone> = { high: 'rose', medium: 'amber', low: 'blue' };
export const severityTone: Record<Severity, Tone> = { critical: 'rose', warning: 'amber', info: 'blue', tip: 'purple' };

// ---------------------------------------------------------------- basics
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('card', className)}>{children}</div>;
}

export function Badge({ tone = 'slate', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={clsx('chip', toneBg[tone], className)}>{children}</span>;
}

export function IconBubble({ tone, children, size = 'md' }: { tone: Tone; children: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div
      className={clsx(
        'grid shrink-0 place-items-center rounded-2xl',
        toneBg[tone],
        size === 'sm' && 'h-9 w-9',
        size === 'md' && 'h-11 w-11',
        size === 'lg' && 'h-12 w-12',
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  icon,
  title,
  to,
  action,
}: {
  icon?: ReactNode;
  title: string;
  to?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {icon && <span className="text-brand-500">{icon}</span>}
        <h2 className="text-[16px] font-bold text-ink">{title}</h2>
      </div>
      {to ? (
        <Link to={to} className="text-[13px] font-semibold text-brand-600">
          View all
        </Link>
      ) : (
        action
      )}
    </div>
  );
}

export function ProgressBar({ value, tone = 'green', className }: { value: number; tone?: Tone; className?: string }) {
  const bar: Record<Tone, string> = {
    purple: 'bg-brand-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-400',
    blue: 'bg-sky-500',
    rose: 'bg-rose-400',
    slate: 'bg-slate-400',
    teal: 'bg-teal-500',
  };
  return (
    <div className={clsx('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div
        className={clsx('h-full rounded-full transition-all duration-500', bar[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function ScoreRing({ score, label, size = 132 }: { score: number; label: string; size?: number }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e8f5ef" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[34px] font-extrabold leading-none tracking-tight text-ink">
          {score}
          <span className="text-xl">%</span>
        </span>
        <span className="mt-1 text-[13px] font-bold" style={{ color }}>
          {label}
        </span>
      </div>
    </div>
  );
}

export function Avatar({ member, size = 36 }: { member?: Member; size?: number }) {
  if (!member) return null;
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: member.color, fontSize: size * 0.38 }}
      title={member.name}
    >
      {initials(member.name)}
    </div>
  );
}

export function EmptyState({ icon, title, hint, action }: { icon: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-500">{icon}</div>
      <p className="font-bold text-ink">{title}</p>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  className,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'soft' | 'ghost' | 'danger';
  type?: 'button' | 'submit';
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[15px] font-bold transition active:scale-[0.98] disabled:opacity-50',
        variant === 'primary' && 'bg-brand-500 text-white shadow-[0_6px_20px_rgba(124,92,252,0.35)] hover:bg-brand-600',
        variant === 'soft' && 'bg-brand-50 text-brand-600 hover:bg-brand-100',
        variant === 'ghost' && 'text-ink-soft hover:bg-slate-100',
        variant === 'danger' && 'bg-rose-50 text-rose-600 hover:bg-rose-100',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Segmented control used for in-page tabs (e.g. Bills | Expenses). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string; count?: number }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-2xl bg-white p-1 shadow-card">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'flex-1 rounded-xl px-3 py-2 text-[13px] font-bold transition',
            value === o.value ? 'bg-brand-500 text-white shadow' : 'text-ink-soft hover:bg-slate-50',
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span className={clsx('ml-1.5 text-[11px]', value === o.value ? 'text-white/80' : 'text-ink-mute')}>
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Horizontal filter chips. */
export function FilterChips<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition',
            value === o.value ? 'border-ink bg-ink text-white' : 'border-slate-200 bg-white text-ink-soft',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ListRow({
  left,
  title,
  subtitle,
  right,
  onClick,
  className,
}: {
  left?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={clsx('flex items-center gap-3 py-3', onClick && 'cursor-pointer active:opacity-70', className)}
    >
      {left}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold text-ink">{title}</div>
        {subtitle && <div className="mt-0.5 truncate text-[13px] text-ink-soft">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

export function LinkRow({ to, icon, tone, title, subtitle }: { to: string; icon: ReactNode; tone: Tone; title: string; subtitle?: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 py-3 active:opacity-70">
      <IconBubble tone={tone} size="sm">
        {icon}
      </IconBubble>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold text-ink">{title}</div>
        {subtitle && <div className="text-[13px] text-ink-soft">{subtitle}</div>}
      </div>
      <ChevronRight size={18} className="text-ink-mute" />
    </Link>
  );
}

// ---------------------------------------------------------------- sheet
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const host = document.getElementById('app-frame') ?? document.body;
  return createPortal(
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative max-h-[88%] animate-sheet-up overflow-y-auto rounded-t-[28px] bg-white px-5 pb-8 pt-3 shadow-pop">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-ink">{title}</h3>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-ink-soft" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    host,
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={clsx('block', className)}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

/** Pick-one pill group used inside forms (priority, recurrence, role…). */
export function PillPicker<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'rounded-xl border px-3 py-2 text-[13px] font-semibold transition',
            value === o.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-ink-soft',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- toasts
interface ToastState {
  message: string | null;
  show: (m: string) => void;
  clear: () => void;
}
let toastTimer: ReturnType<typeof setTimeout> | undefined;
export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    clearTimeout(toastTimer);
    set({ message });
    toastTimer = setTimeout(() => set({ message: null }), 2200);
  },
  clear: () => set({ message: null }),
}));
export const toast = (m: string) => useToast.getState().show(m);

export function Toaster() {
  const message = useToast((s) => s.message);
  if (!message) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-[60] flex justify-center px-6">
      <div className="animate-fade-in rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-pop">{message}</div>
    </div>
  );
}

/** Floating "+" button, rendered above the bottom tab bar. */
export function Fab({ onClick, label }: { onClick: () => void; label: string }) {
  const host = document.getElementById('app-frame');
  if (!host) return null;
  return createPortal(
    <button
      onClick={onClick}
      aria-label={label}
      className="no-print absolute bottom-[92px] right-5 z-30 flex items-center gap-2 rounded-full bg-brand-500 py-3.5 pl-4 pr-5 text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(124,92,252,0.45)] active:scale-95"
    >
      <span className="text-xl leading-none">+</span> {label}
    </button>,
    host,
  );
}

/** Member picker used in forms. */
export function MemberPicker({
  members,
  value,
  onChange,
  allowNone = true,
}: {
  members: Member[];
  value: string | null;
  onChange: (id: string | null) => void;
  allowNone?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {allowNone && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className={clsx(
            'rounded-xl border px-3 py-2 text-[13px] font-semibold',
            value === null ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-ink-soft',
          )}
        >
          Unassigned
        </button>
      )}
      {members.map((m) => (
        <button
          type="button"
          key={m.id}
          onClick={() => onChange(m.id)}
          className={clsx(
            'flex items-center gap-2 rounded-xl border py-1.5 pl-1.5 pr-3 text-[13px] font-semibold',
            value === m.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-ink-soft',
          )}
        >
          <Avatar member={m} size={24} />
          {m.name}
        </button>
      ))}
    </div>
  );
}
