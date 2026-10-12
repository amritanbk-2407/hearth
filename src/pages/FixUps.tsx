import { CheckCircle2, History, ShieldCheck, Trash2, Wrench } from 'lucide-react';
import { useState } from 'react';
import { HomeCareRow } from '../components/rows';
import { Badge, Button, Card, EmptyState, Fab, Field, IconBubble, MemberPicker, PillPicker, Segmented, Sheet, toast } from '../components/ui';
import { daysUntil, prettyDate, relativeDue, relativePast } from '../lib/dates';
import { rupees, titleCase } from '../lib/format';
import { useNewParam, useToday } from '../lib/hooks';
import { assetIcon } from '../lib/icons';
import { nextServiceDate, serviceStatus } from '../logic/selectors';
import { useHearth } from '../store/useHearth';
import type { Asset, AssetType, FixUp, FixUpKind, Priority } from '../types';

type Tab = 'open' | 'assets' | 'history';

function FixUpForm({ fixup, onDone }: { fixup?: FixUp; onDone: () => void }) {
  const s = useHearth();
  const [title, setTitle] = useState(fixup?.title ?? '');
  const [kind, setKind] = useState<FixUpKind>(fixup?.kind ?? 'repair');
  const [priority, setPriority] = useState<Priority>(fixup?.priority ?? 'medium');
  const [assetId, setAssetId] = useState(fixup?.assetId ?? '');
  const [assigneeId, setAssignee] = useState<string | null>(fixup?.assigneeId ?? null);
  const [dueDate, setDueDate] = useState(fixup?.dueDate ?? '');
  const [vendor, setVendor] = useState(fixup?.vendor ?? '');
  const [cost, setCost] = useState(fixup?.cost ? String(fixup.cost) : '');
  const [notes, setNotes] = useState(fixup?.notes ?? '');

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        const data = {
          title: title.trim(),
          kind,
          priority,
          assetId: assetId || undefined,
          assigneeId,
          dueDate: dueDate || undefined,
          vendor: vendor.trim() || undefined,
          cost: Number(cost) || undefined,
          notes: notes.trim() || undefined,
          status: fixup?.status ?? (dueDate ? 'scheduled' : 'open'),
        } as const;
        if (fixup) {
          s.updateFixUp(fixup.id, data);
          toast('Fix-up updated');
        } else {
          s.addFixUp(data);
          toast(kind === 'repair' ? 'Repair reported' : 'Maintenance scheduled');
        }
        onDone();
      }}
    >
      <Field label="What needs fixing?">
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Kitchen tap leaking" />
      </Field>
      <div>
        <span className="label">Type</span>
        <PillPicker
          value={kind}
          onChange={setKind}
          options={[
            { value: 'repair', label: '🔧 Repair' },
            { value: 'maintenance', label: '🛠️ Maintenance' },
          ]}
        />
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
      <Field label="Appliance (optional)">
        <select className="input" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
          <option value="">— None —</option>
          {s.assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </Field>
      <div>
        <span className="label">Who's handling it</span>
        <MemberPicker members={s.members} value={assigneeId} onChange={setAssignee} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Due / visit date">
          <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Est. cost (₹)">
          <input className="input" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value.replace(/[^0-9.]/g, ''))} />
        </Field>
      </div>
      <Field label="Technician / vendor">
        <input className="input" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. Plumber — Suresh" />
      </Field>
      <Field label="Notes">
        <textarea className="input min-h-[64px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="flex gap-3">
        {fixup && (
          <Button
            variant="danger"
            onClick={() => {
              s.deleteFixUp(fixup.id);
              toast('Deleted');
              onDone();
            }}
          >
            <Trash2 size={18} />
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={!title.trim()}>
          {fixup ? 'Save changes' : kind === 'repair' ? 'Report repair' : 'Schedule maintenance'}
        </Button>
      </div>
    </form>
  );
}

