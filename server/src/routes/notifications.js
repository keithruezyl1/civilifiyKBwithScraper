import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// Helper: fetch all entries for current user (basic fields)
async function fetchUserEntries(userId) {
  const res = await query(
    `select entry_id, title, canonical_citation, legal_bases, related_sections, created_by
       from kb_entries
       where created_by = $1`,
    [userId]
  );
  return res.rows || [];
}

// Helper: fetch pool of KB entries for matching
async function fetchKbPool() {
  const res = await query(
    `select entry_id, title, canonical_citation from kb_entries`,
    []
  );
  return res.rows || [];
}

// Very conservative simple matcher (exact-ish title/citation containment, case-insensitive)
function findMatchesForExternal(ext, pool) {
  const citation = String(ext?.citation || '').trim().toLowerCase();
  const title = String(ext?.title || '').trim().toLowerCase();
  if (!citation && !title) return [];
  const terms = [citation, title].filter(Boolean);
  const matched = [];
  for (const row of pool) {
    const t = String(row.title || '').toLowerCase();
    const c = String(row.canonical_citation || '').toLowerCase();
    const ok = terms.some(term => (term && (t.includes(term) || c.includes(term))));
    if (ok) matched.push(row.entry_id);
  }
  // Deduplicate and cap to 5
  return Array.from(new Set(matched)).slice(0, 5);
}

// Compute notifications on-demand for current user's entries
router.post('/compute', async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'User not authenticated' });

    const [entries, pool] = await Promise.all([
      fetchUserEntries(userId),
      fetchKbPool(),
    ]);

    let created = 0;
    for (const e of entries) {
      const arrays = [Array.isArray(e.legal_bases) ? e.legal_bases : [], Array.isArray(e.related_sections) ? e.related_sections : []];
      for (const arr of arrays) {
        for (const item of arr) {
          if (!item || item.type !== 'external') continue;
          const matches = findMatchesForExternal(item, pool);
          if (matches.length === 0) continue;

          // Avoid duplicate pending notifications for same snapshot
          const dupCheck = await query(
            `select id from kb_notifications
               where user_id=$1 and entry_id=$2 and status='pending'
                 and citation_snapshot = $3::jsonb`,
            [userId, e.entry_id, JSON.stringify({ citation: item.citation || '', title: item.title || '', url: item.url || '' })]
          );
          if (dupCheck.rows.length) continue;

          await query(
            `insert into kb_notifications (user_id, entry_id, citation_snapshot, matched_entry_ids, status)
               values ($1, $2, $3::jsonb, $4::text[], 'pending')`,
            [
              userId,
              e.entry_id,
              JSON.stringify({ citation: item.citation || '', title: item.title || '', url: item.url || '' }),
              matches,
            ]
          );
          created += 1;
        }
      }
    }

    res.json({ success: true, created });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

// List notifications for current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'User not authenticated' });

    const result = await query(
      `select id, entry_id, citation_snapshot, matched_entry_ids, status, created_at
         from kb_notifications
         where user_id = $1 and status = 'pending'
         order by created_at desc
         limit 100`,
      [userId]
    );
    res.json({ success: true, notifications: result.rows });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

// Dismiss a notification (no change to entries)
router.post('/:id/dismiss', async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const id = String(req.params.id || '');
    await query(`update kb_notifications set status = 'dismissed' where id = $1 and user_id = $2`, [id, userId]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

// Resolve (convert one external citation to internal)
router.post('/:id/resolve', async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const id = String(req.params.id || '');
    // Load notification
    const notifRes = await query(`select * from kb_notifications where id = $1 and user_id = $2`, [id, userId]);
    if (!notifRes.rows.length) return res.status(404).json({ success: false, error: 'Not found' });
    const notif = notifRes.rows[0];

    // Determine which matched entry to use
    const selectedEntryId = String(req.body?.selected_entry_id || '').trim() || (notif.matched_entry_ids?.[0] || notif.matched_entry_id);
    if (!selectedEntryId) return res.status(400).json({ success: false, error: 'No selected_entry_id provided' });

    // Load entry
    const entryRes = await query(`select * from kb_entries where entry_id = $1`, [notif.entry_id]);
    if (!entryRes.rows.length) return res.status(404).json({ success: false, error: 'Entry not found' });
    const entry = entryRes.rows[0];

    // Convert external to internal in both arrays where present
    const convertInArray = (arr) => {
      if (!Array.isArray(arr)) return arr;
      return arr.map((it) => {
        if (!it) return it;
        if (it.type === 'external') {
          const snap = notif.citation_snapshot || {};
          const same = (s) => (
            (s.citation || '').trim() === (it.citation || '').trim() &&
            (s.title || '').trim() === (it.title || '').trim() &&
            (s.url || '').trim() === (it.url || '').trim()
          );
          if (same(snap)) {
            return { type: 'internal', entry_id: selectedEntryId, url: '', title: it.title || '', note: it.note || '' };
          }
        }
        return it;
      });
    };

    const updated = { ...entry };
    updated.legal_bases = convertInArray(entry.legal_bases || []);
    updated.related_sections = convertInArray(entry.related_sections || []);

    await query(
      `update kb_entries set legal_bases=$2, related_sections=$3, updated_at=now() where entry_id=$1`,
      [entry.entry_id, JSON.stringify(updated.legal_bases), JSON.stringify(updated.related_sections)]
    );

    await query(`update kb_notifications set status='resolved', resolved_at=now() where id=$1`, [id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

export default router;


