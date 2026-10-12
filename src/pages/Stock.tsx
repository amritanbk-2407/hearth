import clsx from 'clsx';
import { Link2, Minus, Package, Plus, ShoppingCart, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle } from '../components/rows';
import { Badge, Button, Card, EmptyState, Fab, Field, FilterChips, PillPicker, ProgressBar, Segmented, Sheet, toast } from '../components/ui';
import { daysUntil, relativeDue } from '../lib/dates';
import { pct } from '../lib/format';
import { useNewParam, useToday } from '../lib/hooks';
import { stockEmoji } from '../lib/icons';
import { isLowStock } from '../logic/selectors';
import { useHearth } from '../store/useHearth';
import type { StockCategory, StockItem } from '../types';

type Filter = 'all' | 'low' | StockCategory;

function StockForm({ item, onDone }: { item?: StockItem; onDone: () => void }) {
  const s = useHearth();
  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState<StockCategory>(item?.category ?? 'kitchen');
  const [quantity, setQuantity] = useState(String(item?.quantity ?? ''));
  const [capacity, setCapacity] = useState(String(item?.capacity ?? ''));
  const [threshold, setThreshold] = useState(String(item?.threshold ?? ''));
  const [unit, setUnit] = useState(item?.unit ?? 'pcs');
  const [expiryDate, setExpiry] = useState(item?.expiryDate ?? '');
  const [location, setLocation] = useState(item?.location ?? '');
  const valid = name.trim() && Number(capacity) > 0;
  const num = (v: string) => v.replace(/[^0-9.]/g, '');

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        const data = {
          name: name.trim(),
          category,
          quantity: Number(quantity) || 0,
          capacity: Number(capacity),
          threshold: Number(threshold) || 0,
          unit: unit.trim() || 'pcs',
          expiryDate: expiryDate || undefined,
          location: location.trim() || undefined,
        };
        if (item) {
          s.updateStock(item.id, data);
          toast('Item updated');
        } else {
          s.addStock(data);
          toast('Item added to stock');
        }
        onDone();
      }}
    >
      <Field label="Item">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rice" />
      </Field>
      <div>
        <span className="label">Category</span>
        <PillPicker
          value={category}
          onChange={setCategory}
          options={[
            { value: 'kitchen', label: '🍚 Kitchen' },
            { value: 'cleaning', label: '🧽 Cleaning' },
            { value: 'toiletries', label: '🧼 Toiletries' },
            { value: 'other', label: '📦 Other' },
          ]}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="In stock">
          <input className="input" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(num(e.target.value))} placeholder="0" />
        </Field>
        <Field label="Full at">
          <input className="input" inputMode="decimal" value={capacity} onChange={(e) => setCapacity(num(e.target.value))} placeholder="10" />
        </Field>
        <Field label="Unit">
          <input className="input" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg" />
        </Field>
      </div>
      <Field label="Alert me when it drops to">
        <input className="input" inputMode="decimal" value={threshold} onChange={(e) => setThreshold(num(e.target.value))} placeholder="2" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Expiry (optional)">
          <input type="date" className="input" value={expiryDate} onChange={(e) => setExpiry(e.target.value)} />
        </Field>
        <Field label="Stored in">
          <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Kitchen" />
        </Field>
      </div>
      <div className="flex gap-3">
        {item && (
          <Button
            variant="danger"
            onClick={() => {
              s.deleteStock(item.id);
              toast('Item removed');
              onDone();
            }}
          >
            <Trash2 size={18} />
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={!valid}>
          {item ? 'Save changes' : 'Add item'}
        </Button>
      </div>
    </form>
  );
}

