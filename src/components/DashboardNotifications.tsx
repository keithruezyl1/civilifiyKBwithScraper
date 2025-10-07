import React from 'react';
import { listNotifications, computeNotifications, dismissNotification, resolveNotification, NotificationItem } from '../services/notificationsApi';
import './DashboardNotifications.css';

export default function DashboardNotifications({ inline, onClose, anchor }: { inline?: boolean; onClose?: () => void; anchor?: { top: number; left: number; width?: number } | null }) {
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [computing, setComputing] = React.useState<boolean>(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = await listNotifications();
      if (resp?.success) setItems(resp.notifications || []);
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const onCompute = async () => {
    setComputing(true);
    try {
      await computeNotifications();
      await load();
    } finally { setComputing(false); }
  };

  const onDismiss = async (id: string) => {
    await dismissNotification(id);
    await load();
  };

  const onResolve = async (id: string, selected?: string) => {
    await resolveNotification(id, selected);
    await load();
  };

  if (loading) return <div className="p-4">Loading notifications…</div>;

  const content = (
    <div className="notif-content">
      <div className="notif-left">
        <div className="notif-title">Notifications</div>
        <button className="notif-scan-btn" onClick={onCompute} disabled={computing}>
          {computing ? 'Scanning…' : 'Scan for external > internal'}
        </button>
        <div className="notif-empty">{items.length === 0 ? '0 notifications found.' : ''}</div>
      </div>
      <div className="notif-right">
        {items.map(n => {
          const label = `‘Entry ${n.entry_id}’ – Legal Bases Citation has been identified as an internal citation.`;
          const primary = () => onResolve(n.id, n.matched_entry_ids?.[0]);
          const secondary = () => onDismiss(n.id);
          return (
            <div key={n.id} className="notif-card">
              <div className="notif-card-title">{label}</div>
              <div className="notif-card-sub">Do you want to convert it to an internal reference?</div>
              <div className="notif-card-actions">
                <button className="notif-action-yes" onClick={primary}>Convert to Internal</button>
                <button className="notif-action-no" onClick={secondary}>Dismiss</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (inline) return content;
  // Body-level flyout positioned below the anchor button
  const style: React.CSSProperties = anchor ? {
    position: 'fixed',
    top: anchor.top,
    left: Math.max(12, Math.min(anchor.left, window.innerWidth - 980 - 12)),
    zIndex: 2147483647,
  } : { position: 'fixed', top: 60, right: 12, zIndex: 2147483647 };
  return (
    <div className="notif-flyout-root" style={style}>
      <div className="notif-panel" onClick={(e) => e.stopPropagation()}>
        <button className="notif-close" onClick={onClose} aria-label="Close">×</button>
        {content}
      </div>
    </div>
  );
}


