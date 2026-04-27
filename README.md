# ReviewIT — Setup Guide

## What's in this project

A fully connected React app with Supabase backend. Features:
- Editorial feed (articles + videos)
- Place directory with profiles and scores
- Comparison tool
- AI-powered ReviewIT bot
- User authentication (sign up / sign in)
- Real-time comments on all content

---

## Setup (takes about 10 minutes)

### Step 1 — Install Node.js
If you don't have it: https://nodejs.org — download the LTS version and install it.

### Step 2 — Add your Supabase keys
1. Rename the file `.env.example` to `.env`
2. Open `.env` in any text editor (Notepad is fine)
3. Go to your Supabase project → Settings → API
4. Copy the **Project URL** → paste as `VITE_SUPABASE_URL`
5. Copy the **anon public** key → paste as `VITE_SUPABASE_ANON_KEY`

### Step 3 — Install dependencies
Open Terminal (Mac) or Command Prompt (Windows) in this folder and run:
```
npm install
```

### Step 4 — Start the app
```
npm run dev
```
Open your browser to http://localhost:5173

---

## Adding content

### Adding a Place
1. Go to your Supabase project → Table Editor → `places`
2. Click **Insert row**
3. Fill in: name, slug (URL-friendly name, e.g. `nok-kitchen`), city, country, category_id
4. Set `is_published = true` when ready to go live

### Adding an Article
1. Table Editor → `articles`
2. Fill in: title, slug, body (markdown), author_id, category_id
3. Set `is_published = true` and `published_at` to today's date

### Adding Place Scores (for Comparison tool)
1. Table Editor → `place_scores`
2. Insert a row with `place_id`, `parameter_id`, and `score` (0–10)
3. Find parameter IDs in the `comparison_parameters` table

### Making someone an Editor or Admin
1. Table Editor → `profiles`
2. Find the user's row
3. Change `role` from `reader` to `editor` or `admin`

---

## Deploying to the web (Vercel — free)

1. Create a free account at https://vercel.com
2. Install Vercel CLI: `npm install -g vercel`
3. In this folder, run: `vercel`
4. Follow the prompts
5. Add your environment variables in the Vercel dashboard (same VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)

Your live URL will be something like `reviewit.vercel.app`

---

## File structure

```
src/
  components/
    Navbar.jsx       — top navigation
    Feed.jsx         — editorial article/video feed
    Places.jsx       — place directory
    PlaceProfile.jsx — individual place page with scores + comments
    Compare.jsx      — side-by-side comparison tool
    AskBot.jsx       — AI-powered ReviewIT Guide chatbot
    Comments.jsx     — threaded comments (used on articles + places)
    Login.jsx        — sign in / sign up
  hooks/
    useData.js       — all Supabase data fetching
    useAuth.js       — authentication state
  lib/
    supabase.js      — Supabase client (reads from .env)
  App.jsx            — routing
  main.jsx           — entry point
```
