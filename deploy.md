Complete Vercel Deployment Steps
Here's everything you need to do:

1. Push to GitHub (run this)

cd /Users/shahin/Desktop/Xpeed/Laravel/rayhanrohan
git push origin main
2. Deploy on Vercel
Go to vercel.com → Add New Project
Import your GitHub repo: AhnabShahin/rayhanrohan
Vercel will auto-detect vercel.json — leave all settings as-is
Click Environment Variables and add these 4 variables:
Name	Value
VITE_SUPABASE_URL	https://zavgbuhzvotyaxdrhspi.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your anon key)
SUPABASE_URL	https://zavgbuhzvotyaxdrhspi.supabase.co
SUPABASE_PUBLISHABLE_KEY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (same anon key)
Click Deploy
3. Set Supabase Redirect URLs (required for auth to work)
After deploy, your Vercel URL will be something like https://rayhanrohan.vercel.app. You must add it to Supabase:

Go to your Supabase dashboard
Authentication → URL Configuration
Add to Redirect URLs: https://rayhanrohan.vercel.app/**
Update Site URL to: https://rayhanrohan.vercel.app
4. Apply DB Migrations (if not already done)
Your Supabase DB is already live — if migrations haven't been applied yet:


# Install Supabase CLI
brew install supabase/tap/supabase

# Apply migrations
supabase login
supabase link --project-ref zavgbuhzvotyaxdrhspi
supabase db push
What was changed:

vite.config.ts — added nitro: { preset: "vercel" } to tell the build to output for Vercel's serverless runtime
vercel.json — created with bun build commands
.gitignore — added .env and .vercel/output patterns, removed .env from git tracking (your keys were in a public repo!)