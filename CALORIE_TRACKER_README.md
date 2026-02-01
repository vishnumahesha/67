# 🍽️ AI Calorie Tracker Feature

A Cal AI–style calorie and nutrition tracker with AI food detection, built for the existing Expo React Native app.

## Features

- **📸 Photo Scanning**: Take a photo of your food and get instant AI detection of items + portion estimates
- **🎯 No Fake Precision**: Always provides calorie ranges (min/max) with confidence indicators
- **✏️ Correction-First UX**: 1-tap include/exclude items, portion sliders, editable entries
- **⚠️ Hidden Calories Detection**: Prompts for oils, sauces, dressings when AI detects uncertainty
- **🔄 Manual Fallback**: If AI fails, search from 200+ food database and add manually
- **📊 Daily Dashboard**: Track calories, protein, carbs, fat vs. your goals

## File Structure

```
5-Project/
├── app/
│   └── calorie-tracker/
│       ├── _layout.tsx          # Stack navigation
│       ├── index.tsx            # Home dashboard
│       ├── scan.tsx             # Camera/gallery scan
│       ├── confirm.tsx          # Confirm detected items
│       ├── manual-add.tsx       # Manual food search
│       ├── history.tsx          # Meal history
│       ├── goals.tsx            # Set nutrition goals
│       └── meal/
│           └── [id].tsx         # Meal detail view
├── server/
│   ├── routes/
│   │   └── foodRoutes.js        # API endpoints
│   ├── providers/
│   │   ├── nutritionDb.js       # Food database lookup
│   │   └── photoQuality.js      # Photo quality heuristics
│   └── data/
│       └── food_db_seed.json    # 200+ food nutrition database
├── src/
│   └── calorieTracker/
│       ├── types.ts             # TypeScript types
│       ├── api.ts               # Client API functions
│       ├── helpers.ts           # Utility functions
│       └── index.ts             # Module exports
├── store/
│   └── useCalorieStore.ts       # Zustand state management
└── supabase/
    └── migrations/
        └── 001_calorie_tracker_schema.sql  # Database schema + RLS
```

## Running the App

### 1. Start the Backend Server

```bash
cd server
npm install
npm start
```

The server requires `GEMINI_API_KEY` in a `.env` file:

```env
GEMINI_API_KEY=your_key_here
```

Get a free key at: https://aistudio.google.com/apikey

Server endpoints:
- `POST /api/food/scan` - Scan food photo with AI
- `POST /api/food/recompute` - Recalculate nutrition after edits
- `GET /api/food/search?q=chicken` - Search food database
- `GET /api/food/common` - Get common foods for quick add
- `POST /api/food/log` - Log meal (placeholder for Supabase)

### 2. Start the Expo App

```bash
# From project root
npm install
npx expo start
```

### 3. (Optional) Set up Supabase

1. Create a Supabase project at https://supabase.com
2. Run the SQL migration from `supabase/migrations/001_calorie_tracker_schema.sql`
3. Configure RLS policies (included in migration)
4. Add Supabase credentials to your app

## API Endpoints

### POST /api/food/scan

Upload a food photo for AI analysis.

**Request:**
```json
{
  "image": "base64_encoded_image"
}
```

**Response:**
```json
{
  "photoQuality": { "score": 0.85, "issues": [] },
  "items": [
    {
      "id": "item_123",
      "name": "Grilled Chicken Breast",
      "grams": 150,
      "confidence": 0.9,
      "flags": ["possible_oil"],
      "nutrition": { "calories": 165, "protein_g": 31, ... },
      "calculatedNutrition": { "calories": 247, ... }
    }
  ],
  "totals": { "calories": 450, "protein_g": 45, ... },
  "calorieRange": { "min": 380, "max": 520 },
  "confidence": 0.85,
  "followUpQuestions": [
    { "key": "oil_used", "question": "Was oil used?", "options": [...] }
  ]
}
```

### POST /api/food/recompute

Recalculate nutrition after user edits.

**Request:**
```json
{
  "items": [...],
  "answers": { "oil_used": "a little" }
}
```

## Database Schema (Supabase)

### Tables

1. **profiles** - User goals (calories, protein, carbs, fat)
2. **meals** - Logged meals with totals and confidence
3. **meal_items** - Individual food items in a meal
4. **food_cache** - Cached nutrition lookups for speed
5. **scans** - AI scan history and raw responses

All tables have RLS policies so users can only access their own data.

## Key Design Decisions

### Cal AI–Style UX
- Photo → Detected items → Confirm/Edit → Log
- Always show calorie range, never single numbers
- Hidden calories prompts for uncertain foods
- One-tap item toggle, not delete-first

### Confidence System
- Items rated 0-1 based on AI detection confidence
- Overall confidence factors in photo quality + flags
- Calorie range widens with: mixed dishes, restaurant food, oils/sauces

### Fallback Strategy
- If AI fails, route to manual search
- 200+ food database ensures demo never breaks
- Fuzzy search with aliases (e.g., "chicken" → "Chicken Breast")

## Environment Variables

### Server (.env)
```env
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
```

### App (optional for Supabase)
```env
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```

## Demo Tips

1. **Good lighting** improves AI detection accuracy
2. **Single plate** works better than multiple
3. **Clear visibility** of all items helps
4. **Adjust portions** with sliders if AI estimate is off
5. **Answer hidden calories** questions for tighter ranges

## Tech Stack

- **Frontend**: Expo React Native + TypeScript
- **Navigation**: expo-router
- **State**: Zustand + AsyncStorage
- **Backend**: Express.js
- **AI**: Google Gemini 2.0 Flash
- **Database**: Supabase (Postgres) + Local JSON fallback

---

Built for hackathon demo - fast to log, reliable, Cal AI inspired!
