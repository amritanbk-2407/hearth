import {
  AirVent,
  BatteryCharging,
  Bike,
  Droplet,
  Droplets,
  Flame,
  Home,
  Receipt,
  Refrigerator,
  Smartphone,
  Tv,
  WashingMachine,
  Wifi,
  Wrench,
  Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { Tone } from '../components/ui';
import type { Asset, BillCategory, StockItem } from '../types';

export const billVisual: Record<BillCategory, { icon: (s?: number) => ReactNode; tone: Tone }> = {
  electricity: { icon: (s = 20) => <Zap size={s} fill="currentColor" />, tone: 'purple' },
  water: { icon: (s = 20) => <Droplet size={s} fill="currentColor" />, tone: 'blue' },
  internet: { icon: (s = 20) => <Wifi size={s} />, tone: 'green' },
  gas: { icon: (s = 20) => <Flame size={s} />, tone: 'amber' },
  rent: { icon: (s = 20) => <Home size={s} />, tone: 'rose' },
  phone: { icon: (s = 20) => <Smartphone size={s} />, tone: 'teal' },
  subscription: { icon: (s = 20) => <Tv size={s} />, tone: 'purple' },
  other: { icon: (s = 20) => <Receipt size={s} />, tone: 'slate' },
};

const EMOJI: Array<[RegExp, string]> = [
  [/detergent|washing powder/i, '🧴'],
  [/rice/i, '🍚'],
  [/toilet|tissue/i, '🧻'],
  [/milk/i, '🥛'],
  [/curd|yogurt|dahi/i, '🥣'],
  [/bread/i, '🍞'],
  [/egg/i, '🥚'],
  [/atta|flour|wheat/i, '🌾'],
  [/oil/i, '🫒'],
  [/sugar/i, '🍬'],
  [/tea|coffee/i, '☕'],
  [/dal|lentil|pulse/i, '🫘'],
  [/dish/i, '🧽'],
  [/floor|cleaner|phenyl/i, '🧹'],
  [/paste|brush/i, '🪥'],
  [/soap|shampoo|wash/i, '🧼'],
  [/onion/i, '🧅'],
  [/tomato/i, '🍅'],
  [/banana/i, '🍌'],
  [/butter|cheese|paneer/i, '🧈'],
  [/salt|spice|masala/i, '🧂'],
  [/vegetable|veg/i, '🥬'],
  [/fruit|apple/i, '🍎'],
];

export function stockEmoji(item: Pick<StockItem, 'name'> & { category?: StockItem['category'] }): string {
  for (const [re, e] of EMOJI) if (re.test(item.name)) return e;
  switch (item.category) {
    case 'cleaning':
      return '🧽';
    case 'toiletries':
      return '🧼';
    case 'kitchen':
      return '🥫';
    default:
      return '📦';
  }
}

export function assetIcon(a: Pick<Asset, 'name' | 'type'>, size = 20): ReactNode {
  const n = a.name.toLowerCase();
  if (/\bac\b|air ?con/.test(n)) return <AirVent size={size} />;
  if (/wash/.test(n)) return <WashingMachine size={size} />;
  if (/fridge|refrigerator/.test(n)) return <Refrigerator size={size} />;
  if (/purifier|ro\b|water/.test(n)) return <Droplets size={size} />;
  if (/geyser|heater/.test(n)) return <Flame size={size} />;
  if (/inverter|battery|ups/.test(n)) return <BatteryCharging size={size} />;
  if (a.type === 'vehicle') return <Bike size={size} />;
  if (/tv|television/.test(n)) return <Tv size={size} />;
  return <Wrench size={size} />;
}
