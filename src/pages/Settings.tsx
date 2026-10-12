import { Bell, Download, RefreshCcw, Smartphone, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Avatar, Button, Card, toast } from '../components/ui';
import { notificationsSupported, requestNotificationPermission, showDeviceNotification } from '../lib/notify';
import { can, roleLabel } from '../logic/permissions';
import { useHearth, useMe } from '../store/useHearth';

export default function Settings() {
  const s = useHearth();
  const me = useMe();
  const [confirm, setConfirm] = useState(false);
  const isStandalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone;

  const exportData = () => {
    const { household, members, chores, completions, bills, expenses, stock, shopping, assets, fixups, notes, activity } = s;
    const blob = new Blob([JSON.stringify({ household, members, chores, completions, bills, expenses, stock, shopping, assets, fixups, notes, activity }, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hearth-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast('Backup downloaded');
  };

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-3 p-4">
        <Avatar member={me} size={52} />
        <div className="flex-1">
          <div className="text-[17px] font-extrabold">{me?.name}</div>
          <div className="text-[13px] text-ink-soft">
            {me && roleLabel[me.role]} · {s.household?.name}
          </div>
        </div>
      </Card>

      <Card className="divide-y divide-slate-100 px-4">
        <div className="flex items-center gap-3 py-4">
          <Bell className="text-brand-500" size={22} />
          <div className="flex-1">
            <div className="text-[15px] font-semibold">Device reminders</div>
            <div className="text-[12px] text-ink-soft">
              {notificationsSupported() ? 'Bill due dates, low stock, service reminders' : 'Add Hearth to your Home Screen to enable reminders'}
            </div>
          </div>
          <input
            type="checkbox"
            className="h-6 w-6 accent-brand-500"
            checked={s.notificationsEnabled}
            onChange={async (e) => {
              if (e.target.checked) {
                const ok = await requestNotificationPermission();
                s.setNotificationsEnabled(ok);
                if (ok) {
                  showDeviceNotification('Hearth reminders are on', 'We will let you know when something needs attention.');
                  toast('Reminders turned on');
                } else toast('Permission not granted');
              } else s.setNotificationsEnabled(false);
            }}
          />
        </div>
        <div className="flex items-center gap-3 py-4">
          <Smartphone className="text-brand-500" size={22} />
          <div className="flex-1">
            <div className="text-[15px] font-semibold">Install on your phone</div>
            <div className="text-[12px] text-ink-soft">
              {isStandalone ? 'Installed ✓ — running as an app' : 'iPhone: Safari → Share → Add to Home Screen. Android: Chrome menu → Install app.'}
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <p className="text-[15px] font-bold">Data</p>
        <p className="text-[12px] text-ink-soft">
          All household data is saved on this device, so the app works even without internet.
        </p>
        <Button variant="soft" className="w-full" onClick={exportData}>
          <Download size={18} /> Download backup (JSON)
        </Button>
        {can(me?.role, 'resetData') && (
          <>
            <Button
              variant="soft"
              className="w-full"
              onClick={() => {
                s.loadDemo();
                toast('Demo data reloaded');
              }}
            >
              <Sparkles size={18} /> Reload demo household
            </Button>
            {confirm ? (
              <div className="flex gap-2">
                <Button variant="danger" className="flex-1" onClick={() => s.resetAll()}>
                  <Trash2 size={18} /> Yes, erase everything
                </Button>
                <Button variant="ghost" onClick={() => setConfirm(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="danger" className="w-full" onClick={() => setConfirm(true)}>
                <RefreshCcw size={18} /> Start over (erase all data)
              </Button>
            )}
          </>
        )}
      </Card>
      <p className="text-center text-[12px] text-ink-mute">Hearth v1.0 · Built with React, TypeScript & Tailwind CSS</p>
    </div>
  );
}
