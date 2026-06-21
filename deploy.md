# Vercel Deploy Guide — Nijer Supabase Project Soho

Ei guide follow korle apni Lovable Cloud er bodole nijer Supabase project use kore Vercel e deploy korte parben.

---

## Step 1: Notun Supabase Project Banano

1. https://supabase.com → Sign in → **New Project**
2. Name, strong database password, region (Qatar er kache: **Mumbai** ba **Singapore**) select korun
3. Project ready hole **Settings → API** e jaan
4. Ei 3ta value safe jaygay copy kore rakhun:
   - **Project URL** → `https://xxxxx.supabase.co`
   - **Project Reference ID** → `xxxxx` (URL er subdomain part)
   - **anon public** key
   - **service_role** key ⚠️ (kauke share korben na, frontend e dichchen na)

---

## Step 2: Database Migrations Apply Kora

Local terminal e:

```bash
# Supabase CLI install (Mac)
brew install supabase/tap/supabase

# Windows hole: scoop install supabase
# Linux hole: https://github.com/supabase/cli#install-the-cli

# Login (browser khulbe)
supabase login

# Project folder e jaan
cd /Users/shahin/Desktop/Xpeed/Laravel/rayhanrohan

# Notun project er sathe link korun
supabase link --project-ref <NEW_PROJECT_REF>

# Database password chaibe — Step 1 e set kora password din

# Shob migrations push korun
supabase db push
```

Eta `supabase/migrations/` folder er shob SQL file run korbe — tables, RLS policies, functions, triggers shob create hobe.

---

## Step 3: Storage Buckets Banano

Supabase Dashboard → **Storage** → **New bucket** kore manually create korun:

| Bucket Name | Public |
|-------------|--------|
| `agent-avatars` | No (Private) |
| `media` | No (Private) |

---

## Step 4: Auth Configure Kora

### URL Configuration

Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs** (add multiple):
  - `https://your-app.vercel.app/**`
  - `http://localhost:8080/**` (local dev er jonno)

### Google OAuth (Optional)

Google login chaile:

1. Google Cloud Console → OAuth 2.0 Client banan
2. Authorized redirect URI: `https://<NEW_PROJECT_REF>.supabase.co/auth/v1/callback`
3. Supabase Dashboard → **Authentication → Providers → Google** enable korun
4. Client ID + Secret paste korun

### Email Settings

- **Authentication → Email Templates** check korun
- Production e "Confirm email" enable rakhun (security er jonno)

---

## Step 5: Code Push to GitHub

```bash
cd /Users/shahin/Desktop/Xpeed/Laravel/rayhanrohan
git add .
git commit -m "Setup for Vercel deployment"
git push origin main
```

---

## Step 6: Vercel e Deploy

1. https://vercel.com → **Add New Project**
2. GitHub repo import: `AhnabShahin/rayhanrohan`
3. Framework auto-detect hobe (`vercel.json` already configured)
4. **Environment Variables** section khulun ebong ei 5ta add korun:

| Name | Value | Scope |
|------|-------|-------|
| `VITE_SUPABASE_URL` | Step 1 er Project URL | Production, Preview, Development |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Step 1 er anon key | Production, Preview, Development |
| `SUPABASE_URL` | Same Project URL | Production, Preview, Development |
| `SUPABASE_PUBLISHABLE_KEY` | Same anon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Step 1 er service_role key | Production, Preview, Development |

5. **Deploy** click korun
6. Build complete hole apnar URL pabean: `https://rayhanrohan.vercel.app`

---

## Step 7: Deploy er Pore Supabase Auth Update

Vercel apnar actual URL diye dile (e.g. `https://rayhanrohan-xyz123.vercel.app`):

Supabase Dashboard → **Authentication → URL Configuration** e ei URL add korun:
- Site URL update korun
- Redirect URLs e add korun: `https://rayhanrohan-xyz123.vercel.app/**`

---

## Step 8: Admin User Banano

Notun Supabase project e kono user nei. First admin banate:

1. Vercel deployed site e gie `/auth` page e signup korun
2. Supabase Dashboard → **SQL Editor** → run korun:

```sql
-- Apnar user ID find korun
SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Admin role assign korun (apnar user_id din)
INSERT INTO public.user_roles (user_id, role)
VALUES ('your-user-id-here', 'admin');
```

3. Logout kore abar login korun — admin panel access pabean

---

## ⚠️ Important Warnings

### Data Migration

- **Existing data auto-copy hobe na**. Lovable Cloud project (`zavgbuhzvotyaxdrhspi`) er properties, users, bookings notun Supabase e jabe na automatically.
- Migrate korte chaile: Lovable Cloud Supabase → **Database → Backups** theke dump nin, ba `pg_dump` use korun.

### Lovable Preview vs Vercel

- Vercel deploy er por o **Lovable preview Lovable Cloud DB e thakbe** — Lovable er `.env` apni edit korte parben na.
- Dui jaygay shared data chaile dui project sync korar mechanism dorkar (recommend kori na).

### LOVABLE_API_KEY

- App e jodi Lovable AI features use hocche (chat completions, AI image gen), tahole Vercel deploy e shei feature **kaaj korbe na** karon `LOVABLE_API_KEY` Lovable Cloud-only.
- Vercel e cholate hole code modify kore OpenAI/Anthropic er nijer API key use korte hobe.

### Security

- `SUPABASE_SERVICE_ROLE_KEY` **kokhono** frontend e expose korben na, GitHub e commit korben na.
- `.env` file `.gitignore` e ache verify korun.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fail "Missing SUPABASE_URL" | Vercel env vars check korun, redeploy korun |
| Login redirect "Invalid URL" | Supabase Site URL + Redirect URLs e Vercel URL add ache kina check korun |
| "Unsupported provider: google" | Supabase Auth → Providers → Google enable korun |
| Tables nei error | `supabase db push` rerun korun |
| Admin panel access nei | Step 8 follow kore `user_roles` e admin row add korun |
| Storage upload fail | Step 3 er buckets create korechen kina check korun |

---

## Files Already Configured

- `vite.config.ts` — `nitro: { preset: "vercel" }` set ache
- `vercel.json` — build commands configured
- `.gitignore` — `.env` ignored
