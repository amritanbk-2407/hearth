import { ClipboardList, Scale, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DoneChoreRow, PendingChoreRow } from '../components/rows';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Fab,
  Field,
  FilterChips,
  MemberPicker,
  PillPicker,
  ProgressBar,
  Segmented,
  Sheet,
  priorityTone,
  toast,
} from '../components/ui';
import { relativeDue } from '../lib/dates';
import { titleCase } from '../lib/format';
import { useNewParam, useToday } from '../lib/hooks';
import { analyseFairness } from '../logic/fairness';
import { can } from '../logic/permissions';
import { useHearth, useMe } from '../store/useHearth';
import type { Chore, ChoreRecurrence, Priority } from '../types';

type Tab = 'today' | 'upcoming' | 'all';

const EFFORT_LABEL = ['', 'Quick', 'Light', 'Moderate', 'Heavy', 'Very heavy'];

function ChoreForm({ chore, onDone }: { chore?: Chore; onDone: () => void }) {
  const s = useHearth();
  const today = useToday();
  const [title, setTitle] = useState(chore?.title ?? '');
  const [room, setRoom] = useState(chore?.room ?? '');
  const [assigneeId, setAssignee] = useState<string | null>(chore?.assigneeId ?? s.currentMemberId);
  const [priority, setPriority] = useState<Priority>(chore?.priority ?? 'medium');
  const [effort, setEffort] = useState(chore?.effort ?? 2);
  const [recurrence, setRecurrence] = useState<ChoreRecurrence>(chore?.recurrence ?? 'none');
  const [dueDate, setDueDate] = useState(chore?.dueDate ?? today);
  const [notes, setNotes] = useState(chore?.notes ?? '');

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        const data = { title: title.trim(), room: room.trim() || 'Home', assigneeId, priority, effort, recurrence, dueDate, notes: notes.trim() || undefined };
        if (chore) {
          s.updateChore(chore.id, { ...data, active: true });
          toast('Chore updated');
        } else {
          s.addChore(data);
          toast('Chore added');
        }
        onDone();
      }}
    >
      <Field label="Chore">
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Clean kitchen" autoFocus={!chore} />
      </Field>
      <Field label="Room / area">
        <input className="input" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. Kitchen" />
      </Field>
      <div>
        <span className="label">Assign to</span>
        <MemberPicker members={s.members} value={assigneeId} onChange={setAssignee} />
      </div>
      <div>
        <span className="label">Priority</span>
        <PillPicker
          value={priority}
          onChange={setPriority}
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]}
        />
      </div>
      <div>
        <span className="label">Repeats</span>
        <PillPicker
          value={recurrence}
          onChange={setRecurrence}
          options={[
            { value: 'none', label: 'One time' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
        />
      </div>
      <div>
        <span className="label">
          Effort: <span className="text-brand-600">{EFFORT_LABEL[effort]}</span>{' '}
          <span className="font-normal text-ink-mute">(used for fair-share analysis)</span>
        </span>
        <input type="range" min={1} max={5} value={effort} onChange={(e) => setEffort(Number(e.target.value))} className="w-full accent-brand-500" />
      </div>
      <Field label={recurrence === 'none' ? 'Due date' : 'Next due'}>
        <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </Field>
      <Field label="Notes (optional)">
        <textarea className="input min-h-[70px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="flex gap-3 pt-1">
        {chore && (
          <Button
            variant="danger"
            onClick={() => {
              s.deleteChore(chore.id);
              toast('Chore deleted');
              onDone();
            }}
          >
            <Trash2 size={18} />
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={!title.trim()}>
          {chore ? 'Save changes' : 'Add chore'}
        </Button>
      </div>
    </form>
  );
}

export default function Chores() {
  const s = useHearth();
  const me = useMe();
  const today = useToday();
  const [tab, setTab] = useState<Tab>('today');
  const [who, setWho] = useState<string>('all');
  const [adding, setAdding] = useNewParam();
  const [editing, setEditing] = useState<Chore | null>(null);

  const mine = (id: string | null) => who === 'all' || id === who;
  const canManage = can(me?.role, 'manageChores');

  const pending = s.chores
    .filter((c) => c.active && c.dueDate <= today && mine(c.assigneeId))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const done = s.completions.filter((c) => c.date === today && mine(c.memberId)).sort((a, b) => b.at.localeCompare(a.at));
  const upcoming = s.chores.filter((c) => c.active && c.dueDate > today && mine(c.assigneeId)).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const all = s.chores.filter((c) => mine(c.assigneeId)).sort((a, b) => a.title.localeCompare(b.title));
  const fairness = useMemo(() => analyseFairness(s.members, s.completions, today), [s.members, s.completions, today]);

  const grouped = upcoming.reduce<Record<string, Chore[]>>((acc, c) => {
    (acc[c.dueDate] ??= []).push(c);
    return acc;
  }, {});

  const complete = (c: Chore) => {
    if (!can(me?.role, 'completeChores')) return;
    s.completeChore(c.id);
    toast(`“${c.title}” done ✓`);
  };
  const open = (c: Chore) => canManage && setEditing(c);

  return (
    <div className="space-y-4">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'today', label: 'Today', count: pending.length + done.length },
          { value: 'upcoming', label: 'Upcoming', count: upcoming.length },
          { value: 'all', label: 'All chores', count: all.length },
        ]}
      />
      <FilterChips
        value={who}
        onChange={setWho}
        options={[{ value: 'all', label: 'Everyone' }, ...s.members.map((m) => ({ value: m.id, label: m.id === me?.id ? `${m.name} (me)` : m.name }))]}
      />

      {tab === 'today' && (
        <Card className="p-4">
          <div className="mb-1 flex items-center gap-3">
            <span className="text-[14px] font-semibold">Progress</span>
            <ProgressBar value={pending.length + done.length ? (done.length / (pending.length + done.length)) * 100 : 100} className="flex-1" />
            <span className="text-[14px] font-semibold">
              {done.length} / {pending.length + done.length}
            </span>
          </div>
          {pending.length + done.length === 0 ? (
            <EmptyState icon={<ClipboardList />} title="Nothing due today" hint="Enjoy the free time 🎉" />
          ) : (
            <div className="divide-y divide-slate-100">
              {pending.map((c) => (
                <PendingChoreRow key={c.id} chore={c} members={s.members} today={today} onToggle={() => complete(c)} onOpen={() => open(c)} />
              ))}
              {done.map((c) => (
                <DoneChoreRow key={c.id} completion={c} members={s.members} onToggle={() => s.undoCompletion(c.id)} />
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'upcoming' &&
        (upcoming.length === 0 ? (
          <Card>
            <EmptyState icon={<ClipboardList />} title="No upcoming chores" />
          </Card>
        ) : (
          Object.entries(grouped).map(([date, list]) => (
            <Card key={date} className="px-4 pb-1 pt-3">
              <p className="text-[12px] font-bold uppercase tracking-wider text-ink-mute">{relativeDue(date, today)}</p>
              <div className="divide-y divide-slate-100">
                {list.map((c) => (
                  <PendingChoreRow key={c.id} chore={c} members={s.members} today={today} onToggle={() => complete(c)} onOpen={() => open(c)} />
                ))}
              </div>
            </Card>
          ))
        ))}

      {tab === 'all' && (
        <>
          <Link to="/insights" className="card flex items-center gap-3 p-4">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <Scale size={20} />
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-bold">Fair share: {fairness.label}</div>
              <div className="text-[13px] text-ink-soft">
                Fairness index {fairness.index.toFixed(2)} (1.00 = perfectly equal) · last 30 days
              </div>
            </div>
          </Link>
          <Card className="px-4">
            <div className="divide-y divide-slate-100">
              {all.map((c) => {
                const m = s.members.find((x) => x.id === c.assigneeId);
                return (
                  <button key={c.id} onClick={() => open(c)} className="flex w-full items-center gap-3 py-3 text-left">
                    {m ? <Avatar member={m} size={34} /> : <div className="h-[34px] w-[34px] rounded-full bg-slate-200" />}
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-[15px] font-semibold ${c.active ? '' : 'text-ink-mute line-through'}`}>{c.title}</div>
                      <div className="truncate text-[13px] text-ink-soft">
                        {c.room} · {c.recurrence === 'none' ? 'One time' : titleCase(c.recurrence)} · Effort {c.effort}
                        {c.active && ` · ${relativeDue(c.dueDate, today)}`}
                      </div>
                    </div>
                    <Badge tone={priorityTone[c.priority]}>{titleCase(c.priority)}</Badge>
                  </button>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {canManage && <Fab label="Chore" onClick={() => setAdding(true)} />}
      <Sheet open={adding} onClose={() => setAdding(false)} title="New chore">
        <ChoreForm onDone={() => setAdding(false)} />
      </Sheet>
      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Edit chore">
        {editing && <ChoreForm key={editing.id} chore={editing} onDone={() => setEditing(null)} />}
      </Sheet>
    </div>
  );
}
