
# Vercel Deploy with Your Own Supabase Project

Apni Lovable Cloud er bodole nijer Supabase project use korben Vercel e. Eta full manual setup — Lovable er role thakbe shudhu code edit korar, backend apnar.

## Step 1: Notun Supabase Project Banano

1. https://supabase.com e gie sign up / login korun
2. **New Project** click korun → name, password, region (Qatar er kache: Mumbai/Singapore) din
3. Project create howar por **Settings → API** e jaan ebong ei 3ta value copy korun:
   - **Project URL** → `https://xxxxx.supabase.co`
   - **anon public key** → publishable key
   - **service_role key** → secret (ekdom kauke dekhaben na)

## Step 2: Database Migrations Apply Kora

Apnar local machine e (terminal):

```bash
# Supabase CLI install (Mac)
brew install supabase/tap/supabase

# Login
supabase login

# Apnar notun project er sathe link
supabase link --project-ref <NEW_PROJECT_REF>

# Migrations push (shob table, RLS, policies create hobe)
supabase db push
```

Eta `supabase/migrations/` folder er shob SQL file run korbe.

## Step 3: Storage Buckets Banano

Notun Supabase project er **Storage** section e gie manually create korun:
- `agent-avatars` (private)
- `media` (private)

## Step 4: Auth Configure Kora

Supabase Dashboard → **Authentication → URL Configuration**:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/**`, `http://localhost:8080/**`

Google login chaile → **Authentication → Providers → Google** enable korun (Google Cloud Console e OAuth client banate hobe).

## Step 5: GitHub e Code Push

```bash
git push origin main
```

## Step 6: Vercel e Deploy

1. https://vercel.com → **Add New Project** → GitHub repo import
2. Framework auto-detect hobe (`vercel.json` already ache)
3. **Environment Variables** section e ei 5ta add korun:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Step 1 er Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Step 1 er anon key |
| `SUPABASE_URL` | Same Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Same anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Step 1 er service_role key |

4. **Deploy** click korun

## Step 7: LOVABLE_API_KEY (Optional)

Apnar app e Lovable AI Gateway use hocche kina check korun (chat, AI features). Hole `LOVABLE_API_KEY` o lagbe — Lovable Cloud disconnect korle eta kaaj korbe na, apnake **OpenAI / Anthropic** er nijer API key use korte code modify korte hobe.

---

## Important Warnings

- **Data migrate hobe na**: Lovable Cloud er `zavgbuhzvotyaxdrhspi` project er existing data (properties, users, bookings) notun Supabase e auto-copy hobe na. Lagle manually export/import korte hobe (`pg_dump`).
- **Lovable preview vs Vercel**: Vercel deploy er por Lovable preview o notun Supabase project er sathe connect korte chaile, `.env` file Lovable Cloud override korbe na — preview Lovable Cloud DB e thakbe.
- **Service role key kokhono frontend e expose korben na** — shudhu Vercel env variable hisebe rakhben.

---

## Aamar Kora Lagbe?

Ei plan e Lovable side e **kono code change nei** — pura kaaj apnar Supabase + Vercel dashboard e. Apnar local terminal e migrations push korte hobe.

Confirm korun — plan approve korle ami extra `deploy.md` update kore din-by-din checklist likhe dite pari, ba kichu specific code adjustment lagle (jemon LOVABLE_API_KEY replace) shei kaaj korte pari.
