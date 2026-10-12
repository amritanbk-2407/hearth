import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { Avatar, Card, FilterChips } from '../components/ui';
import { daysUntil } from '../lib/dates';
import { useToday } from '../lib/hooks';
import { useHearth } from '../store/useHearth';
import type { Module } from '../types';

export default function Activity() {
  const s = useHearth();
  const today = useToday();
  const [filter, setFilter] = useState<'all' | Module>('all');
  const list = s.activity.filter((a) => filter === 'all' || a.module === filter).sort((a, b) => b.at.localeCompare(a.at));

  const groups = list.reduce<Record<string, typeof list>>((acc, a) => {
    const d = format(parseISO(a.at), 'yyyy-MM-dd');
    (acc[d] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <FilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'Everything' },
          { value: 'chores', label: 'Chores' },
          { value: 'bills', label: 'Money' },
          { value: 'stock', label: 'Stock' },
          { value: 'fixups', label: 'Fix-ups' },
          { value: 'household', label: 'Members' },
          { value: 'notes', label: 'Notes' },
        ]}
      />
      {Object.entries(groups).map(([day, items]) => (
        <Card key={day} className="px-4 pb-1 pt-3">
          <p className="text-[12px] font-bold uppercase tracking-wider text-ink-mute">{daysUntil(day, today) === 0 ? 'Today' : daysUntil(day, today) === -1 ? 'Yesterday' : format(parseISO(day), 'EEEE, d MMM')}</p>
          <div className="divide-y divide-slate-100">
            {items.map((a) => {
              const m = s.members.find((x) => x.id === a.memberId);
              return (
                <div key={a.id} className="flex items-center gap-3 py-3">
                  {m ? <Avatar member={m} size={32} /> : <div className="h-8 w-8 rounded-full bg-slate-200" />}
                  <div className="min-w-0 flex-1 text-[14px]">
                    <b>{m?.name ?? 'Someone'}</b> {a.message}
                  </div>
                  <span className="text-[11px] text-ink-mute">{format(parseISO(a.at), 'h:mm a')}</span>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
      {list.length === 0 && <p className="py-10 text-center text-sm text-ink-soft">No activity yet.</p>}
    </div>
  );
}
