"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const os_1 = __importDefault(require("os"));
const app = (0, express_1.default)();
const PORT = 3000;
// Initialize SQLite database
const db = new better_sqlite3_1.default('dinner.db');
// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS family_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
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

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS shopping_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    items TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS meal_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    vote INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(meal_id, member_id)
  );

  CREATE TABLE IF NOT EXISTS member_meal_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meal_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    preference TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(meal_id, member_id)
  );
`);
// Preload UK favourite meals if database is empty
const mealCount = db.prepare('SELECT COUNT(*) as count FROM meals').get();
if (mealCount.count === 0) {
    const preloadedMeals = [
        // Pasta & Italian
        {
            name: 'Spaghetti Bolognese with Meatballs',
            ingredients: '500g spaghetti\n500g minced beef\n12 beef meatballs\n2 tins chopped tomatoes\n1 onion, diced\n3 cloves garlic, minced\n2 tbsp tomato puree\n1 tsp dried oregano\n1 tsp dried basil\nSalt and pepper\nParmesan cheese\nOlive oil',
            instructions: '1. Fry onion and garlic in olive oil until soft\n2. Add mince and brown well\n3. Add tomatoes, puree and herbs\n4. Simmer for 30 mins\n5. Meanwhile, fry meatballs until cooked through\n6. Cook spaghetti according to packet\n7. Add meatballs to sauce\n8. Serve with parmesan',
            category: 'Comfort Food',
            prep_time: '15 mins',
            cook_time: '30 mins',
            servings: '4'
        },
        {
            name: 'Homemade Lasagne',
            ingredients: '500g minced beef\n2 tins chopped tomatoes\n1 onion, diced\n2 cloves garlic\n12 lasagne sheets\n500ml whole milk\n50g butter\n50g plain flour\n200g cheddar cheese, grated\n1 tsp dried oregano\nSalt and pepper',
            instructions: '1. Fry onion and garlic, add mince and brown\n2. Add tomatoes and oregano, simmer 20 mins\n3. Make white sauce: melt butter, stir in flour, gradually add milk\n4. Add half the cheese to white sauce\n5. Layer: meat sauce, pasta, white sauce. Repeat.\n6. Top with remaining cheese\n7. Bake 180°C for 40 mins until golden',
            category: 'Comfort Food',
            prep_time: '30 mins',
            cook_time: '40 mins',
            servings: '6'
        },
        {
            name: 'Chicken Pasta Bake',
            ingredients: '400g pasta\n3 chicken breasts, diced\n1 tin chopped tomatoes\n200ml double cream\n200g cheddar cheese, grated\n1 onion, diced\n2 cloves garlic\n1 tsp mixed herbs\nSalt and pepper',
            instructions: '1. Cook pasta according to packet, drain\n2. Fry chicken until golden, set aside\n3. Fry onion and garlic until soft\n4. Add tomatoes, cream and herbs, simmer 10 mins\n5. Mix pasta, chicken and sauce in baking dish\n6. Top with cheese\n7. Bake 180°C for 25 mins',
            category: 'Comfort Food',
            prep_time: '15 mins',
            cook_time: '30 mins',
            servings: '4'
        },
        {
            name: 'Carbonara',
            ingredients: '400g spaghetti\n200g bacon or pancetta, diced\n4 egg yolks\n100g parmesan, grated\n2 cloves garlic\nBlack pepper\nSalt',
            instructions: '1. Cook spaghetti until al dente, save some pasta water\n2. Fry bacon until crispy, add garlic for 1 min\n3. Mix egg yolks with parmesan and pepper\n4. Drain pasta, add to bacon pan (off heat)\n5. Quickly stir in egg mixture, toss well\n6. Add splash of pasta water if needed\n7. Serve immediately with extra parmesan',
            category: 'Quick & Easy',
            prep_time: '10 mins',
            cook_time: '15 mins',
            servings: '4'
        },
        {
            name: 'Tuna Pasta Bake',
            ingredients: '400g pasta\n2 tins tuna, drained\n1 tin sweetcorn, drained\n1 tin cream of mushroom soup\n200g cheddar cheese, grated\n200ml milk\nSalt and pepper',
            instructions: '1. Cook pasta, drain\n2. Mix soup with milk in a pan, heat gently\n3. Add tuna and sweetcorn\n4. Stir in pasta and half the cheese\n5. Pour into baking dish\n6. Top with remaining cheese\n7. Bake 180°C for 20 mins',
            category: 'Kid Friendly',
            prep_time: '10 mins',
            cook_time: '25 mins',
            servings: '4'
        },
        {
            name: 'Macaroni Cheese',
            ingredients: '400g macaroni\n50g butter\n50g plain flour\n600ml milk\n300g mature cheddar, grated\n1 tsp English mustard\nSalt and pepper\nPinch of nutmeg',
            instructions: '1. Cook macaroni, drain\n2. Melt butter, stir in flour, cook 1 min\n3. Gradually add milk, stirring constantly\n4. Simmer until thick\n5. Add most of cheese, mustard, seasoning\n6. Stir in macaroni\n7. Pour into dish, top with remaining cheese\n8. Grill until golden and bubbling',
            category: 'Kid Friendly',
            prep_time: '10 mins',
            cook_time: '20 mins',
            servings: '4'
        },
        // Pizza
        {
            name: 'Margherita Pizza',
            ingredients: '500g strong bread flour\n7g dried yeast\n1 tsp sugar\n1 tsp salt\n300ml warm water\n2 tbsp olive oil\n200g passata\n2 balls mozzarella\nFresh basil leaves',
            instructions: '1. Mix flour, yeast, sugar, salt. Add water and oil\n2. Knead 10 mins until smooth\n3. Leave to rise 1 hour\n4. Roll out into circles\n5. Spread passata, leaving border\n6. Tear over mozzarella\n7. Bake 220°C for 12-15 mins\n8. Add fresh basil to serve',
            category: 'Kid Friendly',
            prep_time: '20 mins',
            cook_time: '15 mins',
            servings: '4'
        },
        {
            name: 'Pepperoni Pizza',
            ingredients: '1 pizza base\n100g passata\n150g mozzarella, grated\n50g pepperoni slices\n1 tsp dried oregano\nOlive oil',
            instructions: '1. Spread passata over base\n2. Sprinkle with cheese\n3. Arrange pepperoni on top\n4. Add oregano and drizzle of oil\n5. Bake 220°C for 12-15 mins until crispy',
            category: 'Kid Friendly',
            prep_time: '10 mins',
            cook_time: '15 mins',
            servings: '2'
        },
        {
            name: 'Meat Feast Pizza',
            ingredients: '1 pizza base\n100g passata\n150g mozzarella, grated\n30g pepperoni\n50g ham, chopped\n2 sausages, sliced\n4 rashers bacon, chopped\n1 tsp oregano',
            instructions: '1. Spread passata over base\n2. Add cheese\n3. Scatter all the meats evenly\n4. Sprinkle with oregano\n5. Bake 220°C for 15-18 mins',
            category: 'Comfort Food',
            prep_time: '15 mins',
            cook_time: '18 mins',
            servings: '2'
        },
        // Curries
        {
            name: 'Chicken Tikka Masala',
            ingredients: '4 chicken breasts, cubed\n2 tbsp tikka paste\n1 onion, diced\n3 cloves garlic, minced\n1 inch ginger, grated\n1 tin chopped tomatoes\n200ml double cream\n1 tsp garam masala\n1 tsp turmeric\nFresh coriander\nRice to serve',
            instructions: '1. Marinate chicken in half the tikka paste, 30 mins\n2. Fry chicken until charred, set aside\n3. Fry onion until golden\n4. Add garlic, ginger, remaining paste, cook 2 mins\n5. Add tomatoes, simmer 15 mins\n6. Stir in cream and chicken\n7. Simmer 10 mins\n8. Serve with rice and coriander',
            category: 'Comfort Food',
            prep_time: '40 mins',
            cook_time: '30 mins',
            servings: '4'
        },
        {
            name: 'Chicken Korma',
            ingredients: '4 chicken breasts, cubed\n1 onion, diced\n2 cloves garlic\n200ml coconut cream\n100g ground almonds\n2 tbsp korma paste\n1 tsp turmeric\n1 tbsp honey\nFresh coriander\nRice to serve',
            instructions: '1. Fry onion until soft\n2. Add garlic and paste, cook 2 mins\n3. Add chicken, brown all over\n4. Stir in almonds, turmeric\n5. Add coconut cream and honey\n6. Simmer 20 mins until chicken cooked\n7. Serve with rice and coriander',
            category: 'Kid Friendly',
            prep_time: '15 mins',
            cook_time: '25 mins',
            servings: '4'
        }
    ];
    const insertMeal = db.prepare('INSERT INTO meals (name, ingredients, instructions, category, prep_time, cook_time, servings, added_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (const meal of preloadedMeals) {
        insertMeal.run(meal.name, meal.ingredients, meal.instructions || '', meal.category, meal.prep_time, meal.cook_time || '', meal.servings || '4', 'Preloaded');
    }
    console.log(`✅ Preloaded ${preloadedMeals.length} UK favourite meals with full recipes!`);
}
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
// ============ API ROUTES ============
// Get all family members
app.get('/api/family', (_req, res) => {
    const members = db.prepare('SELECT * FROM family_members ORDER BY name').all();
    res.json(members);
});
// Add family member
app.post('/api/family', (req, res) => {
    const { name, likes, dislikes, dietary } = req.body;
    if (!name) {
        res.status(400).json({ error: 'Name is required' });
        return;
    }
    const stmt = db.prepare('INSERT INTO family_members (name, likes, dislikes, dietary) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name, likes || '', dislikes || '', dietary || '');
    res.json({ id: result.lastInsertRowid, name, likes, dislikes, dietary });
});
// Update family member
app.put('/api/family/:id', (req, res) => {
    const { name, likes, dislikes, dietary } = req.body;
    if (!name) {
        res.status(400).json({ error: 'Name is required' });
        return;
    }
    db.prepare('UPDATE family_members SET name=?, likes=?, dislikes=?, dietary=? WHERE id=?')
        .run(name, likes || '', dislikes || '', dietary || '', req.params.id);
    res.json({ success: true });
});
// Delete family member
app.delete('/api/family/:id', (req, res) => {
    db.prepare('DELETE FROM family_members WHERE id=?').run(req.params.id);
    res.json({ success: true });
});
// Get all meals (with optional search)
app.get('/api/meals', (req, res) => {
    const search = req.query.search;
    const category = req.query.category;
    let query = 'SELECT * FROM meals WHERE 1=1';
    const params = [];
    if (search) {
        query += ' AND (name LIKE ? OR ingredients LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }
    query += ' ORDER BY name';
    const meals = db.prepare(query).all(...params);
    res.json(meals);
});
// Get single meal with full details
app.get('/api/meals/:id', (req, res) => {
    const meal = db.prepare('SELECT * FROM meals WHERE id = ?').get(req.params.id);
    if (meal) {
        res.json(meal);
    }
    else {
        res.status(404).json({ error: 'Meal not found' });
    }
});
// Add meal
app.post('/api/meals', (req, res) => {
    const { name, description, ingredients, instructions, category, prep_time, cook_time, servings, added_by } = req.body;
    if (!name) {
        res.status(400).json({ error: 'Name is required' });
        return;
    }
    const stmt = db.prepare('INSERT INTO meals (name, description, ingredients, instructions, category, prep_time, cook_time, servings, added_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(name, description || '', ingredients || '', instructions || '', category || '', prep_time || '', cook_time || '', servings || '', added_by || 'Someone');
    res.json({ id: result.lastInsertRowid, name });
});
// Update meal
app.put('/api/meals/:id', (req, res) => {
    const { name, description, ingredients, instructions, category, prep_time, cook_time, servings } = req.body;
    if (!name) {
        res.status(400).json({ error: 'Name is required' });
        return;
    }
    db.prepare('UPDATE meals SET name=?, description=?, ingredients=?, instructions=?, category=?, prep_time=?, cook_time=?, servings=? WHERE id=?')
        .run(name, description || '', ingredients || '', instructions || '', category || '', prep_time || '', cook_time || '', servings || '', req.params.id);
    res.json({ success: true });
});
// Toggle family favourite
app.put('/api/meals/:id/favourite', (req, res) => {
    const meal = db.prepare('SELECT is_family_favourite FROM meals WHERE id = ?').get(req.params.id);
    if (!meal) {
        res.status(404).json({ error: 'Meal not found' });
        return;
    }
    const newValue = meal.is_family_favourite ? 0 : 1;
    db.prepare('UPDATE meals SET is_family_favourite = ? WHERE id = ?').run(newValue, req.params.id);
    res.json({ is_family_favourite: newValue });
});
// Delete meal
app.delete('/api/meals/:id', (req, res) => {
    db.prepare('DELETE FROM meals WHERE id=?').run(req.params.id);
    res.json({ success: true });
});
// ============ VOTING ROUTES ============
// Get votes for a meal
app.get('/api/meals/:id/votes', (req, res) => {
    const votes = db.prepare(`
    SELECT mv.*, fm.name as member_name
    FROM meal_votes mv
    JOIN family_members fm ON mv.member_id = fm.id
    WHERE mv.meal_id = ?
  `).all(req.params.id);
    const total = votes.reduce((sum, v) => sum + v.vote, 0);
    res.json({ votes, total, count: votes.length });
});
// Vote for a meal
app.post('/api/meals/:id/vote', (req, res) => {
    const { member_id, vote } = req.body;
    if (!member_id || vote === undefined) {
        res.status(400).json({ error: 'member_id and vote are required' });
        return;
    }
    try {
        db.prepare(`
      INSERT INTO meal_votes (meal_id, member_id, vote) VALUES (?, ?, ?)
      ON CONFLICT(meal_id, member_id) DO UPDATE SET vote = ?
    `).run(req.params.id, member_id, vote, vote);
        res.json({ success: true });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});
// Remove vote
app.delete('/api/meals/:id/vote/:member_id', (req, res) => {
    db.prepare('DELETE FROM meal_votes WHERE meal_id = ? AND member_id = ?')
        .run(req.params.id, req.params.member_id);
    res.json({ success: true });
});
// ============ MEMBER MEAL PREFERENCES ============
// Get preferences for a meal (who likes/dislikes it)
app.get('/api/meals/:id/preferences', (req, res) => {
    const prefs = db.prepare(`
    SELECT mmp.*, fm.name as member_name
    FROM member_meal_preferences mmp
    JOIN family_members fm ON mmp.member_id = fm.id
    WHERE mmp.meal_id = ?
  `).all(req.params.id);
    res.json(prefs);
});
// Set preference for a meal (like or dislike)
app.post('/api/meals/:id/preference', (req, res) => {
    const { member_id, preference } = req.body;
    if (!member_id || !preference) {
        res.status(400).json({ error: 'member_id and preference are required' });
        return;
    }
    try {
        db.prepare(`
      INSERT INTO member_meal_preferences (meal_id, member_id, preference) VALUES (?, ?, ?)
      ON CONFLICT(meal_id, member_id) DO UPDATE SET preference = ?
    `).run(req.params.id, member_id, preference, preference);
        res.json({ success: true });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(400).json({ error: errorMessage });
    }
});
// Remove preference
app.delete('/api/meals/:id/preference/:member_id', (req, res) => {
    db.prepare('DELETE FROM member_meal_preferences WHERE meal_id = ? AND member_id = ?')
        .run(req.params.id, req.params.member_id);
    res.json({ success: true });
});
// Get all preferences for a member
app.get('/api/family/:id/preferences', (req, res) => {
    const prefs = db.prepare(`
    SELECT mmp.*, m.name as meal_name
    FROM member_meal_preferences mmp
    JOIN meals m ON mmp.meal_id = m.id
    WHERE mmp.member_id = ?
  `).all(req.params.id);
    res.json(prefs);
});
// ============ SHOPPING LIST ROUTES ============
// Get all shopping lists
app.get('/api/shopping-lists', (_req, res) => {
    const lists = db.prepare('SELECT * FROM shopping_lists ORDER BY created_at DESC').all();
    res.json(lists);
});
// Create shopping list from selected meals
app.post('/api/shopping-lists', (req, res) => {
    const { name, meal_ids, created_by } = req.body;
    if (!meal_ids || !Array.isArray(meal_ids) || meal_ids.length === 0) {
        res.status(400).json({ error: 'meal_ids array is required' });
        return;
    }
    // Get ingredients from selected meals
    const placeholders = meal_ids.map(() => '?').join(',');
    const meals = db.prepare(`SELECT name, ingredients FROM meals WHERE id IN (${placeholders})`).all(...meal_ids);
    // Combine all ingredients
    let allIngredients = [];
    meals.forEach((meal) => {
        if (meal.ingredients) {
            const items = meal.ingredients.split('\n').map((i) => i.trim()).filter(Boolean);
            allIngredients = allIngredients.concat(items);
        }
    });
    // Store as JSON with checked status
    const itemsJson = JSON.stringify(allIngredients.map((item) => ({ text: item, checked: false })));
    const stmt = db.prepare('INSERT INTO shopping_lists (name, items, created_by) VALUES (?, ?, ?)');
    const result = stmt.run(name || 'Shopping List', itemsJson, created_by || 'Someone');
    res.json({ id: result.lastInsertRowid, name, items: allIngredients, meals: meals.map((m) => m.name) });
});
// Update shopping list (mark items as checked)
app.put('/api/shopping-lists/:id', (req, res) => {
    const { items } = req.body;
    if (!items) {
        res.status(400).json({ error: 'items are required' });
        return;
    }
    db.prepare('UPDATE shopping_lists SET items = ? WHERE id = ?').run(JSON.stringify(items), req.params.id);
    res.json({ success: true });
});
// Delete shopping list
app.delete('/api/shopping-lists/:id', (req, res) => {
    db.prepare('DELETE FROM shopping_lists WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});
// Get messages (last 50)
app.get('/api/messages', (_req, res) => {
    const messages = db.prepare('SELECT * FROM messages ORDER BY created_at DESC LIMIT 50').all();
    res.json(messages.reverse());
});
// Send message
app.post('/api/messages', (req, res) => {
    const { sender, message } = req.body;
    if (!sender || !message) {
        res.status(400).json({ error: 'sender and message are required' });
        return;
    }
    const stmt = db.prepare('INSERT INTO messages (sender, message) VALUES (?, ?)');
    const result = stmt.run(sender, message);
    res.json({ id: result.lastInsertRowid, sender, message, created_at: new Date().toISOString() });
});
// Get dinner suggestion
app.post('/api/suggest', (req, res) => {
    const { eatingTonight } = req.body;
    const allMembers = db.prepare('SELECT * FROM family_members').all();
    const meals = db.prepare('SELECT * FROM meals').all();
    // Filter to only members eating tonight
    const eatingMembers = eatingTonight && eatingTonight.length > 0
        ? allMembers.filter((m) => eatingTonight.includes(m.id))
        : allMembers;
    if (meals.length === 0) {
        res.json({ error: 'No meals saved yet! Add some meals first.' });
        return;
    }
    // Score each meal
    const scored = meals.map((meal) => {
        let score = 50;
        const reasons = [];
        const warnings = [];
        const mealLower = (meal.name + ' ' + (meal.description || '') + ' ' + (meal.ingredients || '')).toLowerCase();
        eatingMembers.forEach((member) => {
            if (member.likes) {
                member.likes.toLowerCase().split(',').map((l) => l.trim()).filter(Boolean).forEach((like) => {
                    if (mealLower.includes(like)) {
                        score += 15;
                        reasons.push(`${member.name} loves ${like}`);
                    }
                });
            }
            if (member.dislikes) {
                member.dislikes.toLowerCase().split(',').map((d) => d.trim()).filter(Boolean).forEach((dislike) => {
                    if (mealLower.includes(dislike)) {
                        score -= 30;
                        warnings.push(`${member.name} dislikes ${dislike}`);
                    }
                });
            }
            if (member.dietary) {
                const dietary = member.dietary.toLowerCase();
                const mealCat = (meal.category || '').toLowerCase();
                if (dietary.includes('vegetarian') &&
                    (mealLower.includes('chicken') || mealLower.includes('beef') ||
                        mealLower.includes('pork') || mealLower.includes('meat') || mealLower.includes('fish'))) {
                    if (mealCat !== 'vegetarian') {
                        score -= 100;
                        warnings.push(`Not suitable for ${member.name} (vegetarian)`);
                    }
                }
                if (dietary.includes('gluten') &&
                    (mealLower.includes('pasta') || mealLower.includes('bread') || mealLower.includes('pizza'))) {
                    score -= 100;
                    warnings.push(`Contains gluten - ${member.name} can't eat this`);
                }
            }
        });
        // Time bonuses
        const today = new Date().getDay();
        if (today >= 1 && today <= 5 && meal.prep_time === '15 mins') {
            score += 10;
            reasons.push('Quick for a weekday');
        }
        if ((today === 0 || today === 6) && meal.category === 'Weekend Special') {
            score += 15;
            reasons.push('Perfect for the weekend!');
        }
        // Randomness for variety
        score += Math.random() * 20;
        return { meal, score, reasons, warnings };
    });
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];
    const eatingNames = eatingMembers.map((m) => m.name).join(', ');
    res.json({
        meal: best.meal.name,
        mealData: best.meal,
        eatingTonight: eatingNames || 'Everyone',
        reason: best.reasons.length > 0 ? best.reasons.slice(0, 3).join('. ') + '.' : 'Looks like a good option!',
        warnings: best.warnings,
        tips: best.meal.prep_time === '1+ hours' ? 'This takes a while - start early!' : ''
    });
});
// Get local IP addresses for sharing
function getLocalIPs() {
    const interfaces = os_1.default.networkInterfaces();
    const addresses = [];
    for (const name of Object.keys(interfaces)) {
        const ifaces = interfaces[name];
        if (ifaces) {
            for (const iface of ifaces) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    addresses.push(iface.address);
                }
            }
        }
    }
    return addresses;
}
// Start server
app.listen(PORT, '0.0.0.0', () => {
    const ips = getLocalIPs();
    console.log('\n🍽️  What Do You Want For Dinner?\n');
    console.log('Server running! Share these addresses with your family:\n');
    console.log(`   Local:    http://localhost:${PORT}`);
    ips.forEach((ip) => {
        console.log(`   Network:  http://${ip}:${PORT}`);
    });
    console.log('\nFamily members can open this on their phones to add preferences!\n');
});
