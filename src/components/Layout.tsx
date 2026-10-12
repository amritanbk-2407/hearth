import clsx from 'clsx';
import { Bell, Check, ChevronDown, ClipboardList, Home, LayoutGrid, Menu, Package, Receipt, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAlerts } from '../lib/hooks';
import { showDeviceNotification } from '../lib/notify';
import { roleLabel } from '../logic/permissions';
import { MODULES, moduleFor } from '../nav';
import { useHearth, useMe } from '../store/useHearth';
import { Avatar, IconBubble, Toaster } from './ui';

function Logo() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M24 6 L42 20 V40 a3 3 0 0 1-3 3 H9 a3 3 0 0 1-3-3 V20 Z" stroke="#1f2340" strokeWidth="3.2" strokeLinejoin="round" fill="white" />
      <path d="M24 36c-.7 0-9-5-9-10.6 0-3 2.3-5.2 5-5.2 1.7 0 3.1.8 4 2.1.9-1.3 2.3-2.1 4-2.1 2.7 0 5 2.2 5 5.2C33 31 24.7 36 24 36z" fill="#f43f5e" />
    </svg>
  );
}

function MemberSwitcher() {
  const [open, setOpen] = useState(false);
  const me = useMe();
  const members = useHearth((s) => s.members);
  const setCurrent = useHearth((s) => s.setCurrentMember);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1" aria-label="Switch member">
        <Avatar member={me} size={36} />
        <ChevronDown size={16} className="text-ink-soft" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-60 animate-fade-in rounded-2xl border border-slate-100 bg-white p-2 shadow-pop">
          <p className="px-2 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-ink-mute">Using Hearth as</p>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setCurrent(m.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-slate-50"
            >
              <Avatar member={m} size={30} />
              <div className="flex-1">
                <div className="text-sm font-semibold">{m.name}</div>
                <div className="text-[11px] text-ink-mute">{roleLabel[m.role]}</div>
              </div>
              {m.id === me?.id && <Check size={16} className="text-brand-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const household = useHearth((s) => s.household);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex">
      <div className="relative flex h-full w-[82%] animate-fade-in flex-col bg-white shadow-pop">
        <div className="safe-top flex items-center justify-between px-5 pb-3 pt-5">
          <div className="flex items-center gap-2">
            <Logo />
            <div>
              <div className="text-lg font-extrabold leading-tight">Hearth</div>
              <div className="text-xs text-ink-soft">{household?.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          {MODULES.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                clsx('flex items-center gap-3 rounded-2xl px-2 py-2', isActive ? 'bg-brand-50' : 'hover:bg-slate-50')
              }
            >
              <IconBubble tone={m.tone} size="sm">
                {m.icon(18)}
              </IconBubble>
              <div>
                <div className="text-[14px] font-bold">{m.title}</div>
                <div className="text-[12px] text-ink-soft">{m.label}</div>
              </div>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex-1 bg-ink/40" onClick={onClose} />
    </div>
  );
}

const TABS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/chores', label: 'Chores', icon: ClipboardList },
  { to: '/bills', label: 'Bills', icon: Receipt },
  { to: '/stock', label: 'Stock', icon: Package },
  { to: '/more', label: 'More', icon: LayoutGrid },
];

export default function Layout() {
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();
  const alerts = useAlerts();
  const notificationsEnabled = useHearth((s) => s.notificationsEnabled);
  const notified = useHearth((s) => s.notifiedAlerts);
  const markNotified = useHearth((s) => s.markNotified);
  const scroller = useRef<HTMLDivElement>(null);

  const urgent = alerts.filter((a) => a.severity === 'critical' || a.severity === 'warning');
  const isHome = pathname === '/';
  const mod = moduleFor(pathname);

  // scroll to top on navigation
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [pathname]);

  // push new urgent alerts to the device (once per alert)
  useEffect(() => {
    if (!notificationsEnabled) return;
    const fresh = urgent.filter((a) => !notified.includes(a.id)).slice(0, 3);
    if (!fresh.length) return;
    fresh.forEach((a) => showDeviceNotification(a.title, a.message));
    markNotified(fresh.map((a) => a.id));
  }, [urgent, notified, notificationsEnabled, markNotified]);

  return (
    <div className="phone-frame" id="app-frame">
      <header className="safe-top no-print z-20 shrink-0 bg-canvas/90 backdrop-blur">
        <div className="flex items-center gap-3 px-4 pb-2 pt-3">
          <button onClick={() => setDrawer(true)} className="grid h-10 w-10 place-items-center rounded-xl text-ink" aria-label="Open menu">
            <Menu size={24} />
          </button>
          <Link to="/" className="flex min-w-0 flex-1 items-center gap-2">
            {isHome ? (
              <>
                <Logo />
                <div className="min-w-0">
                  <div className="text-[24px] font-extrabold leading-none tracking-tight">Hearth</div>
                  <div className="mt-0.5 truncate text-[12px] text-ink-soft">Happy Home. Organized Home.</div>
                </div>
              </>
            ) : (
              <div className="min-w-0">
                <div className="truncate text-[20px] font-extrabold leading-tight tracking-tight">{mod?.title ?? 'More'}</div>
                <div className="truncate text-[12px] text-ink-soft">{mod?.label ?? 'All Hearth features'}</div>
              </div>
            )}
          </Link>
          <Link to="/alerts" className="relative grid h-10 w-10 place-items-center rounded-xl text-ink" aria-label="Notifications">
            <Bell size={24} />
            {urgent.length > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-canvas">
                {urgent.length}
              </span>
            )}
          </Link>
          <MemberSwitcher />
        </div>
      </header>

      <main ref={scroller} className="print-scroll relative flex-1 overflow-y-auto overflow-x-hidden">
        <div className="px-4 pb-28 pt-2">
          <Outlet />
        </div>
      </main>

      <nav className="safe-bottom no-print absolute inset-x-0 bottom-0 z-30 border-t border-slate-100 bg-white/95 backdrop-blur">
        <div className="flex px-2 pt-2">
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-semibold transition',
                  isActive || (to === '/more' && !TABS.some((t) => t.to !== '/more' && (t.to === '/' ? pathname === '/' : pathname.startsWith(t.to))))
                    ? 'text-brand-500'
                    : 'text-ink-mute',
                )
              }
            >
              <Icon size={24} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <Drawer open={drawer} onClose={() => setDrawer(false)} />
      <Toaster />
    </div>
  );
}
