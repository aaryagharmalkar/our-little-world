# Birthday Surprise Master Checklist & Setup Guide ♡
### Project: Our Little World ("Us ♡")

This guide is designed for preparing the surprise on your **Windows 11 laptop** in advance, so that on his birthday, everything works flawlessly on his **iPhone 14** without requiring a laptop or technical hassle.

---

## 🎂 The Birthday Vision

1. You hand him a cute card or envelope with the **Pairing QR Code**.
2. He points his iPhone 14 camera at the QR code and taps the link.
3. The companion web app opens in Safari on his iPhone and automatically adds him to your private couple space.
4. He installs Scriptable (if not already installed) and adds the **"Our Little World ♡"** widget to his Home Screen.
5. Instantly, his Home Screen shows your shared photograph, your current mood, the distance between you, and sweet personal notes!

---

## 🛠️ Step 1: Pre-Birthday Setup (On Windows 11)

### 1.1 Create Free Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New Project** and name it `our-little-world` (select the region nearest to both of you).
3. Once the database is provisioned, go to **Project Settings -> API**:
   - Copy **Project URL** (`https://xxxxxxxxxxxx.supabase.co`)
   - Copy **Project API Key (anon / public)** (`eyJhbG...`)

### 1.2 Run Database Migrations
1. In your Supabase dashboard, open the **SQL Editor** tab on the left sidebar.
2. Click **New query**.
3. Open `supabase/migrations/20261121000000_init_our_little_world.sql` on your laptop, copy all contents, paste into the Supabase SQL editor, and click **Run**.
   - *This creates all 14 tables, security policies (RLS), hourly photo rotation engine, and the widget snapshot API.*
4. Open `supabase/seed_questions.sql`, paste into the SQL editor, and click **Run**.
   - *This seeds 50 romantic and thoughtful Questions of the Day.*

### 1.3 Create Storage Bucket for Photos
1. In the Supabase dashboard, go to **Storage** on the left menu.
2. Click **New bucket**.
3. Set Bucket name to: `photos`.
4. Toggle **Public bucket** to `ON` (so images can be rendered in the Scriptable widget without complex signing).
5. Click **Save**.

### 1.4 Configure Local Environment
In your project folder `c:\Github\Us`:
1. Create or edit `.env`:
```ini
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_APP_URL=https://your-app-domain.vercel.app
```
2. Run test and verify build in Windows PowerShell:
```powershell
npm test
npm run build
```

---

## 🚀 Step 2: Deploy Companion App Online (Free & Permanent)

To ensure he can access the app anytime from his iPhone without your laptop running, deploy the app to **Vercel** or **Netlify** (both have generous free tiers).

### Option A: Deploy with Vercel CLI (Recommended on Windows)
1. In PowerShell:
```powershell
npm install -g vercel
vercel login
vercel
```
2. Follow prompts (select default settings).
3. In Vercel Project Settings -> Environment Variables, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL` (set to your Vercel deployment URL, e.g. `https://our-little-world.vercel.app`)

---

## 📸 Step 3: Pre-Populate Memories Before His Birthday

1. Open your deployed companion app in your browser on your laptop or iPhone 15.
2. Click **Account -> Sign Up** to create your account (e.g. `Aarya`).
3. Set your couple space name and relationship start date (e.g., `2023-04-18`).
4. Go to **Photos** tab and upload your favorite couple memories with sweet captions.
5. In **Our Story** tab, add special dates:
   - His birthday 🎂
   - Your anniversary ♡
   - Memorable trips or upcoming dates ✈️
6. In **Daily Mood**, set your mood so he sees it the moment his widget boots up!

---

## 🎁 Step 4: Prepare His Invitation QR Code

1. In the companion app, click the **Pair / Invite** button in the top navigation bar.
2. A single-use 30-day pairing QR code is generated on screen.
3. Save or print this QR code:
   - Print it inside a physical birthday card.
   - Or display it on your phone for him to scan.

---

## 📱 Step 5: The Birthday Moment on His iPhone 14

When you give him the surprise:

1. **Scan QR Code:**
   - He opens the Camera app on his iPhone 14 and scans the QR code.
   - Safari opens the invitation link: `https://our-little-world.vercel.app/?invite=XYZ12345`.
   - The app asks him for a password and his nickname (e.g., `Him ♡` or his name).
   - Once submitted, he is joined into your shared world!

2. **Add PWA to iPhone Home Screen:**
   - In Safari, tap the **Share** button (the square with arrow pointing up).
   - Tap **Add to Home Screen**.
   - Tap **Add**. (Now he has a clean, standalone couple app icon on his home screen!).

3. **Install the Home Screen Widget (Takes 90 seconds):**
   - Download the free **Scriptable** app from the iOS App Store on his phone.
   - Open Scriptable, tap `+`, name it `Our Little World`.
   - Copy the script from `widget/OurLittleWorldWidget.js` (you can send it via AirDrop, Notes, or iMessage).
   - In `OurLittleWorldWidget.js`, ensure the top configuration has your Vercel URL and widget token.
   - Add a **Medium** or **Large** Scriptable widget to his iPhone 14 Home Screen.
   - Long-press widget -> **Edit Widget** -> Select `Our Little World`.
   - **Voila!** His Home Screen now displays your shared photo, mood, distance, and little love letters.

---

## ❤️ Frequently Asked Questions

**Q: Does his iPhone 14 need background location always on?**
No. Foreground location updates occur when the app is opened, which respects battery life and iOS restrictions. The distance card clearly indicates when location was last updated.

**Q: What if he is offline or on airplane mode?**
The widget has a local cache engine. It saves the last received photo and details to his iPhone's local storage and displays them without error.

**Q: Can anyone else see our photos or location?**
Never. Supabase Row Level Security (RLS) policies strictly enforce that only members of your paired space (`max 2 members`) can read, query, or receive data.
