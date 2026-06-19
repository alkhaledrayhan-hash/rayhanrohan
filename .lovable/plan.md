## Goal
Build a messaging system where customers can send a message from the homepage, the right agent (owner of the property) and any admin can see and reply, and customers can read replies on a dedicated thread page.

## 1. Database (migration)

Two new tables in `public`:

### `conversations`
- `id` uuid pk
- `customer_name` text
- `customer_email` text (indexed)
- `customer_user_id` uuid nullable (if customer is signed in)
- `property_id` uuid nullable → `public.properties(id)` on delete set null
- `assigned_agent_id` uuid nullable (defaults to `properties.created_by` when `property_id` set)
- `subject` text
- `status` text ('open' | 'closed') default 'open'
- `access_token` uuid default `gen_random_uuid()` — lets a guest customer revisit the thread via URL
- `last_message_at`, `created_at`, `updated_at`

### `messages`
- `id` uuid pk
- `conversation_id` uuid → `conversations(id)` on delete cascade
- `sender_role` text ('customer' | 'agent' | 'admin')
- `sender_user_id` uuid nullable
- `sender_name` text (display fallback for guests)
- `body` text
- `created_at`

Trigger: on insert into `messages`, bump `conversations.last_message_at`.

### RLS
- **conversations**
  - INSERT: anyone (anon + authenticated) — needed for the guest widget. Server fn / `assigned_agent_id` derived from property.
  - SELECT: admin (all); agent where `assigned_agent_id = auth.uid()`; authenticated customer where `customer_user_id = auth.uid()`. Guest access goes through a server fn that checks `access_token`, not RLS.
  - UPDATE: admin + assigned agent (status only).
- **messages**
  - SELECT: admin; agent if conversation belongs to them; authenticated customer if owner. Guest read via server fn.
  - INSERT: admin/agent for their conversation; authenticated customer for their conversation. Guest writes via server fn that verifies `access_token`.

### Grants
`GRANT SELECT, INSERT, UPDATE on conversations to authenticated;` `GRANT INSERT on conversations to anon;` (for guest widget — RLS still applies), `GRANT ALL ... to service_role`. Same shape for `messages`.

### Realtime
Add `messages` and `conversations` to `supabase_realtime` publication.

## 2. Server functions (`src/lib/messages.functions.ts`)
- `createConversation({ name, email, property_id?, subject, body })` — public (no auth). Inserts conversation (resolves `assigned_agent_id` from property), inserts first message, returns `{ id, access_token }`.
- `fetchGuestThread({ id, token })` — public; returns conversation + messages if token matches.
- `replyAsGuest({ id, token, body })` — public; appends message after token check.
- `replyAsStaff({ conversation_id, body })` — `requireSupabaseAuth`; verifies caller is admin OR `assigned_agent_id`; inserts message with `sender_role` derived from role.
- `listMyConversations()` — `requireSupabaseAuth`; admin → all, agent → assigned, customer → own.
- `closeConversation({ id })` — `requireSupabaseAuth`; admin or assigned agent.

## 3. UI

### Homepage chat widget — `src/components/site/ChatWidget.tsx`
- Floating round button bottom-right (mobile + desktop), opens a panel.
- Form fields: name, email, message (property auto-prefilled if user came from a property page — phase 2; phase 1: optional property dropdown using `useProperties`).
- On submit: calls `createConversation`, stores `{id, token}` in `localStorage` (`maison_chat`), shows the thread inline in the widget with realtime updates and a reply box (uses `replyAsGuest`).
- On reopen: if localStorage has a thread, fetch + show it directly with a "Start a new conversation" link.
- Mounted from `src/routes/__root.tsx` so it appears site-wide.

### Agent dashboard — new "Messages" tab in `_authenticated/dashboard.tsx`
- Two-pane: left list of conversations (assigned to me), right thread + reply composer. Realtime subscribe.

### Admin panel — new `MessagesPanel.tsx` rendered from `admin.tsx`
- Same two-pane layout but shows all conversations, with filter by status and search by customer email.
- Reply uses `replyAsStaff` (role is admin).

### Standalone thread page — `src/routes/messages.$id.tsx` (public)
- Reads `?token=` from search params and calls `fetchGuestThread`. Used if customer clears localStorage; we can also email this link later.

## 4. Notifications (out of scope for v1)
Email pings on new replies — flagged for a later turn.

## Technical notes
- Customer widget is anon — use `supabase` browser client only for realtime; all writes go through the server fn so we control `assigned_agent_id` and never trust client-supplied agent IDs.
- Realtime channels filter by `conversation_id=eq.<id>` for the thread, and by `assigned_agent_id=eq.<uid>` (or all rows for admin) for the inbox list.
- Use existing toast (`sonner`) for feedback. Use existing `useFormatters` to render timestamps.
- Chat widget styling matches site (rounded-2xl, primary color, gold accents) — not generic AI chat aesthetics.

## Files added/changed
- Migration (new tables + RLS + grants + trigger + realtime publication)
- `src/lib/messages.functions.ts` (new)
- `src/components/site/ChatWidget.tsx` (new)
- `src/components/admin/MessagesPanel.tsx` (new)
- `src/routes/__root.tsx` (mount widget)
- `src/routes/_authenticated/dashboard.tsx` (Messages tab)
- `src/routes/_authenticated/admin.tsx` (Messages section)
- `src/routes/messages.$id.tsx` (new, public thread view)
