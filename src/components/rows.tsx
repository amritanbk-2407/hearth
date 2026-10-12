import clsx from 'clsx';
import { Check, Repeat } from 'lucide-react';
import { daysUntil, relativeDue, relativePast } from '../lib/dates';
import { pct, rupees, titleCase } from '../lib/format';
import { assetIcon, billVisual, stockEmoji } from '../lib/icons';
import { isLowStock, nextServiceDate, serviceStatus } from '../logic/selectors';
import type { Asset, Bill, Chore, ChoreCompletion, FixUp, Member, StockItem } from '../types';
import { Badge, IconBubble, ProgressBar, priorityTone } from './ui';

// ------------------------------------------------------------------ chores
export function CheckCircle({ done, onClick, disabled }: { done: boolean; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      disabled={disabled}
      aria-label={done ? 'Mark as not done' : 'Mark as done'}
      className={clsx(
        'grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition',
        done ? 'animate-pop border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white hover:border-emerald-400',
      )}
    >
      {done && <Check size={16} strokeWidth={3} />}
    </button>
  );
}

export function PendingChoreRow({
  chore,
  members,
  today,
  onToggle,
  onOpen,
  showDue,
}: {
  chore: Chore;
  members: Member[];
  today: string;
  onToggle: () => void;
  onOpen?: () => void;
  showDue?: boolean;
}) {
  const who = members.find((m) => m.id === chore.assigneeId)?.name ?? 'Unassigned';
  const overdue = chore.dueDate < today;
  return (
    <div className="flex items-center gap-3 py-3" onClick={onOpen}>
      <CheckCircle done={false} onClick={onToggle} />
      <div className={clsx('min-w-0 flex-1', onOpen && 'cursor-pointer')}>
        <div className="truncate text-[15px] font-semibold">{chore.title}</div>
        <div className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-ink-soft">
          {who}
          {chore.recurrence !== 'none' && (
            <>
              <span>·</span>
              <Repeat size={12} /> {titleCase(chore.recurrence)}
            </>
          )}
          {(showDue || overdue) && (
            <>
              <span>·</span>
              <span className={overdue ? 'font-semibold text-rose-500' : ''}>{relativeDue(chore.dueDate, today)}</span>
            </>
          )}
        </div>
      </div>
      <Badge tone={priorityTone[chore.priority]}>{titleCase(chore.priority)}</Badge>
    </div>
  );
}

export function DoneChoreRow({
  completion,
  members,
  onToggle,
}: {
  completion: ChoreCompletion;
  members: Member[];
  onToggle: () => void;
}) {
  const who = members.find((m) => m.id === completion.memberId)?.name ?? 'Someone';
  return (
    <div className="flex items-center gap-3 py-3">
      <CheckCircle done onClick={onToggle} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold text-ink-soft line-through decoration-ink-mute">{completion.title}</div>
        <div className="mt-0.5 text-[13px] text-ink-soft">{who}</div>
      </div>
      <Badge tone="green">Done</Badge>
    </div>
  );
}

// ------------------------------------------------------------------- bills
export function BillRow({ bill, today, onClick }: { bill: Bill; today: string; onClick?: () => void }) {
  const v = billVisual[bill.category];
  const overdue = !bill.isPaid && daysUntil(bill.dueDate, today) < 0;
  return (
    <div className={clsx('flex items-center gap-3 py-3', onClick && 'cursor-pointer active:opacity-70')} onClick={onClick}>
      <IconBubble tone={v.tone}>{v.icon(20)}</IconBubble>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold">{bill.name}</div>
        <div className="mt-0.5 truncate text-[13px] text-ink-soft">
          <span className="font-semibold text-ink">{rupees(bill.amount)}</span>
          <span className="mx-1.5">·</span>
          <span className={overdue ? 'font-semibold text-rose-500' : ''}>
            {overdue ? relativeDue(bill.dueDate, today) : `Due ${relativeDue(bill.dueDate, today).toLowerCase()}`}
          </span>
        </div>
      </div>
      {bill.isPaid ? <Badge tone="green">Paid</Badge> : <Badge tone="rose">{overdue ? 'Overdue' : 'Unpaid'}</Badge>}
    </div>
  );
}

// ------------------------------------------------------------------- stock
export function StockBarRow({ item, onClick }: { item: StockItem; onClick?: () => void }) {
  const left = pct(item.quantity, item.capacity);
  const tone = left <= 20 ? 'rose' : left <= 35 ? 'amber' : 'green';
  return (
    <div className={clsx('flex items-center gap-3 py-2.5', onClick && 'cursor-pointer')} onClick={onClick}>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-50 text-[22px]">{stockEmoji(item)}</div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold">{item.name}</div>
        <div className="text-[13px] text-ink-soft">{left}% left</div>
      </div>
      <div className="w-[38%]">
        <ProgressBar value={left} tone={isLowStock(item) ? (tone === 'green' ? 'amber' : tone) : tone} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ fixups
export type HomeCareItem =
  | { kind: 'fixup'; fixup: FixUp; asset?: Asset }
  | { kind: 'asset'; asset: Asset };

export function HomeCareRow({ item, today, onClick }: { item: HomeCareItem; today: string; onClick?: () => void }) {
  if (item.kind === 'asset') {
    const a = item.asset;
    const s = serviceStatus(a, today);
    const next = nextServiceDate(a);
    return (
      <div className={clsx('flex items-center gap-3 py-3', onClick && 'cursor-pointer')} onClick={onClick}>
        <IconBubble tone="blue">{assetIcon(a)}</IconBubble>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold">{a.name}</div>
          <div className="truncate text-[13px] text-ink-soft">
            {s === 'overdue' || s === 'due'
              ? `Service ${s === 'overdue' ? 'overdue' : 'due ' + relativeDue(next!, today).toLowerCase()}`
              : a.lastServiced
                ? `Last serviced ${relativePast(a.lastServiced, today)}`
                : 'No service history'}
          </div>
        </div>
        {s === 'overdue' ? (
          <Badge tone="rose">Overdue</Badge>
        ) : s === 'due' ? (
          <Badge tone="amber">Due</Badge>
        ) : (
          <Badge tone="green">Good</Badge>
        )}
      </div>
    );
  }
  const f = item.fixup;
  const d = f.dueDate ? daysUntil(f.dueDate, today) : undefined;
  return (
    <div className={clsx('flex items-center gap-3 py-3', onClick && 'cursor-pointer')} onClick={onClick}>
      <IconBubble tone={f.kind === 'repair' ? 'amber' : 'blue'}>
        {item.asset ? assetIcon(item.asset) : assetIcon({ name: f.title, type: 'fixture' })}
      </IconBubble>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold">{f.title}</div>
        <div className="truncate text-[13px] text-ink-soft">
          {f.status === 'done'
            ? `Completed ${relativePast(f.completedAt!.slice(0, 10), today)}${f.cost ? ` · ${rupees(f.cost)}` : ''}`
            : f.dueDate
              ? d! < 0
                ? relativeDue(f.dueDate, today)
                : `Due ${relativeDue(f.dueDate, today).toLowerCase()}`
              : `Reported ${relativePast(f.createdAt.slice(0, 10), today)}`}
        </div>
      </div>
      {f.status === 'done' ? (
        <Badge tone="green">Done</Badge>
      ) : d !== undefined && d <= 1 ? (
        <Badge tone="rose">{d < 0 ? 'Overdue' : 'Due'}</Badge>
      ) : f.status === 'scheduled' ? (
        <Badge tone="blue">Scheduled</Badge>
      ) : (
        <Badge tone="amber">Pending</Badge>
      )}
    </div>
  );
}
