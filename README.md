# SON 7 🂡

A fast-paced, production-minded multiplayer take on the classic "7s" card
game — built with React, TypeScript, Vite, Tailwind, Framer Motion, and
Zustand on the frontend, with a swappable Firebase / Supabase realtime
backend.

> **Status of this build.** The full game engine, UI, bot AI, chat,
> auth flow, lobby, leaderboard, match history, and reconnect support are
> complete and wired together. It runs immediately with **zero API keys**
> against a local, zero-config backend (see [Backends](#backends) below).
> The Firebase and Supabase adapters are fully implemented against real
> schemas/Cloud Functions/Edge Functions included in this repo, but they
> need *your own* project credentials to go live — nobody can hand you a
> working cloud project without also handing you its secret keys, so wiring
> those up is the one step left for you to do (10–15 minutes, instructions
> below).

---

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL in **two browser tabs** (or two different
browsers) to play a real multiplayer match against yourself locally — the
default "local" backend syncs game/room/chat state across tabs on the same
machine via `BroadcastChannel`, with no server required.

To try it solo instead, create a room and add 1–5 AI bots from the lobby's
host controls, then start the game.

---

## Rules implemented

- Standard 52-card deck, no jokers, shuffled with Fisher–Yates.
- 7 cards dealt to every player; one random face-up card starts the center
  pile; the rest becomes the draw pile.
- Turn order starts at the room's seat 0 (whoever created the room) and
  proceeds clockwise.
- **Match**: play a card sharing the active suit or rank.
- **No match**: draw exactly one card, which cannot be played that same
  turn; turn ends immediately.
- **Ace — Skip**: playing an Ace skips the next player *unless* they hold
  and play an Ace themselves, in which case the skip passes on down the
  line (this chains indefinitely and never deadlocks — see
  `resolveAceAutoSkips` in `src/logic/engine.ts`).
- **Seven — Stacking draw**: 1st Seven ⇒ next player draws 2 unless they
  play a Seven; 2nd stacked Seven ⇒ 4; 3rd ⇒ 6; continues +2 forever.
- **Jack — Wild**: always playable regardless of suit/rank; the player who
  plays it immediately chooses the new active suit.
- **Win**: first player to reach zero cards wins immediately and the round
  ends.

All of this lives in **pure, dependency-free functions**
(`src/logic/engine.ts`, `src/logic/rules.ts`, `src/logic/deck.ts`) that are
unit-testable in isolation and are the single source of truth the UI, the
bot AI, and every backend adapter (including the real server-side
Cloud/Edge Functions) all defer to — so a move is validated identically no
matter which client or server evaluates it.

---

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (custom felt-table / glass-panel design system) |
| Animation | Framer Motion (card deals, hand fanning, confetti, modals) |
| State | Zustand (`useGameStore`, `useAuthStore`, `useUIStore`) |
| Routing | React Router v6 |
| Auth + Realtime | Pluggable: **Local** (default) / **Firebase** / **Supabase** |
| Sound | Procedural Web Audio synthesis — no binary asset files shipped |

---

## Backends

The entire app talks to one interface, `BackendProvider`
(`src/backend/BackendProvider.ts`). Three implementations exist:

| Provider | File | Needs credentials? | Use for |
|---|---|---|---|
| `local` (default) | `src/backend/localBackend.ts` | No | Local dev, demos, same-machine playtesting |
| `firebase` | `src/backend/firebaseBackend.ts` | Yes | Real cross-device multiplayer, Google/email/guest auth |
| `supabase` | `src/backend/supabaseBackend.ts` | Yes | Same, on Postgres/Supabase infra |

Switch by editing `.env`:

```bash
cp .env.example .env
# then set:
VITE_BACKEND_PROVIDER=local   # or "firebase" or "supabase"
```

### Why "local" is safe to ship as the default

It's real client-side code — not a stub. It runs the exact same
server-authoritative `applyMove` reducer used by the cloud functions, and
persists to `localStorage` with cross-tab sync via `BroadcastChannel`, so
two tabs genuinely play a shared game. Its limitation (documented in the
file) is that it has no cross-tab write locking — fine for local
dev/demos, not for production traffic. That's what the two real adapters
are for.

### Wiring up Firebase (real cross-device play)

1. Create a project at console.firebase.google.com. Enable
   **Authentication** (Google, Email/Password, and Anonymous providers)
   and **Firestore**.
2. Copy your web app config into `.env` (`VITE_FIREBASE_*` keys).
3. Deploy security rules and indexes:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
4. Deploy the move-validation Cloud Function:
   ```bash
   cd firebase/functions && npm install && cd ../..
   firebase deploy --only functions
   ```
5. Set `VITE_BACKEND_PROVIDER=firebase` and restart `npm run dev`.

### Wiring up Supabase (real cross-device play)

1. Create a project at supabase.com. In the SQL editor, run
   `supabase/schema.sql` (tables, RLS policies, and the
   `get_my_game_view` function that returns each player their own
   hand-hidden view of the game).
2. Copy your project URL and anon key into `.env`
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3. Deploy the move-validation Edge Function:
   ```bash
   supabase functions deploy play-move
   ```
4. Enable Google OAuth and Anonymous sign-ins in Authentication settings.
5. Set `VITE_BACKEND_PROVIDER=supabase` and restart `npm run dev`.

---

## Security model

- **Never trust the client.** Every move (`PLAY_CARD`, `DRAW_CARD`,
  `CHOOSE_SUIT`) is sent as an *intent*, not a state mutation. It is
  re-validated from scratch against the current authoritative state by:
  - the local backend's in-process call to `applyMove` (dev/demo), or
  - a Cloud Function (Firebase) / Edge Function (Supabase) running with a
    service-role key that clients can never reach directly.
- Firestore rules / Postgres RLS policies block clients from writing to
  `gameStates` / `game_states` directly — the only write path is through
  the validated function, so hand-editing a hand in dev tools, forging a
  win, or skipping a turn is not possible.
- Each player is only ever sent their **own** hand; opponents' hands are
  represented as a `handCount`. (`get_my_game_view` in Supabase and the
  equivalent Firestore read path enforce this server-side.)
- Reconnect support: `useReconnect` sends a heartbeat on tab-focus/online
  events; `subscribePresence` tracks who's actually online per room so a
  dropped player doesn't silently break the turn order — bots aren't
  substituted automatically, but the UI clearly shows disconnected seats.

---

## Project structure

```
son7/
├─ src/
│  ├─ types/          # Card, Game, Room, User, Chat domain types
│  ├─ logic/           # deck.ts, rules.ts, engine.ts (pure, testable), bots.ts
│  ├─ backend/         # BackendProvider interface + local/firebase/supabase impls
│  ├─ store/           # useGameStore, useAuthStore, useUIStore (Zustand)
│  ├─ hooks/           # useRoomSync, useReconnect, useCountdown, useSound
│  ├─ components/
│  │  ├─ cards/        # PlayingCard, Hand, DrawPile, DiscardPile, SuitPicker
│  │  ├─ table/        # GameTable, PlayerSeat, TurnIndicator
│  │  ├─ lobby/        # RoomCreateForm, RoomJoinForm, HostControls, LobbyPlayerList
│  │  ├─ chat/         # ChatPanel, EmojiPicker
│  │  ├─ effects/      # Confetti, WinnerModal
│  │  └─ common/       # Avatar, Button, GlassPanel, Modal, Spinner, ToastStack
│  ├─ pages/           # Landing, Login, Lobby, Game, Profile, Leaderboard, MatchHistory
│  ├─ router/          # React Router route table
│  ├─ App.tsx          # Shell: nav, toasts, outlet
│  └─ main.tsx          # Entry point
├─ firebase/            # firestore.rules, indexes, Cloud Function source
├─ supabase/            # schema.sql, Edge Function source
├─ tailwind.config.ts
├─ vite.config.ts
└─ .env.example
```

---

## Features checklist

- [x] Create room / join room with 6-character code
- [x] Lobby with live player list, seat assignment, host controls
- [x] Add/remove AI bots (with a genuine, non-trivial move-selection strategy)
- [x] Google / Email / Guest login (real flows on Firebase & Supabase; a
      keyless local-demo equivalent on the default backend)
- [x] Profile: display name, avatar picker, stats
- [x] Leaderboard (Elo-style rating, sorted)
- [x] Match history (per-user, with placements and duration)
- [x] Live chat with quick-emoji picker
- [x] Procedural sound effects (play, draw, shuffle, turn, win, chat, error)
- [x] Responsive layout, dark glass UI over a felt card table
- [x] Card deal/fan/play animations, confetti on win
- [x] Reconnect support (heartbeat + presence)
- [x] Server-authoritative move validation on both real backends

## Known limitations / next steps

- The local backend's cross-tab writes are last-write-wins (no locking) —
  fine for demos, not for production load; use Firebase/Supabase for that.
- Disconnected human players are shown as offline but not auto-replaced by
  a bot mid-game; that's a reasonable v2 addition (`heartbeat`/`presence`
  are already in place to build it on top of).
- Direction-reversal cards (traditionally "2"s in some regional variants)
  were not in the specified rule set, so `direction` exists in the type
  system but is always `1` — it's there so adding a reverse-rule variant
  later doesn't require a state-shape migration.

---

## Scripts

```bash
npm run dev       # start Vite dev server
npm run build     # type-check + production build to dist/
npm run preview   # preview the production build locally
npm run lint      # ESLint
```
