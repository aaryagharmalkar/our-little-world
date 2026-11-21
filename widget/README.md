# Our Little World ♡ - Scriptable iPhone Widget Guide
## Compatible with iPhone 15, iPhone 14 & iOS 16+

This directory contains the custom JavaScript widget designed for the iOS **Scriptable** application.

---

### What The Widget Displays

| Widget Size | Key Information Displayed | Deep Link Target |
| :--- | :--- | :--- |
| **Small** | Shared photo of the hour, both partners' moods (`🥰 ♡ 😴`), distance (`12.4 km`) | Opens Dashboard |
| **Medium** | Left: Panoramic photo memory. Right: Distance + trend (`↓ Closer`), both moods with notes, latest note | Opens Dashboard / Notes |
| **Large** | Panoramic photo memory, distance + trend, both moods, latest message note, relationship countdown (`842 days together`), daily question teaser | Opens Dashboard |

---

### 2-Minute Setup on iPhone 14 & iPhone 15

1. **Install Scriptable:**
   - Download the free **[Scriptable app from Apple App Store](https://apps.apple.com/app/scriptable/id1405459188)**.

2. **Add Widget Script:**
   - Open **Scriptable**.
   - Tap the **`+`** icon at the top right to create a new script.
   - Title the script: `Our Little World`.
   - Copy the entire code from [`OurLittleWorldWidget.js`](./OurLittleWorldWidget.js) and paste it into the editor.
   - Update `DEFAULT_CONFIG` at the top of the file with:
     - `supabaseUrl`: Your Supabase URL (e.g. `https://xyz.supabase.co`)
     - `supabaseAnonKey`: Your Supabase Anon Key
     - `widgetToken`: Your Couple Space Widget Token (found in App -> Explore -> Scriptable Widget)
     - `appBaseUrl`: Your hosted web app URL (e.g. `https://our-little-world.vercel.app`)
   - Tap **Done**.

3. **Add to iPhone Home Screen:**
   - Go to your iPhone Home Screen and long-press on an empty area until the icons jiggle.
   - Tap the **`+`** button in the top left corner.
   - Search for **Scriptable** and choose **Medium** (or **Large** / **Small**).
   - Tap **Add Widget**.
   - Long-press the newly added widget and select **Edit Widget**.
   - Set **Script** to `Our Little World`.
   - Set **When Interacting** to `Open URL`.
   - Tap outside to finish!

---

### Key Technical Notes

- **Hourly Photo Rotation:** iOS controls when third-party widgets wake up to refresh. The widget requests updates every ~1 hour (`widget.refreshAfterDate = new Date(Date.now() + 3600000)`).
- **Offline Caching:** The widget automatically caches the latest photo, mood, message, and distance in local storage (`FileManager.local()`). If there is no network or iPhone is on airplane mode, the widget displays the cached memory and never shows an empty error box.
- **Security:** The widget uses the Supabase Anonymous publishable key and communicates with the restricted RPC function `get_widget_snapshot(widget_token)`. No sensitive account passwords or service role keys are stored in the widget.
