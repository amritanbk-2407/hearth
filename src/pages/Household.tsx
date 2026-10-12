import { Copy, Crown, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Avatar, Badge, Button, Card, Fab, Field, PillPicker, Sheet, toast } from '../components/ui';
import { prettyDate, shiftDays } from '../lib/dates';
import { useToday } from '../lib/hooks';
import { can, roleDescription, roleLabel } from '../logic/permissions';
import { useHearth, useMe } from '../store/useHearth';
import type { Member, Role } from '../types';

const roleOptions: Array<{ value: Role; label: string }> = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'helper', label: 'Helper' },
];

function MemberForm({ member, onDone }: { member?: Member; onDone: () => void }) {
  const s = useHearth();
  const [name, setName] = useState(member?.name ?? '');
  const [role, setRole] = useState<Role>(member?.role ?? 'member');
  const admins = s.members.filter((m) => m.role === 'admin');
  const lastAdmin = member?.role === 'admin' && admins.length === 1;
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (member) {
          s.updateMember(member.id, { name: name.trim(), role: lastAdmin ? 'admin' : role });
          toast('Member updated');
        } else {
          s.addMember({ name: name.trim(), role });
          toast(`${name.trim()} added`);
        }
        onDone();
      }}
    >
      <Field label="Name">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rohan" />
      </Field>
      <div>
        <span className="label">Role</span>
        <PillPicker value={role} onChange={setRole} options={roleOptions} />
        <p className="mt-2 text-[12px] text-ink-soft">{roleDescription[role]}</p>
        {lastAdmin && <p className="mt-1 text-[12px] font-semibold text-amber-600">A household needs at least one admin.</p>}
      </div>
      <div className="flex gap-3">
        {member && !lastAdmin && member.id !== s.currentMemberId && (
          <Button
            variant="danger"
            onClick={() => {
              s.removeMember(member.id);
              toast(`${member.name} removed`);
              onDone();
            }}
          >
            <Trash2 size={18} />
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={!name.trim()}>
          {member ? 'Save' : 'Add member'}
        </Button>
      </div>
    </form>
  );
}

export default function Household() {
  const s = useHearth();
  const me = useMe();
  const today = useToday();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const manage = can(me?.role, 'manageMembers');
  const from = shiftDays(today, -29);

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] bg-gradient-to-br from-rose-50 via-white to-brand-50 p-5 shadow-card">
        <p className="text-[12px] font-bold uppercase tracking-wider text-ink-mute">Household</p>
        <h2 className="mt-1 text-[22px] font-extrabold leading-tight">{s.household?.name}</h2>
        <p className="text-[13px] text-ink-soft">Since {s.household ? prettyDate(s.household.createdAt.slice(0, 10)) : ''}</p>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-3">
          <div>
            <div className="text-[11px] font-semibold text-ink-mute">Invite code</div>
            <div className="text-[18px] font-extrabold tracking-[0.2em] text-brand-600">{s.household?.inviteCode}</div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(s.household?.inviteCode ?? '').catch(() => {});
              toast('Invite code copied');
            }}
            className="flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-[13px] font-bold text-brand-600"
          >
            <Copy size={14} /> Copy
          </button>
        </div>
      </div>

      <Card className="px-4">
        <div className="divide-y divide-slate-100">
          {s.members.map((m) => {
            const assigned = s.chores.filter((c) => c.active && c.assigneeId === m.id).length;
            const done = s.completions.filter((c) => c.memberId === m.id && c.date >= from).length;
            return (
              <button key={m.id} onClick={() => manage && setEditing(m)} className="flex w-full items-center gap-3 py-3.5 text-left">
                <Avatar member={m} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[15px] font-bold">
                    {m.name}
                    {m.id === me?.id && <span className="text-[12px] font-semibold text-ink-mute">(you)</span>}
                    {m.role === 'admin' && <Crown size={14} className="text-amber-500" />}
                  </div>
                  <div className="text-[13px] text-ink-soft">
                    {assigned} chore{assigned === 1 ? '' : 's'} assigned · {done} done in 30 days
                  </div>
                </div>
                <Badge tone={m.role === 'admin' ? 'purple' : m.role === 'helper' ? 'amber' : 'blue'}>{roleLabel[m.role]}</Badge>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <p className="mb-2 text-[15px] font-bold">What each role can do</p>
        <div className="space-y-2 text-[13px]">
          {roleOptions.map((r) => (
            <div key={r.value} className="flex gap-2">
              <span className="w-16 shrink-0 font-bold">{r.label}</span>
              <span className="text-ink-soft">{roleDescription[r.value]}</span>
            </div>
          ))}
        </div>
      </Card>

      {manage && (
        <>
          <Fab label="Member" onClick={() => setAdding(true)} />
          <p className="flex items-center justify-center gap-1 text-center text-[12px] text-ink-mute">
            <UserPlus size={14} /> Tap a member to change their role
          </p>
        </>
      )}
      <Sheet open={adding} onClose={() => setAdding(false)} title="Add member">
        <MemberForm onDone={() => setAdding(false)} />
      </Sheet>
      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Edit member">
        {editing && <MemberForm key={editing.id} member={editing} onDone={() => setEditing(null)} />}
      </Sheet>
    </div>
  );
}
