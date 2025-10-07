import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db.js';

const router = Router();

// Get current active plan
router.get('/active', async (req, res) => {
  try {
    const user = req.user || {};
    const result = await query('SELECT * FROM get_active_plan()', []);
    const found = result.rows.length > 0;
    console.log(`[plans] GET /active userId=${user.userId ?? 'anon'} found=${found}`);
    
    if (!found) {
      return res.json({ success: true, plan: null });
    }
    
    res.json({
      success: true,
      plan: result.rows[0]
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

// Import new plan (deactivates old ones)
const ImportPlanSchema = z.object({
  name: z.string(),
  day1_date: z.string(), // ISO date string
  plan_data: z.array(z.any())
});

router.post('/import', async (req, res) => {
  try {
    const { name, day1_date, plan_data } = ImportPlanSchema.parse(req.body);
    const user = req.user || {};
    console.log(`[plans] POST /import by userId=${user.userId ?? 'unknown'} name="${name}" day1=${day1_date} rows=${Array.isArray(plan_data) ? plan_data.length : 'n/a'}`);
    
    // Deactivate all existing plans
    await query('SELECT deactivate_all_plans()', []);
    
    // Insert new plan
    const result = await query(
      `INSERT INTO shared_plans (name, day1_date, plan_data, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [name, day1_date, JSON.stringify(plan_data), user.userId]
    );
    
    res.json({
      success: true,
      plan_id: result.rows[0].id
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

// Remove current plan (deactivate it)
router.delete('/active', async (req, res) => {
  try {
    const user = req.user || {};
    console.log(`[plans] DELETE /active by userId=${user.userId ?? 'unknown'}`);
    await query('SELECT deactivate_all_plans()', []);
    
    res.json({
      success: true,
      message: 'Plan removed successfully'
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

// Get plan history
router.get('/history', async (req, res) => {
  try {
    const result = await query(
      `SELECT sp.id, sp.name, sp.day1_date, sp.created_at, sp.is_active,
              u.name as created_by_name
       FROM shared_plans sp
       LEFT JOIN users u ON sp.created_by = u.id
       ORDER BY sp.created_at DESC`,
      []
    );
    
    res.json({
      success: true,
      plans: result.rows
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

// Debug endpoint: auth + active plan visibility
router.get('/debug', async (req, res) => {
  try {
    const user = req.user || null;
    const active = await query('SELECT * FROM get_active_plan()', []);
    const found = active.rows.length > 0;
    res.json({
      success: true,
      auth: Boolean(user),
      user,
      active_plan_found: found,
      active_plan_summary: found ? {
        id: active.rows[0].id,
        name: active.rows[0].name,
        day1_date: active.rows[0].day1_date,
      } : null,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: String(e.message || e) });
  }
});

export default router;
