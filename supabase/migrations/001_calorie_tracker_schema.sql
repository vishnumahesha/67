-- ============================================
-- CALORIE TRACKER SCHEMA
-- AI-powered nutrition tracking with Cal AI style UX
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- Stores user goals and preferences
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    goal_calories INT CHECK (goal_calories > 0 AND goal_calories < 10000),
    goal_protein INT CHECK (goal_protein >= 0 AND goal_protein < 500),
    goal_carbs INT CHECK (goal_carbs >= 0 AND goal_carbs < 1000),
    goal_fat INT CHECK (goal_fat >= 0 AND goal_fat < 500),
    display_name TEXT,
    avatar_url TEXT
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 2. MEALS TABLE
-- Stores logged meals with totals
-- ============================================
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    eaten_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    photo_url TEXT,
    total_calories INT NOT NULL DEFAULT 0,
    total_protein_g REAL NOT NULL DEFAULT 0,
    total_carbs_g REAL NOT NULL DEFAULT 0,
    total_fat_g REAL NOT NULL DEFAULT 0,
    confidence REAL CHECK (confidence >= 0 AND confidence <= 1),
    calorie_min INT,
    calorie_max INT,
    notes TEXT
);

-- Index for fast daily queries
CREATE INDEX IF NOT EXISTS meals_user_eaten_at_idx ON meals(user_id, eaten_at DESC);

-- RLS for meals
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meals" ON meals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals" ON meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals" ON meals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals" ON meals
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. MEAL_ITEMS TABLE
-- Individual food items within a meal
-- ============================================
CREATE TABLE IF NOT EXISTS meal_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'serving',
    grams REAL,
    calories INT NOT NULL DEFAULT 0,
    protein_g REAL NOT NULL DEFAULT 0,
    carbs_g REAL NOT NULL DEFAULT 0,
    fat_g REAL NOT NULL DEFAULT 0,
    fiber_g REAL,
    sugar_g REAL,
    sodium_mg REAL,
    confidence REAL CHECK (confidence >= 0 AND confidence <= 1),
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('ai', 'usda', 'manual', 'custom')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for meal items lookup
CREATE INDEX IF NOT EXISTS meal_items_meal_id_idx ON meal_items(meal_id);

-- RLS for meal_items (inherit from meals)
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal items" ON meal_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meals 
            WHERE meals.id = meal_items.meal_id 
            AND meals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own meal items" ON meal_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM meals 
            WHERE meals.id = meal_items.meal_id 
            AND meals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own meal items" ON meal_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM meals 
            WHERE meals.id = meal_items.meal_id 
            AND meals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own meal items" ON meal_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM meals 
            WHERE meals.id = meal_items.meal_id 
            AND meals.user_id = auth.uid()
        )
    );

-- ============================================
-- 4. FOOD_CACHE TABLE
-- Cache for frequently looked up foods (speed optimization)
-- ============================================
CREATE TABLE IF NOT EXISTS food_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    canonical_name TEXT NOT NULL,
    per_100g JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    hit_count INT DEFAULT 1,
    UNIQUE(user_id, query)
);

-- Index for fast cache lookups
CREATE INDEX IF NOT EXISTS food_cache_user_query_idx ON food_cache(user_id, query);

-- RLS for food_cache
ALTER TABLE food_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own food cache" ON food_cache
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food cache" ON food_cache
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food cache" ON food_cache
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food cache" ON food_cache
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 5. SCANS TABLE
-- Tracks AI scan attempts and raw responses
-- ============================================
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    photo_url TEXT,
    ai_raw JSONB,
    quality_score REAL CHECK (quality_score >= 0 AND quality_score <= 1),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'fallback')),
    error_message TEXT,
    processing_time_ms INT
);

-- Index for scan history
CREATE INDEX IF NOT EXISTS scans_user_created_idx ON scans(user_id, created_at DESC);

-- RLS for scans
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scans" ON scans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans" ON scans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to get daily totals for a user
CREATE OR REPLACE FUNCTION get_daily_totals(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_calories INT,
    total_protein_g REAL,
    total_carbs_g REAL,
    total_fat_g REAL,
    meal_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(m.total_calories), 0)::INT,
        COALESCE(SUM(m.total_protein_g), 0)::REAL,
        COALESCE(SUM(m.total_carbs_g), 0)::REAL,
        COALESCE(SUM(m.total_fat_g), 0)::REAL,
        COUNT(*)
    FROM meals m
    WHERE m.user_id = p_user_id
    AND DATE(m.eaten_at) = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update meal totals when items change
CREATE OR REPLACE FUNCTION update_meal_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE meals
    SET 
        total_calories = (SELECT COALESCE(SUM(calories), 0) FROM meal_items WHERE meal_id = COALESCE(NEW.meal_id, OLD.meal_id)),
        total_protein_g = (SELECT COALESCE(SUM(protein_g), 0) FROM meal_items WHERE meal_id = COALESCE(NEW.meal_id, OLD.meal_id)),
        total_carbs_g = (SELECT COALESCE(SUM(carbs_g), 0) FROM meal_items WHERE meal_id = COALESCE(NEW.meal_id, OLD.meal_id)),
        total_fat_g = (SELECT COALESCE(SUM(fat_g), 0) FROM meal_items WHERE meal_id = COALESCE(NEW.meal_id, OLD.meal_id))
    WHERE id = COALESCE(NEW.meal_id, OLD.meal_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update meal totals
DROP TRIGGER IF EXISTS meal_items_update_totals ON meal_items;
CREATE TRIGGER meal_items_update_totals
    AFTER INSERT OR UPDATE OR DELETE ON meal_items
    FOR EACH ROW
    EXECUTE FUNCTION update_meal_totals();

-- ============================================
-- 7. DEFAULT PROFILE CREATION
-- Auto-create profile when user signs up
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, goal_calories, goal_protein, goal_carbs, goal_fat)
    VALUES (
        NEW.id,
        2000,  -- Default 2000 cal
        150,   -- Default 150g protein
        200,   -- Default 200g carbs
        65     -- Default 65g fat
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
