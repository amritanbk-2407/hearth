import { ArrowRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import HouseArt from '../components/HouseArt';
import { Button, Field } from '../components/ui';
import { useHearth } from '../store/useHearth';

/** First-run screen: try the demo household or set up your own. */
export default function Welcome() {
  const loadDemo = useHearth((s) => s.loadDemo);
  const createHousehold = useHearth((s) => s.createHousehold);
  const [mode, setMode] = useState<'start' | 'create'>('start');
  const [home, setHome] = useState('');
  const [name, setName] = useState('');

  return (
    <div className="phone-frame" id="app-frame">
      <div className="safe-top flex flex-1 flex-col overflow-y-auto px-6 pb-10">
        <div className="mt-10 flex items-center gap-3">
          <img src="pwa-192.png" alt="" className="h-14 w-14 rounded-2xl shadow-card" />
          <div>
            <h1 className="text-[32px] font-extrabold leading-none tracking-tight">Hearth</h1>
            <p className="mt-1 text-[14px] text-ink-soft">Happy Home. Organized Home.</p>
          </div>
        </div>

        <div className="mt-8 rounded-[28px] bg-gradient-to-br from-[#e9f8f1] to-[#eef6ff] p-4">
          <HouseArt className="mx-auto w-full max-w-[300px]" />
        </div>

        <h2 className="mt-8 text-[22px] font-extrabold leading-tight">
          Chores, bills, groceries and repairs —<span className="text-brand-500"> one place for the whole home.</span>
        </h2>
        <ul className="mt-4 space-y-2 text-[14px] text-ink-soft">
          <li>✅ Share chores fairly with recurring schedules</li>
          <li>💸 Never miss a bill and see where money goes</li>
          <li>🛒 Low-stock alerts that fill your shopping list</li>
          <li>🔧 Service reminders, repair history and warranties</li>
        </ul>

        <div className="mt-auto pt-8">
          {mode === 'start' ? (
            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() => {
                  window.location.hash = '#/';
                  loadDemo();
                }}
              >
                <Sparkles size={18} /> Explore the demo home
              </Button>
              <Button variant="soft" className="w-full" onClick={() => setMode('create')}>
                Set up my own home <ArrowRight size={18} />
              </Button>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!home.trim() || !name.trim()) return;
                window.location.hash = '#/';
                createHousehold(home, name);
              }}
            >
              <Field label="Home name">
                <input className="input" placeholder="e.g. Flat 302, Palm Residency" value={home} onChange={(e) => setHome(e.target.value)} autoFocus />
              </Field>
              <Field label="Your name">
                <input className="input" placeholder="e.g. Amrita" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Button type="submit" className="w-full" disabled={!home.trim() || !name.trim()}>
                Create household
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setMode('start')}>
                Back
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
