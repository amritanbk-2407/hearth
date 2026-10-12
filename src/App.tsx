import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Activity from './pages/Activity';
import Alerts from './pages/Alerts';
import Bills from './pages/Bills';
import CalendarPage from './pages/Calendar';
import Chores from './pages/Chores';
import FixUps from './pages/FixUps';
import Home from './pages/Home';
import Household from './pages/Household';
import More from './pages/More';
import Notes from './pages/Notes';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Stock from './pages/Stock';
import Welcome from './pages/Welcome';
import { useHearth } from './store/useHearth';

// chart-heavy screens load on demand to keep app start-up fast
const Insights = lazy(() => import('./pages/Insights'));
const Reports = lazy(() => import('./pages/Reports'));
const loading = <div className="py-20 text-center text-sm text-ink-soft">Loading…</div>;

export default function App() {
  const hasHousehold = useHearth((s) => !!s.household);
  const refresh = useHearth((s) => s.refresh);

  // daily housekeeping on launch and whenever the app comes back to the foreground
  useEffect(() => {
    refresh();
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  if (!hasHousehold) return <Welcome />;

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="chores" element={<Chores />} />
          <Route path="bills" element={<Bills />} />
          <Route path="stock" element={<Stock />} />
          <Route path="fixups" element={<FixUps />} />
          <Route path="household" element={<Household />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="insights" element={<Suspense fallback={loading}><Insights /></Suspense>} />
          <Route path="reports" element={<Suspense fallback={loading}><Reports /></Suspense>} />
          <Route path="notes" element={<Notes />} />
          <Route path="activity" element={<Activity />} />
          <Route path="search" element={<Search />} />
          <Route path="settings" element={<Settings />} />
          <Route path="more" element={<More />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
