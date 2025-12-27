const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3000;

// Initialize SQLite database
const db = new Database('dinner.db');

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
    },
    {
      name: 'Lamb Rogan Josh',
      ingredients: '750g lamb shoulder, cubed\n2 onions, sliced\n4 cloves garlic\n2 inch ginger\n2 tbsp rogan josh paste\n1 tin tomatoes\n200ml yoghurt\n1 tsp garam masala\n1 cinnamon stick\n4 cardamom pods\nRice to serve',
      instructions: '1. Brown lamb in batches, set aside\n2. Fry onions until golden\n3. Add garlic, ginger, paste, spices, cook 2 mins\n4. Return lamb, add tomatoes\n5. Cover and simmer 1.5 hours until tender\n6. Stir in yoghurt and garam masala\n7. Serve with rice',
      category: 'Weekend Special',
      prep_time: '20 mins',
      cook_time: '1.5 hours',
      servings: '4'
    },
    {
      name: 'Chicken Jalfrezi',
      ingredients: '4 chicken breasts, sliced\n2 peppers, sliced\n1 onion, sliced\n1 tin tomatoes\n3 green chillies, sliced\n3 cloves garlic\n1 inch ginger\n2 tsp cumin\n2 tsp coriander\n1 tsp turmeric\nRice to serve',
      instructions: '1. Fry chicken until golden, set aside\n2. Fry onion and peppers until soft\n3. Add garlic, ginger, chillies, spices\n4. Add tomatoes, simmer 10 mins\n5. Return chicken, cook 10 mins more\n6. Serve with rice',
      category: 'Healthy',
      prep_time: '15 mins',
      cook_time: '30 mins',
      servings: '4'
    },
    {
      name: 'Keema Curry',
      ingredients: '500g minced lamb\n1 cup peas\n1 onion, diced\n3 cloves garlic\n1 inch ginger\n1 tin tomatoes\n2 tbsp curry powder\n1 tsp garam masala\n1 tsp turmeric\nFresh coriander\nRice to serve',
      instructions: '1. Fry onion until golden\n2. Add garlic, ginger and spices, cook 2 mins\n3. Add mince, break up and brown well\n4. Add tomatoes, simmer 20 mins\n5. Add peas, cook 5 mins more\n6. Finish with garam masala and coriander\n7. Serve with rice',
      category: 'Comfort Food',
      prep_time: '10 mins',
      cook_time: '30 mins',
      servings: '4'
    },

    // British Classics
    {
      name: 'Shepherd\'s Pie',
      ingredients: '500g minced lamb\n1 onion, diced\n2 carrots, diced\n1 cup peas\n2 tbsp tomato puree\n300ml lamb stock\n1 tbsp Worcestershire sauce\n1kg potatoes\n50g butter\n100ml milk\n100g cheddar, grated',
      instructions: '1. Fry onion and carrots until soft\n2. Add mince, brown well\n3. Add puree, stock, Worcestershire\n4. Simmer 20 mins, add peas\n5. Boil potatoes, mash with butter and milk\n6. Put mince in dish, top with mash\n7. Sprinkle cheese, bake 200°C for 25 mins',
      category: 'Comfort Food',
      prep_time: '20 mins',
      cook_time: '45 mins',
      servings: '4'
    },
    {
      name: 'Cottage Pie',
      ingredients: '500g minced beef\n1 onion, diced\n2 carrots, diced\n1 cup peas\n2 tbsp tomato puree\n300ml beef stock\n1 tbsp Worcestershire sauce\n1kg potatoes\n50g butter\n100ml milk\n100g cheddar, grated',
      instructions: '1. Fry onion and carrots until soft\n2. Add mince, brown well\n3. Add puree, stock, Worcestershire\n4. Simmer 20 mins, add peas\n5. Boil potatoes, mash with butter and milk\n6. Put mince in dish, top with mash\n7. Sprinkle cheese, bake 200°C for 25 mins',
      category: 'Comfort Food',
      prep_time: '20 mins',
      cook_time: '45 mins',
      servings: '4'
    },
    {
      name: 'Fish and Chips',
      ingredients: '4 cod fillets\n200g plain flour\n300ml cold beer or sparkling water\n1 tsp baking powder\n1kg potatoes\nVegetable oil for frying\nSalt\nMushy peas\nTartar sauce',
      instructions: '1. Cut potatoes into chips, soak in cold water 30 mins\n2. Mix flour, baking powder, pinch of salt\n3. Whisk in beer until smooth\n4. Heat oil to 180°C\n5. Par-fry chips 5 mins, drain\n6. Dip fish in batter, fry 6-8 mins until golden\n7. Fry chips again until crispy\n8. Serve with mushy peas and tartar sauce',
      category: 'Comfort Food',
      prep_time: '40 mins',
      cook_time: '20 mins',
      servings: '4'
    },
    {
      name: 'Bangers and Mash',
      ingredients: '8 good quality sausages\n1kg potatoes\n50g butter\n100ml milk\n2 onions, sliced\n300ml beef stock\n1 tbsp flour\n1 tbsp gravy granules\nPeas to serve',
      instructions: '1. Grill or fry sausages until cooked, about 20 mins\n2. Boil potatoes, mash with butter and milk\n3. Slowly fry onions until caramelised, 20 mins\n4. Add flour, stir, then stock and gravy granules\n5. Simmer until thick\n6. Serve sausages on mash with onion gravy and peas',
      category: 'Comfort Food',
      prep_time: '10 mins',
      cook_time: '30 mins',
      servings: '4'
    },
    {
      name: 'Toad in the Hole',
      ingredients: '8 sausages\n225g plain flour\n4 eggs\n300ml milk\nSalt and pepper\n3 tbsp vegetable oil\nOnion gravy to serve',
      instructions: '1. Put oil in roasting tin with sausages\n2. Cook at 220°C for 15 mins\n3. Meanwhile whisk flour, eggs, milk, seasoning\n4. Pour batter around hot sausages quickly\n5. Bake 25-30 mins until puffed and golden\n6. Serve immediately with onion gravy',
      category: 'Comfort Food',
      prep_time: '10 mins',
      cook_time: '45 mins',
      servings: '4'
    },
    {
      name: 'Steak and Ale Pie',
      ingredients: '750g braising steak, cubed\n2 onions, sliced\n200g mushrooms, sliced\n2 carrots, sliced\n500ml ale\n300ml beef stock\n2 tbsp plain flour\n1 tbsp tomato puree\n500g puff pastry\n1 egg, beaten',
      instructions: '1. Toss beef in flour, brown in batches\n2. Fry onions until soft, add mushrooms and carrots\n3. Return beef, add ale, stock, puree\n4. Cover, simmer 1.5 hours until tender\n5. Pour into pie dish, cool slightly\n6. Top with pastry, brush with egg\n7. Bake 200°C for 30 mins until golden',
      category: 'Weekend Special',
      prep_time: '30 mins',
      cook_time: '2 hours',
      servings: '6'
    },
    {
      name: 'Chicken and Mushroom Pie',
      ingredients: '4 chicken breasts, cubed\n300g mushrooms, sliced\n1 onion, diced\n1 leek, sliced\n300ml chicken stock\n200ml double cream\n2 tbsp flour\n500g puff pastry\n1 egg, beaten\nFresh thyme',
      instructions: '1. Fry chicken until golden, set aside\n2. Fry onion, leek and mushrooms\n3. Add flour, stir, then stock\n4. Add cream and thyme, simmer 10 mins\n5. Return chicken, season, cool slightly\n6. Pour into dish, top with pastry\n7. Brush with egg, bake 200°C 25 mins',
      category: 'Comfort Food',
      prep_time: '25 mins',
      cook_time: '40 mins',
      servings: '4'
    },

    // Sunday Roasts
    {
      name: 'Sunday Roast Chicken',
      ingredients: '1 whole chicken (1.5kg)\n1kg roasting potatoes\n4 carrots\n1 onion\nButter\nOlive oil\nChicken stock\nFlour for gravy\nYorkshire pudding batter\nStuffing mix\nFrozen peas',
      instructions: '1. Rub chicken with butter, season well\n2. Roast 200°C, 20 mins per 500g plus 20 mins\n3. Par-boil potatoes, shake to rough up edges\n4. Roast in hot oil until crispy\n5. Make Yorkshires: batter into hot oil, bake 20 mins\n6. Rest chicken, make gravy with juices\n7. Serve with all the trimmings',
      category: 'Weekend Special',
      prep_time: '30 mins',
      cook_time: '1.5 hours',
      servings: '4-6'
    },
    {
      name: 'Sunday Roast Beef',
      ingredients: '1.5kg beef joint\n1kg roasting potatoes\n4 carrots\nHorseradish sauce\nBeef dripping or oil\nBeef stock\nFlour for gravy\nYorkshire pudding batter\nFrozen peas',
      instructions: '1. Bring beef to room temp, season well\n2. Sear all over in hot pan\n3. Roast 200°C: rare 12 mins/500g, medium 15 mins/500g\n4. Rest 30 mins, covered\n5. Roast potatoes in dripping until crispy\n6. Make Yorkshires and gravy\n7. Slice beef, serve with horseradish',
      category: 'Weekend Special',
      prep_time: '20 mins',
      cook_time: '1 hour',
      servings: '6'
    },

    // Chinese Style
    {
      name: 'Sweet and Sour Chicken',
      ingredients: '4 chicken breasts, cubed\n1 red pepper, chunks\n1 green pepper, chunks\n1 tin pineapple chunks\n1 onion, chunks\n4 tbsp tomato ketchup\n2 tbsp soy sauce\n2 tbsp rice vinegar\n2 tbsp brown sugar\n1 tbsp cornflour\nRice to serve',
      instructions: '1. Mix ketchup, soy, vinegar, sugar, pineapple juice\n2. Fry chicken until golden\n3. Add peppers and onion, stir fry 3 mins\n4. Add sauce, simmer until thick\n5. Stir in pineapple\n6. Serve with rice',
      category: 'Kid Friendly',
      prep_time: '15 mins',
      cook_time: '20 mins',
      servings: '4'
    },
    {
      name: 'Chicken Chow Mein',
      ingredients: '300g egg noodles\n2 chicken breasts, sliced\n200g beansprouts\n1 red pepper, sliced\n1 carrot, julienned\n4 spring onions\n3 tbsp soy sauce\n1 tbsp oyster sauce\n2 cloves garlic\n1 tsp sesame oil',
      instructions: '1. Cook noodles, drain and toss with sesame oil\n2. Stir fry chicken until cooked, set aside\n3. Stir fry vegetables 2 mins\n4. Add garlic, cook 30 seconds\n5. Return chicken and noodles\n6. Add soy and oyster sauce, toss well\n7. Top with spring onions',
      category: 'Quick & Easy',
      prep_time: '15 mins',
      cook_time: '15 mins',
      servings: '4'
    },
    {
      name: 'Crispy Chilli Beef',
      ingredients: '400g beef steak, thin strips\n3 tbsp cornflour\n2 red chillies, sliced\n1 inch ginger, julienned\n3 cloves garlic\n4 spring onions\n3 tbsp sweet chilli sauce\n2 tbsp soy sauce\n1 tbsp honey\nOil for frying\nRice to serve',
      instructions: '1. Toss beef in cornflour\n2. Deep fry in batches until crispy\n3. Stir fry chillies, ginger, garlic 1 min\n4. Add sauces and honey\n5. Toss in crispy beef\n6. Top with spring onions\n7. Serve with rice',
      category: 'Comfort Food',
      prep_time: '20 mins',
      cook_time: '15 mins',
      servings: '4'
    },
    {
      name: 'Chicken Fried Rice',
      ingredients: '400g cold cooked rice\n2 chicken breasts, diced small\n2 eggs, beaten\n1 cup frozen peas\n1 cup sweetcorn\n4 spring onions\n3 tbsp soy sauce\n1 tbsp sesame oil\n2 cloves garlic',
      instructions: '1. Fry chicken until cooked, set aside\n2. Scramble eggs, break into pieces, set aside\n3. Stir fry peas and sweetcorn 2 mins\n4. Add garlic, then rice, stir fry 3 mins\n5. Add soy sauce, sesame oil\n6. Return chicken and egg\n7. Top with spring onions',
      category: 'Quick & Easy',
      prep_time: '10 mins',
      cook_time: '15 mins',
      servings: '4'
    },

    // Mexican Style
    {
      name: 'Chicken Fajitas',
      ingredients: '4 chicken breasts, sliced\n2 peppers, sliced\n1 onion, sliced\n2 tbsp fajita seasoning\n8 flour tortillas\nSour cream\nSalsa\nGuacamole\n100g cheddar, grated\nLime wedges',
      instructions: '1. Toss chicken in fajita seasoning\n2. Fry chicken until charred and cooked\n3. Fry peppers and onion until soft\n4. Warm tortillas\n5. Serve everything in bowls for people to build their own\n6. Add lime juice to taste',
      category: 'Kid Friendly',
      prep_time: '15 mins',
      cook_time: '15 mins',
      servings: '4'
    },
    {
      name: 'Beef Tacos',
      ingredients: '500g minced beef\n1 onion, diced\n2 tbsp taco seasoning\n8 taco shells\n1 lettuce, shredded\n2 tomatoes, diced\n100g cheddar, grated\nSalsa\nSour cream\nJalapenos',
      instructions: '1. Fry onion until soft\n2. Add mince, brown well\n3. Add taco seasoning and splash of water\n4. Simmer 10 mins\n5. Warm taco shells\n6. Let everyone build their own tacos',
      category: 'Kid Friendly',
      prep_time: '10 mins',
      cook_time: '20 mins',
      servings: '4'
    },
    {
      name: 'Chilli Con Carne',
      ingredients: '500g minced beef\n1 tin kidney beans\n1 tin chopped tomatoes\n1 onion, diced\n2 cloves garlic\n1 red chilli\n2 tsp cumin\n2 tsp paprika\n1 tsp cinnamon\n1 beef stock cube\nRice to serve\nSour cream',
      instructions: '1. Fry onion until soft\n2. Add garlic, chilli and spices, cook 1 min\n3. Add mince, brown well\n4. Add tomatoes, beans, crumbled stock cube\n5. Simmer 30-40 mins\n6. Serve with rice and sour cream',
      category: 'Comfort Food',
      prep_time: '10 mins',
      cook_time: '40 mins',
      servings: '4'
    },
    {
      name: 'Easy Beef Burritos',
      ingredients: '500g minced beef\n1 tin kidney beans, drained\n1 onion, diced\n2 cloves garlic\n1 tsp cumin\n1 tsp paprika\n1 tin chopped tomatoes\n4 large tortilla wraps\n200g rice, cooked\n100g cheese, grated\nSour cream\nLettuce, shredded',
      instructions: '1. Fry onion and garlic until soft\n2. Add mince, brown well\n3. Add spices, tomatoes, beans\n4. Simmer 15 mins until thick\n5. Warm tortillas\n6. Fill with rice, mince, cheese, lettuce, sour cream\n7. Fold into burritos',
      category: 'Quick & Easy',
      prep_time: '10 mins',
      cook_time: '20 mins',
      servings: '4'
    },
    {
      name: 'Quesadillas',
      ingredients: '4 flour tortillas\n2 chicken breasts, cooked and shredded\n200g cheddar, grated\n1 pepper, sliced\n1 onion, sliced\nSour cream\nSalsa\nButter',
      instructions: '1. Fry pepper and onion until soft\n2. Lay tortilla flat, add cheese, chicken, veg to one half\n3. Fold in half\n4. Fry in butter until golden each side\n5. Cut into wedges\n6. Serve with sour cream and salsa',
      category: 'Quick & Easy',
      prep_time: '10 mins',
      cook_time: '10 mins',
      servings: '4'
    },
    {
      name: 'Nachos',
      ingredients: '200g tortilla chips\n300g minced beef\n1 tin kidney beans\n1 tbsp taco seasoning\n200g cheddar, grated\nJalapenos\nSalsa\nSour cream\nGuacamole\nSpring onions',
      instructions: '1. Fry mince with seasoning and beans\n2. Spread chips on baking tray\n3. Top with mince and cheese\n4. Grill until cheese melts\n5. Add jalapenos, salsa, sour cream, guac\n6. Scatter spring onions\n7. Eat immediately!',
      category: 'Kid Friendly',
      prep_time: '10 mins',
      cook_time: '15 mins',
      servings: '4'
    },

    // Quick Midweek
    {
      name: 'Beans on Toast',
      ingredients: '1 tin baked beans\n2 slices bread\nButter\nCheddar cheese, grated (optional)',
      instructions: '1. Heat beans in pan or microwave\n2. Toast bread\n3. Butter toast\n4. Pour beans over\n5. Top with cheese if using',
      category: 'Quick & Easy',
      prep_time: '2 mins',
      cook_time: '5 mins',
      servings: '1'
    },
    {
      name: 'Cheese on Toast',
      ingredients: '2 slices bread\n100g cheddar, grated\nWorcestershire sauce\nButter',
      instructions: '1. Toast bread lightly\n2. Butter one side\n3. Pile on cheese\n4. Add dash of Worcestershire\n5. Grill until bubbling and golden',
      category: 'Quick & Easy',
      prep_time: '2 mins',
      cook_time: '5 mins',
      servings: '1'
    },
    {
      name: 'Jacket Potato with Beans and Cheese',
      ingredients: '4 large baking potatoes\n1 tin baked beans\n200g cheddar, grated\nButter\nSalt and pepper',
      instructions: '1. Prick potatoes, microwave 10 mins or bake 200°C 1 hour\n2. Heat beans\n3. Cut cross in potatoes, squeeze open\n4. Add butter, beans, cheese\n5. Season and serve',
      category: 'Quick & Easy',
      prep_time: '5 mins',
      cook_time: '1 hour (oven) or 15 mins (microwave)',
      servings: '4'
    },
    {
      name: 'Omelette and Chips',
      ingredients: '3 eggs per person\n50g cheese, grated\n50g ham, diced\nMushrooms, sliced\nOven chips\nButter\nSalt and pepper',
      instructions: '1. Cook chips according to packet\n2. Beat eggs with seasoning\n3. Melt butter in pan over medium heat\n4. Add eggs, swirl around\n5. When nearly set, add fillings to one side\n6. Fold over and serve with chips',
      category: 'Quick & Easy',
      prep_time: '5 mins',
      cook_time: '20 mins',
      servings: '1'
    },
    {
      name: 'Fish Finger Sandwich',
      ingredients: '6 fish fingers\n2 slices soft white bread\nButter\nTartar sauce or ketchup\nLettuce (optional)',
      instructions: '1. Cook fish fingers according to packet\n2. Butter bread\n3. Add fish fingers\n4. Add sauce and lettuce\n5. Squish together and enjoy!',
      category: 'Quick & Easy',
      prep_time: '2 mins',
      cook_time: '15 mins',
      servings: '1'
    },

    // Burgers
    {
      name: 'Homemade Beef Burgers',
      ingredients: '500g minced beef\n1 onion, finely diced\n1 egg\n4 burger buns\nLettuce\n1 tomato, sliced\n4 cheese slices\nKetchup\nMayonnaise\nOven chips',
      instructions: '1. Mix mince, onion, egg, seasoning\n2. Form into 4 patties\n3. Fry or grill 5-6 mins each side\n4. Add cheese for last minute\n5. Toast buns\n6. Build burgers with salad and sauces\n7. Serve with chips',
      category: 'Comfort Food',
      prep_time: '15 mins',
      cook_time: '15 mins',
      servings: '4'
    },
    {
      name: 'Chicken Burgers',
      ingredients: '4 chicken breasts\nCajun seasoning\n4 brioche buns\nLettuce\nMayonnaise\n1 tomato, sliced\nOven chips',
      instructions: '1. Bash chicken to even thickness\n2. Season with Cajun spice\n3. Grill or fry 6-7 mins each side\n4. Toast buns\n5. Spread mayo, add chicken, salad\n6. Serve with chips',
      category: 'Comfort Food',
      prep_time: '10 mins',
      cook_time: '15 mins',
      servings: '4'
    },
    {
      name: 'Hot Dogs',
      ingredients: '8 hot dog sausages\n8 hot dog rolls\nFried onions\nKetchup\nMustard\nOven chips',
      instructions: '1. Cook sausages in boiling water or fry\n2. Slice onion, fry until caramelised\n3. Warm rolls\n4. Add sausage, onions, sauces\n5. Serve with chips',
      category: 'Kid Friendly',
      prep_time: '5 mins',
      cook_time: '15 mins',
      servings: '4'
    },

    // Chicken Dishes
    {
      name: 'Chicken Kiev',
      ingredients: '4 chicken breasts\n100g butter, softened\n4 cloves garlic, crushed\nFresh parsley, chopped\n100g breadcrumbs\n50g flour\n2 eggs, beaten\nMash and veg to serve',
      instructions: '1. Mix butter, garlic, parsley\n2. Cut pocket in each chicken breast\n3. Stuff with garlic butter, secure with cocktail stick\n4. Coat in flour, then egg, then breadcrumbs\n5. Bake 200°C for 25-30 mins\n6. Serve with mash and veg',
      category: 'Comfort Food',
      prep_time: '20 mins',
      cook_time: '30 mins',
      servings: '4'
    },
    {
      name: 'Hunter\'s Chicken',
      ingredients: '4 chicken breasts\n8 rashers bacon\n200ml BBQ sauce\n200g cheddar, grated\nChips to serve',
      instructions: '1. Fry or grill chicken until almost cooked\n2. Wrap each in 2 rashers bacon\n3. Place in baking dish\n4. Smother with BBQ sauce\n5. Top with cheese\n6. Bake 200°C for 20 mins\n7. Serve with chips',
      category: 'Comfort Food',
      prep_time: '10 mins',
      cook_time: '30 mins',
      servings: '4'
    },
    {
      name: 'Chicken Dippers and Chips',
      ingredients: '1 pack chicken dippers (about 20)\nOven chips\nBaked beans\nKetchup\nBBQ sauce',
      instructions: '1. Cook dippers and chips according to packets\n2. Heat beans\n3. Serve with dipping sauces',
      category: 'Kid Friendly',
      prep_time: '2 mins',
      cook_time: '25 mins',
      servings: '4'
    },
    {
      name: 'Sausage Casserole',
      ingredients: '8 sausages\n1 tin baked beans\n1 tin chopped tomatoes\n1 onion, sliced\n1 pepper, sliced\n2 tsp paprika\n1 tbsp Worcestershire sauce\nMash to serve',
      instructions: '1. Brown sausages, set aside\n2. Fry onion and pepper\n3. Add tomatoes, beans, paprika, Worcestershire\n4. Return sausages\n5. Simmer 25 mins\n6. Serve with mash',
      category: 'Comfort Food',
      prep_time: '10 mins',
      cook_time: '35 mins',
      servings: '4'
    },
    {
      name: 'Gammon, Egg and Chips',
      ingredients: '4 gammon steaks\n4 eggs\nOven chips\nTin of pineapple rings\nPeas',
      instructions: '1. Cook chips according to packet\n2. Grill or fry gammon 5-6 mins each side\n3. Fry eggs\n4. Grill pineapple briefly\n5. Cook peas\n6. Serve together',
      category: 'Comfort Food',
      prep_time: '5 mins',
      cook_time: '25 mins',
      servings: '4'
    },

    // Healthy Options
    {
      name: 'Grilled Salmon with Veg',
      ingredients: '4 salmon fillets\n300g new potatoes\n200g tenderstem broccoli\n200g green beans\n1 lemon\nOlive oil\nDill\nSalt and pepper',
      instructions: '1. Boil potatoes until tender\n2. Season salmon, drizzle with oil and lemon\n3. Grill salmon 4-5 mins each side\n4. Steam broccoli and beans 4 mins\n5. Serve with lemon wedges and dill',
      category: 'Healthy',
      prep_time: '10 mins',
      cook_time: '20 mins',
      servings: '4'
    },
    {
      name: 'Stir Fry Vegetables with Chicken',
      ingredients: '2 chicken breasts, sliced\n1 head broccoli, florets\n2 peppers, sliced\n200g beansprouts\n2 pak choi\n3 tbsp soy sauce\n1 tbsp honey\n2 cloves garlic\n1 inch ginger\nNoodles or rice',
      instructions: '1. Stir fry chicken until cooked, set aside\n2. Stir fry hard veg first (broccoli, peppers)\n3. Add garlic and ginger\n4. Add beansprouts and pak choi\n5. Return chicken\n6. Add soy and honey\n7. Serve with noodles or rice',
      category: 'Healthy',
      prep_time: '15 mins',
      cook_time: '15 mins',
      servings: '4'
    },
    {
      name: 'Chicken Salad',
      ingredients: '2 chicken breasts\n1 bag mixed salad leaves\n1 cucumber, sliced\n200g cherry tomatoes\n1 avocado\n1 red onion, sliced\nOlive oil\nBalsamic vinegar',
      instructions: '1. Season and grill chicken 6-7 mins each side\n2. Rest then slice\n3. Arrange salad, cucumber, tomatoes, avocado, onion\n4. Top with chicken\n5. Dress with oil and balsamic',
      category: 'Healthy',
      prep_time: '10 mins',
      cook_time: '15 mins',
      servings: '2'
    },

    // ============ FAMILY FAVOURITES ============
    {
      name: 'Creamy Tuna Pasta Bake',
      ingredients: '400g pasta (penne or rigatoni)\n2 tins tuna in spring water, drained\n1 tin sweetcorn, drained\n200g frozen peas\n300ml double cream\n200ml milk\n2 tbsp plain flour\n50g butter\n200g mature cheddar, grated\n1 tsp Dijon mustard\n2 cloves garlic, minced\nSalt and pepper\n50g breadcrumbs\nFresh parsley',
      instructions: '1. Cook pasta according to packet, adding peas for last 2 mins. Drain.\n2. Melt butter in large pan, add garlic and cook 1 min\n3. Stir in flour and cook 1 min\n4. Gradually add milk and cream, stirring constantly until thick\n5. Add mustard and most of the cheese, stir until melted\n6. Fold in tuna, sweetcorn, pasta and peas\n7. Pour into baking dish\n8. Top with remaining cheese and breadcrumbs\n9. Bake 200°C for 20-25 mins until golden and bubbling\n10. Garnish with parsley',
      category: 'Comfort Food',
      prep_time: '15 mins',
      cook_time: '30 mins',
      servings: '6'
    },
    {
      name: 'Chilli Prawn Linguine',
      ingredients: '300g linguine\n300g raw king prawns\n4 cloves garlic, sliced\n1-2 red chillies, finely sliced\n150g cherry tomatoes, halved\n100ml white wine\n3 tbsp olive oil\nZest and juice of 1 lemon\nLarge handful fresh parsley, chopped\nSalt and pepper\nPinch of chilli flakes',
      instructions: '1. Cook linguine according to packet, save a cup of pasta water\n2. Heat oil in large frying pan over medium heat\n3. Add garlic and chilli, fry 1 min until fragrant\n4. Add prawns, cook 2 mins until turning pink\n5. Add tomatoes and wine, simmer 2 mins\n6. Add cooked pasta, lemon zest and juice\n7. Toss everything together, adding pasta water if needed\n8. Season well, add parsley\n9. Serve immediately with extra chilli flakes',
      category: 'Quick & Easy',
      prep_time: '10 mins',
      cook_time: '15 mins',
      servings: '4'
    },
    {
      name: 'Classic Toad in the Hole',
      ingredients: '8 good quality pork sausages\n140g plain flour\n4 eggs\n200ml milk\n2 tbsp wholegrain mustard\n3 tbsp vegetable oil or beef dripping\n1 tsp salt\nFresh thyme (optional)\n\nFor onion gravy:\n2 onions, sliced\n500ml beef stock\n1 tbsp flour\n1 tbsp butter\nSplash of Worcestershire sauce',
      instructions: '1. Put oil in large roasting tin, add sausages\n2. Cook at 220°C for 15 mins, turning once\n3. Meanwhile make batter: whisk flour, eggs, milk, mustard and salt until smooth\n4. Let batter rest while sausages cook\n5. Remove tin from oven, quickly pour batter around sausages\n6. Return to oven immediately, bake 25-30 mins until puffed and golden\n7. Don\'t open oven door during cooking!\n8. For gravy: fry onions in butter until caramelised (20 mins)\n9. Add flour, stir, then stock and Worcestershire\n10. Simmer until thick\n11. Serve toad in the hole with onion gravy',
      category: 'Comfort Food',
      prep_time: '15 mins',
      cook_time: '45 mins',
      servings: '4'
    },
    {
      name: 'Prawn Tikka Masala',
      ingredients: '400g raw king prawns\n1 onion, diced\n3 cloves garlic, minced\n1 inch ginger, grated\n2 tbsp tikka masala paste\n400g tin chopped tomatoes\n200ml double cream\n1 tsp garam masala\n1 tsp turmeric\n1 tsp paprika\n1 tsp sugar\nFresh coriander\nRice to serve\n2 tbsp vegetable oil',
      instructions: '1. Heat oil in large pan, fry onion until softened\n2. Add garlic and ginger, cook 1 min\n3. Add tikka paste, turmeric, paprika, cook 2 mins\n4. Add tomatoes and sugar, simmer 10 mins\n5. Stir in cream and garam masala\n6. Add prawns, cook 4-5 mins until pink and cooked through\n7. Season to taste\n8. Garnish with fresh coriander\n9. Serve with basmati rice and naan bread',
      category: 'Quick & Easy',
      prep_time: '10 mins',
      cook_time: '25 mins',
      servings: '4'
    },
    {
      name: 'Classic Shepherd\'s Pie',
      ingredients: '750g minced lamb\n1 large onion, diced\n2 carrots, diced\n2 celery sticks, diced\n2 cloves garlic, minced\n2 tbsp tomato puree\n1 tbsp Worcestershire sauce\n400ml lamb or beef stock\n1 tsp fresh rosemary, chopped\n1 tsp fresh thyme\n1 cup frozen peas\n\nFor mash:\n1.2kg floury potatoes\n100g butter\n100ml milk\n100g cheddar, grated\nSalt and pepper',
      instructions: '1. Fry onion, carrots, celery until soft, about 8 mins\n2. Add garlic, cook 1 min\n3. Add lamb mince, break up and brown well\n4. Add tomato puree, Worcestershire, herbs, cook 2 mins\n5. Pour in stock, simmer 25-30 mins until thick\n6. Stir in peas, season well\n7. Meanwhile, boil potatoes until tender\n8. Mash with butter, milk, season well\n9. Spoon lamb into baking dish\n10. Top with mash, rough up with fork\n11. Sprinkle with cheese\n12. Bake 200°C for 25-30 mins until golden',
      category: 'Comfort Food',
      prep_time: '25 mins',
      cook_time: '1 hour',
      servings: '6'
    },
    {
      name: 'KFC Style Crispy Chicken Tenders',
      ingredients: '600g chicken breast, cut into strips\n200ml buttermilk\n1 egg\n150g plain flour\n1 tsp paprika\n1 tsp garlic powder\n1 tsp onion powder\n½ tsp cayenne pepper\n1 tsp dried oregano\n1 tsp dried thyme\n1 tsp salt\n½ tsp black pepper\n½ tsp mustard powder\nOlive oil spray',
      instructions: '1. Mix buttermilk and egg in bowl\n2. Add chicken strips, marinate 30 mins (or overnight)\n3. Mix flour with all spices and herbs\n4. Preheat oven to 200°C, line tray with baking paper\n5. Remove chicken from buttermilk, let excess drip off\n6. Coat each piece in seasoned flour, pressing firmly\n7. Place on tray, spray generously with olive oil\n8. Bake 20-25 mins, turning halfway\n9. Chicken should be golden and cooked through\n10. Serve with chips and coleslaw',
      category: 'Kid Friendly',
      prep_time: '15 mins',
      cook_time: '25 mins',
      servings: '4'
    },
    {
      name: 'Creamy Chicken Pasta',
      ingredients: '400g pasta (penne or fusilli)\n3 chicken breasts, sliced\n200g baby spinach\n150g sundried tomatoes, chopped\n4 cloves garlic, minced\n300ml double cream\n100ml chicken stock\n80g parmesan, grated\n2 tbsp olive oil\n1 tsp Italian herbs\nSalt and pepper\nFresh basil',
      instructions: '1. Cook pasta according to packet, drain\n2. Season chicken, fry in oil until golden and cooked, set aside\n3. In same pan, add garlic, cook 30 seconds\n4. Add sundried tomatoes and Italian herbs\n5. Pour in cream and stock, simmer 3 mins\n6. Add parmesan, stir until melted\n7. Add spinach, let it wilt\n8. Return chicken to pan\n9. Add pasta, toss everything together\n10. Season to taste\n11. Serve with fresh basil and extra parmesan',
      category: 'Comfort Food',
      prep_time: '10 mins',
      cook_time: '25 mins',
      servings: '4'
    },
    {
      name: 'Chicken Stew with Dumplings',
      ingredients: '8 chicken thighs, bone-in\n3 carrots, chunked\n2 leeks, sliced\n2 celery sticks, sliced\n200g baby potatoes, halved\n500ml chicken stock\n200ml white wine (or more stock)\n2 bay leaves\n1 tsp thyme\n2 tbsp flour\n2 tbsp butter\n\nFor dumplings:\n175g self-raising flour\n75g suet\n1 tsp mustard powder\n2 tbsp fresh parsley\nPinch of salt\n100ml cold water',
      instructions: '1. Season chicken, brown in butter in large casserole, set aside\n2. Add leeks, carrots, celery, fry 5 mins\n3. Stir in flour, cook 1 min\n4. Add wine, stock, bay leaves, thyme\n5. Return chicken, bring to simmer\n6. Add potatoes, cover and cook 30 mins\n7. Make dumplings: mix flour, suet, mustard, parsley, salt\n8. Add water gradually to form soft dough\n9. Shape into 8 balls\n10. Remove casserole lid, place dumplings on top\n11. Cover, cook another 20 mins until dumplings fluffy\n12. Serve in bowls with crusty bread',
      category: 'Comfort Food',
      prep_time: '25 mins',
      cook_time: '1 hour',
      servings: '4'
    },
    {
      name: 'Chicken and Chorizo One Pan',
      ingredients: '4 chicken thighs, bone-in skin-on\n150g chorizo, sliced\n400g tin butter beans, drained\n400g tin chopped tomatoes\n1 red pepper, sliced\n1 yellow pepper, sliced\n1 red onion, sliced\n4 cloves garlic, sliced\n1 tsp smoked paprika\n100ml chicken stock\nFresh parsley\nCrusty bread to serve',
      instructions: '1. Preheat oven to 200°C\n2. Season chicken thighs\n3. Heat oven-proof pan, add chicken skin-side down\n4. Cook 5 mins until skin golden, flip and cook 2 more mins\n5. Remove chicken, set aside\n6. Add chorizo, fry until oils release\n7. Add onion and peppers, cook 5 mins\n8. Add garlic and paprika, cook 1 min\n9. Add tomatoes, stock, butter beans\n10. Nestle chicken on top, skin-side up\n11. Bake 35-40 mins until chicken cooked through\n12. Rest 5 mins, scatter parsley\n13. Serve with crusty bread to mop up sauce',
      category: 'Comfort Food',
      prep_time: '15 mins',
      cook_time: '50 mins',
      servings: '4'
    },
    {
      name: 'Chicken Biryani',
      ingredients: '4 chicken thighs, boneless, cubed\n300g basmati rice\n1 large onion, sliced\n4 cloves garlic, minced\n1 inch ginger, grated\n150g natural yoghurt\n2 tbsp biryani paste\n1 tsp turmeric\n1 tsp garam masala\n1 cinnamon stick\n4 cardamom pods\n4 cloves\n500ml chicken stock\nPinch of saffron in 3 tbsp warm milk\n3 tbsp vegetable oil\nFresh coriander\nCrispy fried onions',
      instructions: '1. Marinate chicken in yoghurt, biryani paste, half the garlic and ginger for 30 mins\n2. Rinse rice until water runs clear, soak 20 mins\n3. Fry onion until golden and crispy, set aside\n4. In same pan, fry whole spices 1 min\n5. Add remaining garlic and ginger, cook 1 min\n6. Add marinated chicken, cook until sealed\n7. Add stock, bring to boil\n8. Drain rice, add to pan, stir gently\n9. Cover tightly, cook on lowest heat 20 mins\n10. Drizzle saffron milk over top\n11. Cover again, leave 5 mins\n12. Fluff with fork, top with crispy onions and coriander',
      category: 'Weekend Special',
      prep_time: '40 mins',
      cook_time: '35 mins',
      servings: '4'
    },
    {
      name: 'Lancashire Hotpot',
      ingredients: '750g lamb neck or shoulder, cubed\n1kg potatoes, thinly sliced\n2 onions, sliced\n3 carrots, sliced\n2 lamb kidneys, chopped (optional)\n2 tbsp plain flour\n500ml lamb stock\n2 tbsp Worcestershire sauce\n2 bay leaves\n1 tsp thyme\n50g butter, melted\nSalt and pepper',
      instructions: '1. Preheat oven to 160°C\n2. Toss lamb in flour, season well\n3. Layer half the potatoes in casserole dish\n4. Add layer of onions and carrots\n5. Add all the lamb (and kidneys if using)\n6. Add bay leaves and thyme\n7. Top with remaining onions and carrots\n8. Finish with overlapping potato slices\n9. Mix stock with Worcestershire, pour over\n10. Brush potatoes with melted butter\n11. Cover with lid or foil\n12. Bake 2 hours\n13. Remove lid, bake 30 more mins until potatoes golden\n14. Serve with pickled red cabbage',
      category: 'Weekend Special',
      prep_time: '30 mins',
      cook_time: '2.5 hours',
      servings: '6'
    },
    {
      name: 'Chicken Katsu Curry',
      ingredients: '4 chicken breasts\n100g plain flour\n2 eggs, beaten\n150g panko breadcrumbs\nVegetable oil for frying\nRice to serve\n\nFor katsu sauce:\n1 onion, diced\n2 cloves garlic, minced\n1 inch ginger, grated\n1 tbsp medium curry powder\n1 tsp turmeric\n1 tsp garam masala\n1 tbsp plain flour\n300ml chicken stock\n1 tbsp soy sauce\n1 tbsp honey\n100ml coconut milk',
      instructions: '1. Make sauce: fry onion until soft\n2. Add garlic, ginger, spices, cook 2 mins\n3. Stir in flour, then gradually add stock\n4. Add soy sauce, honey, coconut milk\n5. Simmer 15 mins, blend until smooth\n6. Bash chicken to even thickness\n7. Coat in flour, then egg, then panko\n8. Shallow fry 4-5 mins each side until golden and cooked\n9. Rest on wire rack\n10. Slice chicken\n11. Serve on rice with katsu sauce drizzled over\n12. Add pickled ginger and salad on side',
      category: 'Kid Friendly',
      prep_time: '20 mins',
      cook_time: '30 mins',
      servings: '4'
    },
    {
      name: 'Satay Sweet Potato Curry',
      ingredients: '2 large sweet potatoes, cubed\n400g tin chickpeas, drained\n400ml tin coconut milk\n200g baby spinach\n1 red pepper, sliced\n1 onion, diced\n3 cloves garlic, minced\n1 inch ginger, grated\n2 tbsp Thai red curry paste\n3 tbsp peanut butter (crunchy or smooth)\n1 tbsp soy sauce\n1 lime, juiced\nFresh coriander\nCrushed peanuts\nRice or naan to serve',
      instructions: '1. Fry onion until soft\n2. Add garlic, ginger, curry paste, cook 2 mins\n3. Add sweet potato, stir to coat\n4. Pour in coconut milk, bring to simmer\n5. Cover, cook 15 mins until sweet potato tender\n6. Stir in peanut butter, soy sauce, chickpeas\n7. Add red pepper, cook 5 mins\n8. Stir in spinach until wilted\n9. Add lime juice, season to taste\n10. Serve over rice or with naan\n11. Top with coriander and crushed peanuts',
      category: 'Vegetarian',
      prep_time: '15 mins',
      cook_time: '25 mins',
      servings: '4'
    },
    {
      name: 'Curried Chicken Kebabs',
      ingredients: '500g chicken breast, cubed\n1 red pepper, chunked\n1 yellow pepper, chunked\n1 red onion, chunked\n8 wooden skewers (soaked in water)\n\nFor marinade:\n150g natural yoghurt\n2 tbsp curry powder\n1 tsp turmeric\n1 tsp cumin\n1 tsp paprika\n2 cloves garlic, minced\n1 inch ginger, grated\n1 tbsp lemon juice\nSalt and pepper\n\nTo serve:\nMint yoghurt dip\nSalad\nPitta bread',
      instructions: '1. Mix all marinade ingredients\n2. Add chicken, coat well, refrigerate 2 hours (or overnight)\n3. Thread chicken and veg onto skewers alternately\n4. Preheat grill to high\n5. Grill kebabs 12-15 mins, turning regularly\n6. Chicken should be charred and cooked through\n7. For mint yoghurt: mix yoghurt with chopped mint and cucumber\n8. Serve kebabs with pitta, salad and mint yoghurt',
      category: 'Healthy',
      prep_time: '20 mins',
      cook_time: '15 mins',
      servings: '4'
    },
  ];

  const insertMeal = db.prepare('INSERT INTO meals (name, ingredients, instructions, category, prep_time, cook_time, servings, added_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  for (const meal of preloadedMeals) {
    insertMeal.run(meal.name, meal.ingredients, meal.instructions || '', meal.category, meal.prep_time, meal.cook_time || '', meal.servings || '4', 'Preloaded');
  }

  console.log(`✅ Preloaded ${preloadedMeals.length} UK favourite meals with full recipes!`);
}

