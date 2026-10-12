import { Link } from 'react-router-dom';
import { IconBubble } from '../components/ui';
import { MODULES } from '../nav';

export default function More() {
  const items = MODULES.filter((m) => !['/', '/chores', '/bills', '/stock'].includes(m.to));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {items.map((m) => (
          <Link key={m.to} to={m.to} className="card flex flex-col gap-3 p-4 active:scale-[0.98]">
            <IconBubble tone={m.tone}>{m.icon(22)}</IconBubble>
            <div>
              <div className="text-[15px] font-bold">{m.title}</div>
              <div className="text-[12px] text-ink-soft">{m.label}</div>
            </div>
          </Link>
        ))}
      </div>
      <p className="pt-2 text-center text-[12px] text-ink-mute">Hearth v1.0 · Happy Home. Organized Home.</p>
    </div>
  );
}
