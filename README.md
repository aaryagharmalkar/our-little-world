# Our Little World ♡ ("Us ♡")
### A Private Couple Application & Custom iPhone Home Screen Widget

> Designed with love as a personal birthday surprise. A tiny private digital world belonging exclusively to two lovers, pairing iPhones with shared memories, distance, daily moods, questions, and hugs.

---

## 🌟 Core Features

- 📸 **Shared Photo Album & Hourly Widget Rotation:**
  - Full couple photo album with multi-upload, client-side downscaling/compression, captions, and favorite filters.
  - Deterministic backend hourly photo rotation so both partner iPhones display the exact same memory on their widgets.
- 📍 **Distance Between Us (Haversine GPS):**
  - Consent-based foreground location updates with kilometer accuracy.
  - Dynamic proximity trend indicator (*Getting closer...* vs *Moving farther apart*).
  - Explicit stale location warnings and one-tap pause controls.
- 💭 **Daily Mood Check-in:**
  - 10 curated romantic & emotional emojis (🥰, 😊, 😐, 🥺, 😭, 😴, 😤, 🤒, 🤩, 🫠).
  - Optional personal note + partner status card + historical mood log.
- 💌 **Private Notes & Letters:**
  - Instant realtime chat powered by Supabase Realtime.
  - One-tap quick presets (*"Missing you."*, *"Eat something!"*, *"Wish you were here."*).
- ❓ **Question of the Day (Mutual Reveal):**
  - Daily curated intimacy questions for each day of the year.
  - Responses remain hidden in frosted lock until **both** partners submit their answer, then reveal simultaneously.
- 🫂 **Virtual Hugs, Kisses & Touches:**
  - Send Hugs, Kisses, Forehead kisses, Hearts, Cuddles, and Bear hugs.
  - Triggers custom animated heart & confetti canvas celebration on the receiver's screen.
- ⏳ **Relationship Countdown & Story:**
  - Days together counter (*"Together for 842 days ♡"*).
  - Countdown to upcoming anniversaries, birthdays, and custom milestones.
- 📱 **Scriptable iOS Home Screen Widget:**
  - Native JavaScript widget for Scriptable on iPhone 15 & iPhone 14.
  - Supports **Small**, **Medium**, and **Large** widget layouts.
  - Offline local disk caching (`FileManager.local()`) and deep links to app sections.
- 🎁 **Birthday Surprise Invitation Flow:**
  - Single-use, 30-day expiring pairing QR code generated directly in-app.
  - Boyfriend joins effortlessly from his iPhone without needing a laptop or code editing.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite 6, Tailwind CSS, Lucide Icons, Canvas-Confetti, QRCode |
| **Backend & DB** | Supabase, PostgreSQL 15, Row Level Security (RLS), Supabase Storage, Realtime Pub/Sub |
| **iOS Widget** | Scriptable (JavaScript, ListWidget, FileManager, Request, iOS 16+) |
| **Location** | Browser Geolocation API, Haversine formula calculation |
| **Deployment** | Vercel / Netlify / Cloudflare Pages compatible (PWA Ready) |

---

## 📁 Project Structure

```
c:\Github\Us/
├── public/                     # PWA manifest and romantic heart icons
├── src/
│   ├── components/
│   │   ├── auth/              # Sign in, Sign up, Profile management
│   │   ├── common/            # Header, BottomNav, MoreMenuTab
│   │   ├── countdown/         # Relationship countdowns & milestones
│   │   ├── dashboard/         # Hero photo of the hour, mood pills, distance
│   │   ├── interactions/      # Virtual hugs, kisses & canvas confetti celebration
│   │   ├── location/          # Haversine distance, consent, pause toggle
│   │   ├── messages/          # Realtime notes & quick messages
│   │   ├── mood/              # Daily mood selector & history timeline
│   │   ├── pairing/           # Birthday surprise QR code & pairing
│   │   ├── photos/            # Shared album, upload modal, lightbox viewer
│   │   ├── questions/         # Daily question & mutual reveal logic
│   │   └── widget/            # Interactive Scriptable widget simulator
│   ├── context/
│   │   ├── AuthContext.tsx    # Auth session, profiles, demo switcher
│   │   └── CoupleContext.tsx  # Shared state, Supabase Realtime channels & actions
│   ├── lib/
│   │   ├── demoData.ts        # Instant offline demo data for testing on Windows
│   │   ├── geo.ts             # Haversine formula, proximity trends, staleness checks
│   │   ├── storage.ts         # Client-side image compression & Supabase upload
│   │   └── supabase.ts        # Supabase client init & config detection
│   ├── types/
│   │   ├── couple.ts          # Mood configs, quick messages, interaction types
│   │   └── database.ts        # Comprehensive database TypeScript interfaces
│   ├── App.tsx                # Main application orchestrator & deep link router
│   ├── index.css              # Romantic styling, typography, safe-area padding
│   └── main.tsx               # App root
├── supabase/
│   ├── migrations/
│   │   └── 20261121000000_init_our_little_world.sql # 14 tables, RLS policies, RPC snapshot
│   └── seed_questions.sql     # 50 romantic & intimate questions of the day
├── tests/
│   └── businessLogic.test.js  # Node.js native unit tests for calculations
├── widget/
│   ├── OurLittleWorldWidget.js# Complete Scriptable iOS widget script
│   └── README.md              # 2-minute iPhone 14/15 setup guide
├── BIRTHDAY_SURPRISE_GUIDE.md # Master birthday surprise checklist
└── package.json
```

---

## 💻 Local Development (Windows 11)

### 1. Install Dependencies
```powershell
npm install
```

### 2. Run Local Development Server
```powershell
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note on Demo Mode:** If Supabase keys are not yet configured in `.env`, the app automatically launches in **Interactive Demo Mode** with pre-populated memories, distance simulation, and a demo user switcher (`Me ♡` / `Him ♡`) so you can test every single feature immediately!

### 3. Run Business Logic Unit Tests
```powershell
npm test
```

### 4. Build Production Bundle
```powershell
npm run build
```

---

## 🔒 Security & Privacy Architecture

- **Row Level Security (RLS):** Every single database table has explicit RLS policies checking space membership via `is_space_member()`.
- **Strict 2-Member Limit:** A PostgreSQL trigger (`trg_check_max_couple_members`) prevents any third party from ever joining your couple space.
- **Mutual Reveal Logic:** Daily question answers are hidden in SQL from the partner until both members have submitted their responses.
- **No Leaked Secrets:** The custom Scriptable widget uses only the Supabase anonymous publishable key combined with a restricted RPC function `get_widget_snapshot(widget_token)` that only exposes the paired couple's data.
