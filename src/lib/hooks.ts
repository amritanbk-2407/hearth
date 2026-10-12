import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { runSmartHearth } from '../logic/rules';
import { computeHealthScore } from '../logic/score';
import { useHearth } from '../store/useHearth';
import { todayISO } from './dates';

export const useToday = () => todayISO();

/** Live Smart Hearth alerts for the household. */
export function useAlerts() {
  const state = useHearth();
  const today = useToday();
  return useMemo(() => runSmartHearth(state, today), [state, today]);
}

export function useHealthScore() {
  const state = useHearth();
  const today = useToday();
  return useMemo(() => computeHealthScore(state, today), [state, today]);
}

/** `?new=1` in the URL opens a page's "add" sheet (used by Quick Actions). */
export function useNewParam(): [boolean, (open: boolean) => void] {
  const [params, setParams] = useSearchParams();
  const open = params.get('new') === '1';
  const setOpen = (v: boolean) => {
    const next = new URLSearchParams(params);
    if (v) next.set('new', '1');
    else next.delete('new');
    setParams(next, { replace: true });
  };
  return [open, setOpen];
}
