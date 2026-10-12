import clsx from 'clsx';
import { Pin, StickyNote, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, EmptyState, Fab, Field, Sheet, toast } from '../components/ui';
import { relativePast } from '../lib/dates';
import { useNewParam, useToday } from '../lib/hooks';
import { useHearth } from '../store/useHearth';
import type { Note, NoteColor } from '../types';

const COLORS: Record<NoteColor, string> = {
  yellow: 'bg-amber-50 border-amber-100',
  green: 'bg-emerald-50 border-emerald-100',
  blue: 'bg-sky-50 border-sky-100',
  pink: 'bg-rose-50 border-rose-100',
  purple: 'bg-brand-50 border-brand-100',
};
const DOT: Record<NoteColor, string> = { yellow: '#fbbf24', green: '#34d399', blue: '#38bdf8', pink: '#fb7185', purple: '#9b84ff' };

function NoteForm({ note, onDone }: { note?: Note; onDone: () => void }) {
  const s = useHearth();
  const [title, setTitle] = useState(note?.title ?? '');
  const [body, setBody] = useState(note?.body ?? '');
  const [color, setColor] = useState<NoteColor>(note?.color ?? 'yellow');
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        if (note) s.updateNote(note.id, { title: title.trim(), body, color });
        else s.addNote({ title: title.trim(), body, color });
        toast(note ? 'Note saved' : 'Note added');
        onDone();
      }}
    >
      <Field label="Title">
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Guests on Saturday" autoFocus={!note} />
      </Field>
      <Field label="Note">
        <textarea className="input min-h-[140px]" value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <div className="flex gap-2">
        {(Object.keys(COLORS) as NoteColor[]).map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setColor(c)}
            className={clsx('h-9 w-9 rounded-full border-4', color === c ? 'border-ink/20' : 'border-transparent')}
            style={{ background: DOT[c] }}
            aria-label={c}
          />
        ))}
      </div>
      <div className="flex gap-3">
        {note && (
          <Button
            variant="danger"
            onClick={() => {
              s.deleteNote(note.id);
              toast('Note deleted');
              onDone();
            }}
          >
            <Trash2 size={18} />
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={!title.trim()}>
          Save note
        </Button>
      </div>
    </form>
  );
}

export default function Notes() {
  const s = useHearth();
  const today = useToday();
  const [adding, setAdding] = useNewParam();
  const [editing, setEditing] = useState<Note | null>(null);
  const notes = [...s.notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="space-y-4">
      {notes.length === 0 ? (
        <Card>
          <EmptyState icon={<StickyNote />} title="No notes yet" hint="Keep contacts, guest lists and reminders here." />
        </Card>
      ) : (
        <div className="columns-2 gap-3 [&>*]:mb-3">
          {notes.map((n) => (
            <div
              key={n.id}
              onClick={() => setEditing(n)}
              className={clsx('cursor-pointer break-inside-avoid rounded-3xl border p-4 shadow-card', COLORS[n.color])}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-[15px] font-bold leading-snug">{n.title}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    s.updateNote(n.id, { pinned: !n.pinned });
                  }}
                  className={n.pinned ? 'text-brand-600' : 'text-ink-mute/60'}
                  aria-label="Pin"
                >
                  <Pin size={16} fill={n.pinned ? 'currentColor' : 'none'} />
                </button>
              </div>
              <p className="mt-2 whitespace-pre-line text-[13px] text-ink-soft">{n.body}</p>
              <p className="mt-3 text-[11px] text-ink-mute">
                {s.members.find((m) => m.id === n.authorId)?.name ?? '—'} · {relativePast(n.updatedAt.slice(0, 10), today)}
              </p>
            </div>
          ))}
        </div>
      )}
      <Fab label="Note" onClick={() => setAdding(true)} />
      <Sheet open={adding} onClose={() => setAdding(false)} title="New note">
        <NoteForm onDone={() => setAdding(false)} />
      </Sheet>
      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Edit note">
        {editing && <NoteForm key={editing.id} note={editing} onDone={() => setEditing(null)} />}
      </Sheet>
    </div>
  );
}
