// ============================================================================
// DINNER MATCH v2 - Weekly Meal Planning
// ============================================================================
// 
// This server handles:
// 1. Family members (who's in the household)
// 2. Meals (recipes with ingredients)
// 3. Weekly plans (the core voting + assignment flow)
//
// Flow:
//   Planning → Voting → Assigning → Locked
//   (setup)    (picks)   (Mum)       (done)
//
// ============================================================================

const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3000;

// ============================================================================
// DATABASE SETUP
// ============================================================================

const db = new Database('dinner.db');

// Enable foreign key enforcement - this makes the database protect itself
// from orphaned records (e.g., votes pointing to deleted meals)
db.pragma('foreign_keys = ON');

// ============================================================================
// SCHEMA: Tables we're keeping from v1
// ============================================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS family_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT '👤',
    likes TEXT,
    dislikes TEXT,
    dietary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    ingredients TEXT,
    instructions TEXT,
    category TEXT,
    prep_time TEXT,
    cook_time TEXT,
    servings TEXT,
    added_by TEXT,
    is_family_favourite INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ============================================================================
// SCHEMA: New tables for weekly planning
// ============================================================================

db.exec(`
  -- One row per week (e.g., "week starting 30th December")
  CREATE TABLE IF NOT EXISTS weekly_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'planning' CHECK(status IN ('planning', 'voting', 'locked')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Seven rows per plan (Mon-Sun), tracks who's eating and what meal
  CREATE TABLE IF NOT EXISTS weekly_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
    meal_id INTEGER,
    diners TEXT NOT NULL DEFAULT '[]',
    FOREIGN KEY (plan_id) REFERENCES weekly_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE SET NULL,
    UNIQUE(plan_id, day_of_week)
  );

  -- Each person's picks for the week (what they'd be happy eating)
  CREATE TABLE IF NOT EXISTS weekly_picks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    meal_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES weekly_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES family_members(id) ON DELETE CASCADE,
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
    UNIQUE(plan_id, member_id, meal_id)
  );
`);

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function isValidId(id) {
  return Number.isInteger(id) && id > 0;
}

function isNonEmptyString(str) {
  return typeof str === 'string' && str.trim().length > 0;
}

function isValidDayOfWeek(day) {
  return Number.isInteger(day) && day >= 0 && day <= 6;
}

function isValidStatus(status) {
  return ['planning', 'voting', 'locked'].includes(status);
}

function isValidDinersArray(diners) {
  return Array.isArray(diners) && diners.every(id => isValidId(id));
}

function memberExists(id) {
  const row = db.prepare('SELECT id FROM family_members WHERE id = ?').get(id);
  return !!row;
}

function mealExists(id) {
  const row = db.prepare('SELECT id FROM meals WHERE id = ?').get(id);
  return !!row;
}

function planExists(id) {
  const row = db.prepare('SELECT id FROM weekly_plans WHERE id = ?').get(id);
  return !!row;
}

// ============================================================================
// API: Family Members
// ============================================================================