function StockCard({ item, today, onEdit }: { item: StockItem; today: string; onEdit: () => void }) {
  const adjust = useHearth((s) => s.adjustStock);
  const left = pct(item.quantity, item.capacity);
  const low = isLowStock(item);
  const exp = item.expiryDate ? daysUntil(item.expiryDate, today) : undefined;
  const step = item.capacity >= 5 ? 1 : item.capacity >= 2 ? 0.5 : 0.1;
  return (
    <div className="flex items-center gap-3 py-3">
      <button onClick={onEdit} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-[24px]">
        {stockEmoji(item)}
      </button>
      <button onClick={onEdit} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold">{item.name}</span>
          {low && <Badge tone={item.quantity <= 0 ? 'rose' : 'amber'}>{item.quantity <= 0 ? 'Out' : 'Low'}</Badge>}
          {exp !== undefined && exp <= 5 && <Badge tone="rose">{exp < 0 ? 'Expired' : `Exp ${relativeDue(item.expiryDate!, today).toLowerCase()}`}</Badge>}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <ProgressBar value={left} tone={left <= 20 ? 'rose' : low || left <= 35 ? 'amber' : 'green'} className="h-1.5 w-24" />
          <span className="text-[12px] text-ink-soft">
            {item.quantity} / {item.capacity} {item.unit}
          </span>
        </div>
      </button>
      <div className="flex items-center gap-1">
        <button onClick={() => adjust(item.id, -step)} className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-ink-soft" aria-label="Use some">
          <Minus size={16} />
        </button>
        <button onClick={() => adjust(item.id, step)} className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-brand-600" aria-label="Add some">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function ShoppingList() {
  const s = useHearth();
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const open = s.shopping.filter((i) => !i.done);
  const bought = s.shopping.filter((i) => i.done);
  const lowNotListed = s.stock.filter((x) => isLowStock(x) && !s.shopping.some((i) => !i.done && i.stockItemId === x.id));

  return (
    <div className="space-y-4">
      {lowNotListed.length > 0 && (
        <button
          onClick={() => {
            const n = s.addLowStockToShopping();
            toast(`Added ${n} low-stock item${n === 1 ? '' : 's'}`);
          }}
          className="flex w-full items-center gap-3 rounded-3xl border border-brand-100 bg-brand-50 p-4 text-left"
        >
          <Sparkles className="text-brand-500" size={22} />
          <div className="flex-1">
            <div className="text-[14px] font-bold text-brand-700">Smart fill: add {lowNotListed.length} low items</div>
            <div className="text-[12px] text-brand-600/80">{lowNotListed.map((x) => x.name).join(', ')}</div>
          </div>
        </button>
      )}

      <form
        className="card flex gap-2 p-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          s.addShoppingItem({ name: name.trim(), quantity: Number(qty) || 1, unit: unit.trim() || 'pcs' });
          setName('');
          setQty('1');
        }}
      >
        <input className="input flex-1 !py-2.5" placeholder="Add an item…" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input !w-14 !px-2 !py-2.5 text-center" value={qty} onChange={(e) => setQty(e.target.value.replace(/[^0-9.]/g, ''))} aria-label="Quantity" />
        <input className="input !w-16 !px-2 !py-2.5 text-center" value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Unit" />
        <button type="submit" className="grid w-11 place-items-center rounded-2xl bg-brand-500 text-white" aria-label="Add">
          <Plus size={20} />
        </button>
      </form>

      <Card className="px-4">
        {open.length === 0 ? (
          <EmptyState icon={<ShoppingCart />} title="Shopping list is empty" hint="Low-stock items can be added automatically." />
        ) : (
          <div className="divide-y divide-slate-100">
            {open.map((i) => (
              <div key={i.id} className="flex items-center gap-3 py-3">
                <CheckCircle
                  done={false}
                  onClick={() => {
                    s.toggleShopping(i.id);
                    if (i.stockItemId) toast(`${i.name} restocked ✓`);
                  }}
                />
                <span className="text-xl">{stockEmoji(i)}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold">{i.name}</div>
                  <div className="flex items-center gap-1 text-[12px] text-ink-soft">
                    {i.quantity} {i.unit}
                    {i.stockItemId && (
                      <>
                        <span>·</span>
                        <Link2 size={12} /> restocks pantry
                      </>
                    )}
                  </div>
                </div>
                <button onClick={() => s.deleteShopping(i.id)} className="p-2 text-ink-mute" aria-label="Remove">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {bought.length > 0 && (
        <Card className="px-4 pb-2 pt-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold uppercase tracking-wider text-ink-mute">Bought · {bought.length}</p>
            <button onClick={s.clearBoughtShopping} className="text-[13px] font-semibold text-brand-600">
              Clear
            </button>
          </div>
          {bought.map((i) => (
            <div key={i.id} className="flex items-center gap-3 py-2.5">
              <CheckCircle done onClick={() => s.toggleShopping(i.id)} />
              <span className="text-[15px] text-ink-mute line-through">
                {i.name} · {i.quantity} {i.unit}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

export default function Stock() {
  const s = useHearth();
  const today = useToday();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'shopping' ? 'shopping' : 'stock';
  const [filter, setFilter] = useState<Filter>('all');
  const [adding, setAdding] = useNewParam();
  const [editing, setEditing] = useState<StockItem | null>(null);

  const low = s.stock.filter(isLowStock);
  const expiring = s.stock.filter((x) => x.expiryDate && daysUntil(x.expiryDate, today) <= 5);
  const list = s.stock
    .filter((x) => (filter === 'all' ? true : filter === 'low' ? isLowStock(x) : x.category === filter))
    .sort((a, b) => Number(isLowStock(b)) - Number(isLowStock(a)) || a.quantity / a.capacity - b.quantity / b.capacity);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Items', value: s.stock.length, cls: 'text-ink' },
          { label: 'Running low', value: low.length, cls: 'text-amber-600' },
          { label: 'Expiring', value: expiring.length, cls: 'text-rose-500' },
        ].map((x) => (
          <div key={x.label} className="card p-3 text-center">
            <div className={clsx('text-[24px] font-extrabold', x.cls)}>{x.value}</div>
            <div className="text-[12px] font-semibold text-ink-soft">{x.label}</div>
          </div>
        ))}
      </div>

      <Segmented
        value={tab}
        onChange={(v) => setParams(v === 'shopping' ? { tab: 'shopping' } : {}, { replace: true })}
        options={[
          { value: 'stock', label: 'Pantry & supplies', count: s.stock.length },
          { value: 'shopping', label: 'Shopping list', count: s.shopping.filter((i) => !i.done).length },
        ]}
      />

      {tab === 'stock' ? (
        <>
          <FilterChips
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'low', label: `Low (${low.length})` },
              { value: 'kitchen', label: 'Kitchen' },
              { value: 'cleaning', label: 'Cleaning' },
              { value: 'toiletries', label: 'Toiletries' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <Card className="px-4">
            {list.length === 0 ? (
              <EmptyState icon={<Package />} title="Nothing here" hint="Add groceries and supplies to track them." />
            ) : (
              <div className="divide-y divide-slate-100">
                {list.map((i) => (
                  <StockCard key={i.id} item={i} today={today} onEdit={() => setEditing(i)} />
                ))}
              </div>
            )}
          </Card>
          <Fab label="Item" onClick={() => setAdding(true)} />
        </>
      ) : (
        <ShoppingList />
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add to stock">
        <StockForm onDone={() => setAdding(false)} />
      </Sheet>
      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Edit item">
        {editing && <StockForm key={editing.id} item={editing} onDone={() => setEditing(null)} />}
      </Sheet>
    </div>
  );
}