function AssetForm({ asset, onDone }: { asset?: Asset; onDone: () => void }) {
  const s = useHearth();
  const [name, setName] = useState(asset?.name ?? '');
  const [type, setType] = useState<AssetType>(asset?.type ?? 'appliance');
  const [brand, setBrand] = useState(asset?.brand ?? '');
  const [location, setLocation] = useState(asset?.location ?? '');
  const [purchaseDate, setPurchase] = useState(asset?.purchaseDate ?? '');
  const [warrantyUntil, setWarranty] = useState(asset?.warrantyUntil ?? '');
  const [interval, setInterval] = useState(asset?.serviceIntervalDays ? String(asset.serviceIntervalDays) : '');
  const [lastServiced, setLast] = useState(asset?.lastServiced ?? '');
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        const data = {
          name: name.trim(),
          type,
          brand: brand.trim() || undefined,
          location: location.trim() || undefined,
          purchaseDate: purchaseDate || undefined,
          warrantyUntil: warrantyUntil || undefined,
          serviceIntervalDays: Number(interval) || undefined,
          lastServiced: lastServiced || undefined,
        };
        if (asset) {
          s.updateAsset(asset.id, data);
          toast('Appliance updated');
        } else {
          s.addAsset(data);
          toast('Appliance added');
        }
        onDone();
      }}
    >
      <Field label="Name">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bedroom AC" />
      </Field>
      <div>
        <span className="label">Type</span>
        <PillPicker
          value={type}
          onChange={setType}
          options={[
            { value: 'appliance', label: 'Appliance' },
            { value: 'electronics', label: 'Electronics' },
            { value: 'fixture', label: 'Fixture' },
            { value: 'vehicle', label: 'Vehicle' },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Brand / model">
          <input className="input" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </Field>
        <Field label="Location">
          <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
        </Field>
        <Field label="Purchased on">
          <input type="date" className="input" value={purchaseDate} onChange={(e) => setPurchase(e.target.value)} />
        </Field>
        <Field label="Warranty until">
          <input type="date" className="input" value={warrantyUntil} onChange={(e) => setWarranty(e.target.value)} />
        </Field>
        <Field label="Service every (days)">
          <input className="input" inputMode="numeric" value={interval} onChange={(e) => setInterval(e.target.value.replace(/\D/g, ''))} placeholder="90" />
        </Field>
        <Field label="Last serviced">
          <input type="date" className="input" value={lastServiced} onChange={(e) => setLast(e.target.value)} />
        </Field>
      </div>
      <div className="flex gap-3">
        {asset && (
          <Button
            variant="danger"
            onClick={() => {
              s.deleteAsset(asset.id);
              toast('Appliance removed');
              onDone();
            }}
          >
            <Trash2 size={18} />
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={!name.trim()}>
          {asset ? 'Save changes' : 'Add appliance'}
        </Button>
      </div>
    </form>
  );
}

function FixUpDetail({ fixup, onEdit, onClose }: { fixup: FixUp; onEdit: () => void; onClose: () => void }) {
  const s = useHearth();
  const [cost, setCost] = useState(fixup.cost ? String(fixup.cost) : '');
  const asset = s.assets.find((a) => a.id === fixup.assetId);
  const who = s.members.find((m) => m.id === fixup.assigneeId)?.name;
  return (
    <div className="space-y-4">
      <div className="space-y-1.5 rounded-3xl bg-slate-50 p-4 text-[14px]">
        <div className="flex gap-2">
          <Badge tone={fixup.kind === 'repair' ? 'amber' : 'blue'}>{titleCase(fixup.kind)}</Badge>
          <Badge tone={fixup.priority === 'high' ? 'rose' : fixup.priority === 'medium' ? 'amber' : 'blue'}>{titleCase(fixup.priority)} priority</Badge>
        </div>
        {asset && <p>Appliance: <b>{asset.name}</b></p>}
        <p>Handled by: <b>{who ?? 'Unassigned'}</b></p>
        {fixup.dueDate && <p>Due: <b>{prettyDate(fixup.dueDate)}</b></p>}
        {fixup.vendor && <p>Vendor: <b>{fixup.vendor}</b></p>}
        {fixup.notes && <p className="text-ink-soft">{fixup.notes}</p>}
      </div>
      <Field label="Final cost (₹) — added to expenses">
        <input className="input" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0" />
      </Field>
      <div className="flex gap-3">
        <Button
          className="flex-1"
          onClick={() => {
            s.completeFixUp(fixup.id, Number(cost) || undefined);
            toast('Marked as done ✓');
            onClose();
          }}
        >
          <CheckCircle2 size={18} /> Mark as done
        </Button>
        <Button variant="soft" onClick={onEdit}>
          Edit
        </Button>
      </div>
    </div>
  );
}

export default function FixUps() {
  const s = useHearth();
  const today = useToday();
  const [tab, setTab] = useState<Tab>('open');
  const [adding, setAdding] = useNewParam();
  const [addingAsset, setAddingAsset] = useState(false);
  const [viewing, setViewing] = useState<FixUp | null>(null);
  const [editing, setEditing] = useState<FixUp | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const open = s.fixups.filter((f) => f.status !== 'done').sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));
  const history = s.fixups.filter((f) => f.status === 'done').sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
  const spent = history.reduce((a, f) => a + (f.cost ?? 0), 0);
  const assets = [...s.assets].sort((a, b) => (nextServiceDate(a) ?? '9999').localeCompare(nextServiceDate(b) ?? '9999'));

  return (
    <div className="space-y-4">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'open', label: 'Fix-ups', count: open.length },
          { value: 'assets', label: 'Appliances', count: s.assets.length },
          { value: 'history', label: 'History', count: history.length },
        ]}
      />

      {tab === 'open' && (
        <Card className="px-4">
          {open.length === 0 ? (
            <EmptyState icon={<Wrench />} title="All fixed up!" hint="Report a repair or schedule maintenance." />
          ) : (
            <div className="divide-y divide-slate-100">
              {open.map((f) => (
                <HomeCareRow
                  key={f.id}
                  item={{ kind: 'fixup', fixup: f, asset: s.assets.find((a) => a.id === f.assetId) }}
                  today={today}
                  onClick={() => setViewing(f)}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'assets' &&
        assets.map((a) => {
          const st = serviceStatus(a, today);
          const next = nextServiceDate(a);
          const w = a.warrantyUntil ? daysUntil(a.warrantyUntil, today) : undefined;
          return (
            <Card key={a.id} className="p-4">
              <button className="flex w-full items-start gap-3 text-left" onClick={() => setEditingAsset(a)}>
                <IconBubble tone="blue">{assetIcon(a)}</IconBubble>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold">{a.name}</div>
                  <div className="text-[13px] text-ink-soft">{[a.brand, a.location].filter(Boolean).join(' · ')}</div>
                </div>
                {st === 'overdue' ? <Badge tone="rose">Overdue</Badge> : st === 'due' ? <Badge tone="amber">Due</Badge> : st === 'good' ? <Badge tone="green">Good</Badge> : null}
              </button>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                <div className="rounded-2xl bg-slate-50 p-2.5">
                  <div className="text-ink-mute">Next service</div>
                  <div className="font-bold">{next ? relativeDue(next, today) : 'Not scheduled'}</div>
                  {a.lastServiced && <div className="text-ink-soft">Last: {relativePast(a.lastServiced, today)}</div>}
                </div>
                <div className="rounded-2xl bg-slate-50 p-2.5">
                  <div className="flex items-center gap-1 text-ink-mute">
                    <ShieldCheck size={12} /> Warranty
                  </div>
                  <div className={`font-bold ${w !== undefined && w <= 30 && w >= 0 ? 'text-amber-600' : ''}`}>
                    {w === undefined ? 'Not recorded' : w < 0 ? 'Expired' : `Till ${prettyDate(a.warrantyUntil!)}`}
                  </div>
                  {w !== undefined && w >= 0 && <div className="text-ink-soft">{w} days left</div>}
                </div>
              </div>
              {a.serviceIntervalDays && (
                <Button
                  variant="soft"
                  className="mt-3 w-full !py-2.5 text-[14px]"
                  onClick={() => {
                    s.logService(a.id);
                    toast(`${a.name} service logged ✓`);
                  }}
                >
                  <CheckCircle2 size={16} /> Log a service today
                </Button>
              )}
            </Card>
          );
        })}

      {tab === 'history' && (
        <>
          <div className="card flex items-center gap-3 p-4">
            <IconBubble tone="purple">
              <History size={20} />
            </IconBubble>
            <div>
              <div className="text-[13px] text-ink-soft">Spent on repairs & maintenance</div>
              <div className="text-[22px] font-extrabold">{rupees(spent)}</div>
            </div>
          </div>
          <Card className="px-4">
            <div className="divide-y divide-slate-100">
              {history.map((f) => (
                <div key={f.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[15px] font-semibold">{f.title}</span>
                    {f.cost ? <span className="text-[14px] font-bold">{rupees(f.cost)}</span> : null}
                  </div>
                  <div className="text-[12px] text-ink-soft">
                    {titleCase(f.kind)} · {f.completedAt ? prettyDate(f.completedAt.slice(0, 10)) : ''}
                    {f.vendor ? ` · ${f.vendor}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {tab !== 'history' && <Fab label={tab === 'assets' ? 'Appliance' : 'Fix-up'} onClick={() => (tab === 'assets' ? setAddingAsset(true) : setAdding(true))} />}

      <Sheet open={adding} onClose={() => setAdding(false)} title="New fix-up">
        <FixUpForm onDone={() => setAdding(false)} />
      </Sheet>
      <Sheet open={!!viewing} onClose={() => setViewing(null)} title={viewing?.title ?? ''}>
        {viewing && (
          <FixUpDetail
            fixup={viewing}
            onClose={() => setViewing(null)}
            onEdit={() => {
              setEditing(viewing);
              setViewing(null);
            }}
          />
        )}
      </Sheet>
      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Edit fix-up">
        {editing && <FixUpForm key={editing.id} fixup={editing} onDone={() => setEditing(null)} />}
      </Sheet>
      <Sheet open={addingAsset} onClose={() => setAddingAsset(false)} title="Add appliance">
        <AssetForm onDone={() => setAddingAsset(false)} />
      </Sheet>
      <Sheet open={!!editingAsset} onClose={() => setEditingAsset(null)} title="Edit appliance">
        {editingAsset && <AssetForm key={editingAsset.id} asset={editingAsset} onDone={() => setEditingAsset(null)} />}
      </Sheet>
    </div>
  );
}