app.get('/api/family', (req, res) => {
  try {
    const members = db.prepare('SELECT * FROM family_members ORDER BY id').all();
    res.json(members);
  } catch (err) {
    console.error('Error fetching family:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/family/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  try {
    const member = db.prepare('SELECT * FROM family_members WHERE id = ?').get(id);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(member);
  } catch (err) {
    console.error('Error fetching member:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/family', (req, res) => {
  const { name, avatar, likes, dislikes, dietary } = req.body;
  
  if (!isNonEmptyString(name)) {
    return res.status(400).json({ error: 'Name is required and cannot be empty' });
  }
  
  try {
    const result = db.prepare(`
      INSERT INTO family_members (name, avatar, likes, dislikes, dietary)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      avatar || '👤',
      likes || '',
      dislikes || '',
      dietary || ''
    );
    
    res.status(201).json({ id: result.lastInsertRowid, message: 'Member created' });
  } catch (err) {
    console.error('Error creating member:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/family/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, avatar, likes, dislikes, dietary } = req.body;
  
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  if (!memberExists(id)) {
    return res.status(404).json({ error: 'Member not found' });
  }
  
  if (name !== undefined && !isNonEmptyString(name)) {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }
  
  try {
    db.prepare(`
      UPDATE family_members 
      SET name = COALESCE(?, name),
          avatar = COALESCE(?, avatar),
          likes = COALESCE(?, likes),
          dislikes = COALESCE(?, dislikes),
          dietary = COALESCE(?, dietary)
      WHERE id = ?
    `).run(name?.trim(), avatar, likes, dislikes, dietary, id);
    
    res.json({ message: 'Member updated' });
  } catch (err) {
    console.error('Error updating member:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/family/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  if (!memberExists(id)) {
    return res.status(404).json({ error: 'Member not found' });
  }
  
  try {
    db.prepare('DELETE FROM family_members WHERE id = ?').run(id);
    res.json({ message: 'Member deleted' });
  } catch (err) {
    console.error('Error deleting member:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================================
// API: Meals
// ============================================================================

app.get('/api/meals', (req, res) => {
  try {
    const meals = db.prepare('SELECT * FROM meals ORDER BY name').all();
    res.json(meals);
  } catch (err) {
    console.error('Error fetching meals:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/meals/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  try {
    const meal = db.prepare('SELECT * FROM meals WHERE id = ?').get(id);
    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }
    res.json(meal);
  } catch (err) {
    console.error('Error fetching meal:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/meals', (req, res) => {
  const { name, description, ingredients, instructions, category, prep_time, cook_time, servings, added_by, is_family_favourite } = req.body;
  
  if (!isNonEmptyString(name)) {
    return res.status(400).json({ error: 'Meal name is required' });
  }
  
  try {
    const result = db.prepare(`
      INSERT INTO meals (name, description, ingredients, instructions, category, prep_time, cook_time, servings, added_by, is_family_favourite)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      description || '',
      ingredients || '',
      instructions || '',
      category || '',
      prep_time || '',
      cook_time || '',
      servings || '',
      added_by || '',
      is_family_favourite ? 1 : 0
    );
    
    res.status(201).json({ id: result.lastInsertRowid, message: 'Meal created' });
  } catch (err) {
    console.error('Error creating meal:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/meals/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  if (!mealExists(id)) {
    return res.status(404).json({ error: 'Meal not found' });
  }
  
  const { name, description, ingredients, instructions, category, prep_time, cook_time, servings, is_family_favourite } = req.body;
  
  if (name !== undefined && !isNonEmptyString(name)) {
    return res.status(400).json({ error: 'Meal name cannot be empty' });
  }
  
  try {
    db.prepare(`
      UPDATE meals 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          ingredients = COALESCE(?, ingredients),
          instructions = COALESCE(?, instructions),
          category = COALESCE(?, category),
          prep_time = COALESCE(?, prep_time),
          cook_time = COALESCE(?, cook_time),
          servings = COALESCE(?, servings),
          is_family_favourite = COALESCE(?, is_family_favourite)
      WHERE id = ?
    `).run(name?.trim(), description, ingredients, instructions, category, prep_time, cook_time, servings, is_family_favourite, id);
    
    res.json({ message: 'Meal updated' });
  } catch (err) {
    console.error('Error updating meal:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/meals/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  if (!mealExists(id)) {
    return res.status(404).json({ error: 'Meal not found' });
  }
  
  try {
    db.prepare('DELETE FROM meals WHERE id = ?').run(id);
    res.json({ message: 'Meal deleted' });
  } catch (err) {
    console.error('Error deleting meal:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================================
// API: Weekly Plans
// ============================================================================

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function getCurrentWeekStart() {
  return getMonday(new Date());
}

app.get('/api/plans/current', (req, res) => {
  try {
    const weekStart = getCurrentWeekStart();
    const plan = db.prepare('SELECT * FROM weekly_plans WHERE week_start = ?').get(weekStart);
    
    if (!plan) {
      return res.json({ plan: null });
    }
    
    const days = db.prepare(`
      SELECT wd.*, m.name as meal_name, m.ingredients, m.instructions, m.category, m.prep_time
      FROM weekly_days wd
      LEFT JOIN meals m ON wd.meal_id = m.id
      WHERE wd.plan_id = ?
      ORDER BY wd.day_of_week
    `).all(plan.id);
    
    const daysWithDiners = days.map(day => ({
      ...day,
      diners: JSON.parse(day.diners || '[]')
    }));
    
    res.json({ plan, days: daysWithDiners });
  } catch (err) {
    console.error('Error fetching current plan:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/plans/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  try {
    const plan = db.prepare('SELECT * FROM weekly_plans WHERE id = ?').get(id);
    
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    
    const days = db.prepare(`
      SELECT wd.*, m.name as meal_name, m.ingredients, m.instructions, m.category, m.prep_time
      FROM weekly_days wd
      LEFT JOIN meals m ON wd.meal_id = m.id
      WHERE wd.plan_id = ?
      ORDER BY wd.day_of_week
    `).all(plan.id);
    
    const daysWithDiners = days.map(day => ({
      ...day,
      diners: JSON.parse(day.diners || '[]')
    }));
    
    res.json({ plan, days: daysWithDiners });
  } catch (err) {
    console.error('Error fetching plan:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/plans', (req, res) => {
  const { week_start } = req.body;
  
  const weekStart = week_start ? getMonday(week_start) : getCurrentWeekStart();
  
  try {
    const existing = db.prepare('SELECT id FROM weekly_plans WHERE week_start = ?').get(weekStart);
    if (existing) {
      return res.status(409).json({ error: 'Plan already exists for this week', planId: existing.id });
    }
    
    const result = db.prepare('INSERT INTO weekly_plans (week_start) VALUES (?)').run(weekStart);
    const planId = result.lastInsertRowid;
    
    const insertDay = db.prepare('INSERT INTO weekly_days (plan_id, day_of_week, diners) VALUES (?, ?, ?)');
    for (let day = 0; day <= 6; day++) {
      insertDay.run(planId, day, '[]');
    }
    
    res.status(201).json({ id: planId, week_start: weekStart, message: 'Plan created with 7 days' });
  } catch (err) {
    console.error('Error creating plan:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/plans/:id/status', (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  if (!isValidStatus(status)) {
    return res.status(400).json({ error: 'Status must be: planning, voting, or locked' });
  }
  
  if (!planExists(id)) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  
  try {
    db.prepare('UPDATE weekly_plans SET status = ? WHERE id = ?').run(status, id);
    res.json({ message: `Plan status updated to ${status}` });
  } catch (err) {
    console.error('Error updating plan status:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/plans/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  if (!planExists(id)) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  
  try {
    db.prepare('DELETE FROM weekly_plans WHERE id = ?').run(id);
    res.json({ message: 'Plan deleted' });
  } catch (err) {
    console.error('Error deleting plan:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================================
// API: Weekly Days
// ============================================================================

app.put('/api/plans/:planId/days/:dayOfWeek/diners', (req, res) => {
  const planId = parseInt(req.params.planId);
  const dayOfWeek = parseInt(req.params.dayOfWeek);
  const { diners } = req.body;
  
  if (!isValidId(planId)) {
    return res.status(400).json({ error: 'Invalid plan ID' });
  }
  
  if (!isValidDayOfWeek(dayOfWeek)) {
    return res.status(400).json({ error: 'Day must be 0 (Mon) to 6 (Sun)' });
  }
  
  if (!isValidDinersArray(diners)) {
    return res.status(400).json({ error: 'Diners must be an array of member IDs' });
  }
  
  if (!planExists(planId)) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  
  for (const dinerId of diners) {
    if (!memberExists(dinerId)) {
      return res.status(400).json({ error: `Member ID ${dinerId} not found` });
    }
  }
  
  try {
    db.prepare('UPDATE weekly_days SET diners = ? WHERE plan_id = ? AND day_of_week = ?')
      .run(JSON.stringify(diners), planId, dayOfWeek);
    res.json({ message: 'Diners updated' });
  } catch (err) {
    console.error('Error updating diners:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/plans/:planId/days/:dayOfWeek/meal', (req, res) => {
  const planId = parseInt(req.params.planId);
  const dayOfWeek = parseInt(req.params.dayOfWeek);
  const { meal_id } = req.body;
  
  if (!isValidId(planId)) {
    return res.status(400).json({ error: 'Invalid plan ID' });
  }
  
  if (!isValidDayOfWeek(dayOfWeek)) {
    return res.status(400).json({ error: 'Day must be 0 (Mon) to 6 (Sun)' });
  }
  
  if (meal_id !== null && !isValidId(meal_id)) {
    return res.status(400).json({ error: 'Invalid meal ID' });
  }
  
  if (meal_id !== null && !mealExists(meal_id)) {
    return res.status(404).json({ error: 'Meal not found' });
  }
  
  if (!planExists(planId)) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  
  try {
    db.prepare('UPDATE weekly_days SET meal_id = ? WHERE plan_id = ? AND day_of_week = ?')
      .run(meal_id, planId, dayOfWeek);
    res.json({ message: meal_id ? 'Meal assigned' : 'Meal unassigned' });
  } catch (err) {
    console.error('Error assigning meal:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================================
// API: Weekly Picks (voting)
// ============================================================================

app.get('/api/plans/:planId/picks', (req, res) => {
  const planId = parseInt(req.params.planId);
  
  if (!isValidId(planId)) {
    return res.status(400).json({ error: 'Invalid plan ID' });
  }
  
  if (!planExists(planId)) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  
  try {
    const mealCounts = db.prepare(`
      SELECT 
        m.id, 
        m.name, 
        m.category,
        m.prep_time,
        COUNT(wp.id) as pick_count
      FROM meals m
      LEFT JOIN weekly_picks wp ON m.id = wp.meal_id AND wp.plan_id = ?
      GROUP BY m.id
      ORDER BY pick_count DESC, m.name
    `).all(planId);
    
    const pickDetails = db.prepare(`
      SELECT wp.meal_id, fm.id as member_id, fm.name as member_name, fm.avatar
      FROM weekly_picks wp
      JOIN family_members fm ON wp.member_id = fm.id
      WHERE wp.plan_id = ?
    `).all(planId);
    
    const pickersByMeal = {};
    for (const pick of pickDetails) {
      if (!pickersByMeal[pick.meal_id]) {
        pickersByMeal[pick.meal_id] = [];
      }
      pickersByMeal[pick.meal_id].push({
        id: pick.member_id,
        name: pick.member_name,
        avatar: pick.avatar
      });
    }
    
    const mealsWithPicks = mealCounts.map(meal => ({
      ...meal,
      pickers: pickersByMeal[meal.id] || []
    }));
    
    res.json(mealsWithPicks);
  } catch (err) {
    console.error('Error fetching picks:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/plans/:planId/picks/:memberId', (req, res) => {
  const planId = parseInt(req.params.planId);
  const memberId = parseInt(req.params.memberId);
  
  if (!isValidId(planId) || !isValidId(memberId)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  if (!planExists(planId)) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  
  if (!memberExists(memberId)) {
    return res.status(404).json({ error: 'Member not found' });
  }
  
  try {
    const picks = db.prepare(`
      SELECT meal_id FROM weekly_picks WHERE plan_id = ? AND member_id = ?
    `).all(planId, memberId).map(row => row.meal_id);
    
    res.json({ picks });
  } catch (err) {
    console.error('Error fetching member picks:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/plans/:planId/picks', (req, res) => {
  const planId = parseInt(req.params.planId);
  const { member_id, meal_id } = req.body;
  
  if (!isValidId(planId)) {
    return res.status(400).json({ error: 'Invalid plan ID' });
  }
  
  if (!isValidId(member_id)) {
    return res.status(400).json({ error: 'Invalid member ID' });
  }
  
  if (!isValidId(meal_id)) {
    return res.status(400).json({ error: 'Invalid meal ID' });
  }
  
  if (!planExists(planId)) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  
  if (!memberExists(member_id)) {
    return res.status(404).json({ error: 'Member not found' });
  }
  
  if (!mealExists(meal_id)) {
    return res.status(404).json({ error: 'Meal not found' });
  }
  
  const plan = db.prepare('SELECT status FROM weekly_plans WHERE id = ?').get(planId);
  if (plan.status !== 'voting') {
    return res.status(400).json({ error: 'Plan is not in voting phase' });
  }
  
  try {
    db.prepare('INSERT OR IGNORE INTO weekly_picks (plan_id, member_id, meal_id) VALUES (?, ?, ?)')
      .run(planId, member_id, meal_id);
    res.status(201).json({ message: 'Pick recorded' });
  } catch (err) {
    console.error('Error adding pick:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/plans/:planId/picks', (req, res) => {
  const planId = parseInt(req.params.planId);
  const { member_id, meal_id } = req.body;
  
  if (!isValidId(planId) || !isValidId(member_id) || !isValidId(meal_id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  try {
    db.prepare('DELETE FROM weekly_picks WHERE plan_id = ? AND member_id = ? AND meal_id = ?')
      .run(planId, member_id, meal_id);
    res.json({ message: 'Pick removed' });
  } catch (err) {
    console.error('Error removing pick:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================================
// API: Shopping List
// ============================================================================

app.get('/api/plans/:planId/shopping-list', (req, res) => {
  const planId = parseInt(req.params.planId);
  
  if (!isValidId(planId)) {
    return res.status(400).json({ error: 'Invalid plan ID' });
  }
  
  if (!planExists(planId)) {
    return res.status(404).json({ error: 'Plan not found' });
  }
  
  try {
    const assignedMeals = db.prepare(`
      SELECT DISTINCT m.id, m.name, m.ingredients
      FROM weekly_days wd
      JOIN meals m ON wd.meal_id = m.id
      WHERE wd.plan_id = ? AND wd.meal_id IS NOT NULL
    `).all(planId);
    
    if (assignedMeals.length === 0) {
      return res.json({ meals: [], ingredients: [] });
    }
    
    const allIngredients = [];
    for (const meal of assignedMeals) {
      if (meal.ingredients) {
        const lines = meal.ingredients.split('\n').filter(line => line.trim());
        allIngredients.push(...lines.map(line => ({
          ingredient: line.trim(),
          from_meal: meal.name
        })));
      }
    }
    
    res.json({ 
      meals: assignedMeals.map(m => ({ id: m.id, name: m.name })),
      ingredients: allIngredients 
    });
  } catch (err) {
    console.error('Error generating shopping list:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

app.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIPs();
  console.log('\n🍽️  Dinner Match v2 - Weekly Planner\n');
  console.log('Access the app:');
  console.log(`   Local:    http://localhost:${PORT}`);
  ips.forEach(ip => {
    console.log(`   Network:  http://${ip}:${PORT}`);
  });
  console.log('\nAPI Endpoints:');
  console.log('   GET  /api/family              - List family members');
  console.log('   GET  /api/meals               - List all meals');
  console.log('   GET  /api/plans/current       - Get this week\'s plan');
  console.log('   POST /api/plans               - Create new weekly plan');
  console.log('   GET  /api/plans/:id/picks     - Get votes with counts');
  console.log('   POST /api/plans/:id/picks     - Submit a vote');
  console.log('\n');
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down...');
  db.close();
  process.exit(0);
});