app.use(express.json({ limit: '100kb' }));
app.use(express.static('public'));

// ============ API ROUTES ============

// Get all family members
app.get('/api/family', (req, res) => {
  const members = db.prepare('SELECT * FROM family_members ORDER BY name').all();
  res.json(members);
});

// Add family member
app.post('/api/family', (req, res) => {
  const { name, likes, dislikes, dietary } = req.body;
  const stmt = db.prepare('INSERT INTO family_members (name, likes, dislikes, dietary) VALUES (?, ?, ?, ?)');
  const result = stmt.run(name, likes || '', dislikes || '', dietary || '');
  res.json({ id: result.lastInsertRowid, name, likes, dislikes, dietary });
});

// Update family member
app.put('/api/family/:id', (req, res) => {
  const { name, likes, dislikes, dietary } = req.body;
  db.prepare('UPDATE family_members SET name=?, likes=?, dislikes=?, dietary=? WHERE id=?')
    .run(name, likes || '', dislikes || '', dietary || '', req.params.id);
  res.json({ success: true });
});

// Delete family member
app.delete('/api/family/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const result = db.prepare('DELETE FROM family_members WHERE id=?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Family member not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete family member error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
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
  } else {
    res.status(404).json({ error: 'Meal not found' });
  }
});

// Add meal
app.post('/api/meals', (req, res) => {
  const { name, description, ingredients, instructions, category, prep_time, cook_time, servings, added_by } = req.body;
  const stmt = db.prepare('INSERT INTO meals (name, description, ingredients, instructions, category, prep_time, cook_time, servings, added_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const result = stmt.run(name, description || '', ingredients || '', instructions || '', category || '', prep_time || '', cook_time || '', servings || '', added_by || 'Someone');
  res.json({ id: result.lastInsertRowid, name });
});

// Update meal
app.put('/api/meals/:id', (req, res) => {
  const { name, description, ingredients, instructions, category, prep_time, cook_time, servings } = req.body;
  db.prepare('UPDATE meals SET name=?, description=?, ingredients=?, instructions=?, category=?, prep_time=?, cook_time=?, servings=? WHERE id=?')
    .run(name, description || '', ingredients || '', instructions || '', category || '', prep_time || '', cook_time || '', servings || '', req.params.id);
  res.json({ success: true });
});

// Toggle family favourite
app.put('/api/meals/:id/favourite', (req, res) => {
  const meal = db.prepare('SELECT is_family_favourite FROM meals WHERE id = ?').get(req.params.id);
  const newValue = meal.is_family_favourite ? 0 : 1;
  db.prepare('UPDATE meals SET is_family_favourite = ? WHERE id = ?').run(newValue, req.params.id);
  res.json({ is_family_favourite: newValue });
});

// Delete meal
app.delete('/api/meals/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const result = db.prepare('DELETE FROM meals WHERE id=?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete meal error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
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
  const { member_id, vote } = req.body; // vote: 1 = up, -1 = down
  try {
    db.prepare(`
      INSERT INTO meal_votes (meal_id, member_id, vote) VALUES (?, ?, ?)
      ON CONFLICT(meal_id, member_id) DO UPDATE SET vote = ?
    `).run(req.params.id, member_id, vote, vote);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove vote
app.delete('/api/meals/:id/vote/:member_id', (req, res) => {
  try {
    const mealId = parseInt(req.params.id, 10);
    const memberId = parseInt(req.params.member_id, 10);

    if (isNaN(mealId) || mealId < 1) {
      return res.status(400).json({ error: 'Invalid meal ID' });
    }
    if (isNaN(memberId) || memberId < 1) {
      return res.status(400).json({ error: 'Invalid member ID' });
    }

    db.prepare('DELETE FROM meal_votes WHERE meal_id = ? AND member_id = ?')
      .run(mealId, memberId);

    res.json({ success: true });
  } catch (err) {
    console.error('Delete vote error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
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
  const { member_id, preference } = req.body; // preference: 'like' or 'dislike'
  try {
    db.prepare(`
      INSERT INTO member_meal_preferences (meal_id, member_id, preference) VALUES (?, ?, ?)
      ON CONFLICT(meal_id, member_id) DO UPDATE SET preference = ?
    `).run(req.params.id, member_id, preference, preference);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove preference
app.delete('/api/meals/:id/preference/:member_id', (req, res) => {
  try {
    const mealId = parseInt(req.params.id, 10);
    const memberId = parseInt(req.params.member_id, 10);

    if (isNaN(mealId) || mealId < 1) {
      return res.status(400).json({ error: 'Invalid meal ID' });
    }
    if (isNaN(memberId) || memberId < 1) {
      return res.status(400).json({ error: 'Invalid member ID' });
    }

    db.prepare('DELETE FROM member_meal_preferences WHERE meal_id = ? AND member_id = ?')
      .run(mealId, memberId);

    res.json({ success: true });
  } catch (err) {
    console.error('Delete preference error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
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
app.get('/api/shopping-lists', (req, res) => {
  const lists = db.prepare('SELECT * FROM shopping_lists ORDER BY created_at DESC').all();
  res.json(lists);
});

// Create shopping list from selected meals
app.post('/api/shopping-lists', (req, res) => {
  const { name, meal_ids, created_by } = req.body;

  // Get ingredients from selected meals
  const meals = db.prepare(`SELECT name, ingredients FROM meals WHERE id IN (${meal_ids.map(() => '?').join(',')})`).all(...meal_ids);

  // Combine all ingredients
  let allIngredients = [];
  meals.forEach(meal => {
    if (meal.ingredients) {
      const items = meal.ingredients.split('\n').map(i => i.trim()).filter(Boolean);
      allIngredients = allIngredients.concat(items);
    }
  });

  // Store as JSON with checked status
  const itemsJson = JSON.stringify(allIngredients.map(item => ({ text: item, checked: false })));

  const stmt = db.prepare('INSERT INTO shopping_lists (name, items, created_by) VALUES (?, ?, ?)');
  const result = stmt.run(name || 'Shopping List', itemsJson, created_by || 'Someone');

  res.json({ id: result.lastInsertRowid, name, items: allIngredients, meals: meals.map(m => m.name) });
});

// Update shopping list (mark items as checked)
app.put('/api/shopping-lists/:id', (req, res) => {
  const { items } = req.body;
  db.prepare('UPDATE shopping_lists SET items = ? WHERE id = ?').run(JSON.stringify(items), req.params.id);
  res.json({ success: true });
});

// Delete shopping list
app.delete('/api/shopping-lists/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const result = db.prepare('DELETE FROM shopping_lists WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Shopping list not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete shopping list error:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get messages (last 50)
app.get('/api/messages', (req, res) => {
  const messages = db.prepare('SELECT * FROM messages ORDER BY created_at DESC LIMIT 50').all();
  res.json(messages.reverse());
});

// Send message
app.post('/api/messages', (req, res) => {
  const { sender, message } = req.body;
  const stmt = db.prepare('INSERT INTO messages (sender, message) VALUES (?, ?)');
  const result = stmt.run(sender, message);
  res.json({ id: result.lastInsertRowid, sender, message, created_at: new Date().toISOString() });
});

// Get dinner suggestion
app.post('/api/suggest', (req, res) => {
  const { eatingTonight } = req.body; // Array of family member IDs who are eating

  const allMembers = db.prepare('SELECT * FROM family_members').all();
  const meals = db.prepare('SELECT * FROM meals').all();

  // Filter to only members eating tonight
  const eatingMembers = eatingTonight && eatingTonight.length > 0
    ? allMembers.filter(m => eatingTonight.includes(m.id))
    : allMembers;

  if (meals.length === 0) {
    return res.json({ error: 'No meals saved yet! Add some meals first.' });
  }

  // Score each meal
  const scored = meals.map(meal => {
    let score = 50;
    let reasons = [];
    let warnings = [];
    const mealLower = (meal.name + ' ' + (meal.description || '') + ' ' + (meal.ingredients || '')).toLowerCase();

    eatingMembers.forEach(member => {
      if (member.likes) {
        member.likes.toLowerCase().split(',').map(l => l.trim()).filter(Boolean).forEach(like => {
          if (mealLower.includes(like)) {
            score += 15;
            reasons.push(`${member.name} loves ${like}`);
          }
        });
      }

      if (member.dislikes) {
        member.dislikes.toLowerCase().split(',').map(d => d.trim()).filter(Boolean).forEach(dislike => {
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

  const eatingNames = eatingMembers.map(m => m.name).join(', ');

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
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
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
  ips.forEach(ip => {
    console.log(`   Network:  http://${ip}:${PORT}`);
  });
  console.log('\nFamily members can open this on their phones to add preferences!\n');
});
