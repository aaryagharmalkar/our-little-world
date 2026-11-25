// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: heart;

/**
 * ==============================================================================
 * SCRIPTABLE iOS WIDGET: Our Little World ♡ ("Us ♡")
 * Compatible with iPhone 15, iPhone 14, and all iOS 16+ devices running Scriptable.
 * 
 * Aesthetic: Warm beige, blush pink, soft cream, muted lavender, elegant typography.
 * Supports: Small, Medium, Large widget sizes.
 * Caches data locally so widget NEVER shows a blank screen even offline.
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// CONFIGURATION (Configured automatically or via widget parameter)
// Format in Widget Parameter: SUPABASE_URL|ANON_KEY|WIDGET_TOKEN
// Or hardcode your values below for zero-setup convenience:
// ------------------------------------------------------------------------------
const DEFAULT_CONFIG = {
  supabaseUrl: "https://wikztmzuyjtxnpjlctrt.supabase.co", // Live Supabase project URL
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpa3p0bXp1eWp0eG5wamxjdHJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2MTY0MjksImV4cCI6MjExMTE5MjQyOX0.6xJIWSeY9sJEsQLuwm2jogGubqaLMICs04aiTupPdMo", // Live Supabase Anon Key
  widgetToken: "REPLACE_WITH_YOUR_WIDGET_TOKEN", // Couple Space Widget Token (copied from app Settings)
  appBaseUrl: "https://aaryagharmalkar.github.io/our-little-world", // Companion web app URL for deep links
};

// Parse parameter if passed from iOS widget settings
let CONFIG = { ...DEFAULT_CONFIG };
if (args.widgetParameter && args.widgetParameter.includes("|")) {
  const parts = args.widgetParameter.split("|");
  if (parts.length >= 3) {
    CONFIG.supabaseUrl = parts[0].trim();
    CONFIG.supabaseAnonKey = parts[1].trim();
    CONFIG.widgetToken = parts[2].trim();
    if (parts[3]) CONFIG.appBaseUrl = parts[3].trim();
  }
}

// ------------------------------------------------------------------------------
// COLOR PALETTE & DESIGN TOKENS
// ------------------------------------------------------------------------------
const THEME = {
  bgCream: new Color("#FAF7F2"),
  bgSand: new Color("#F5F0E6"),
  cardBg: new Color("#FFFFFF", 0.92),
  cardBorder: new Color("#EFE8DC"),
  blush: new Color("#CE7973"),
  blushSoft: new Color("#F8ECE9"),
  blushDeep: new Color("#B55A55"),
  lavender: new Color("#8E73B5"),
  lavenderSoft: new Color("#F2EDF8"),
  textDark: new Color("#2D2823"),
  textMuted: new Color("#7D756C"),
  textSubtle: new Color("#A39B91"),
  emerald: new Color("#2D8A58"),
};

// ------------------------------------------------------------------------------
// DATA FETCHING & LOCAL CACHE ENGINE
// ------------------------------------------------------------------------------
const fm = FileManager.local();
const CACHE_DIR = fm.joinPath(fm.documentsDirectory(), "our_little_world_cache");
if (!fm.fileExists(CACHE_DIR)) {
  fm.createDirectory(CACHE_DIR);
}
const DATA_CACHE_PATH = fm.joinPath(CACHE_DIR, "snapshot.json");
const PHOTO_CACHE_PATH = fm.joinPath(CACHE_DIR, "current_photo.jpg");

async function fetchWidgetSnapshot() {
  try {
    const endpoint = `${CONFIG.supabaseUrl}/rest/v1/rpc/get_widget_snapshot`;
    const req = new Request(endpoint);
    req.method = "POST";
    req.headers = {
      "Content-Type": "application/json",
      "apikey": CONFIG.supabaseAnonKey,
      "Authorization": `Bearer ${CONFIG.supabaseAnonKey}`,
    };
    req.body = JSON.stringify({ p_widget_token: CONFIG.widgetToken });
    req.timeoutInterval = 8; // Quick timeout to keep widget responsive

    const res = await req.loadJSON();
    if (res && !res.error) {
      // Save to local cache
      fm.writeString(DATA_CACHE_PATH, JSON.stringify(res));
      return res;
    }
  } catch (err) {
    console.log("Fetch failed, falling back to local cache: " + err);
  }

  // Fallback to cached data
  if (fm.fileExists(DATA_CACHE_PATH)) {
    try {
      const cachedStr = fm.readString(DATA_CACHE_PATH);
      return JSON.parse(cachedStr);
    } catch (e) {
      console.log("Failed reading cache: " + e);
    }
  }

  // Return romantic offline fallback
  return getOfflineFallback();
}

async function loadPhoto(photoUrl) {
  if (!photoUrl) {
    if (fm.fileExists(PHOTO_CACHE_PATH)) {
      return fm.readImage(PHOTO_CACHE_PATH);
    }
    return null;
  }

  try {
    const req = new Request(photoUrl);
    req.timeoutInterval = 10;
    const img = await req.loadImage();
    if (img) {
      fm.writeImage(PHOTO_CACHE_PATH, img);
      return img;
    }
  } catch (err) {
    console.log("Photo fetch failed, reading cache: " + err);
  }

  if (fm.fileExists(PHOTO_CACHE_PATH)) {
    return fm.readImage(PHOTO_CACHE_PATH);
  }
  return null;
}

function getOfflineFallback() {
  return {
    space: { name: "Our Little World ♡", days_together: 842, next_anniversary_days: 23 },
    members: {
      user1: { name: "You", mood: { emoji: "🥰", label: "Happy", note: "Missing you!" } },
      user2: { name: "Him", mood: { emoji: "😴", label: "Tired", note: "Need a hug" } },
    },
    distance: { km: 12.4, trend: "getting_closer", is_available: true },
    latest_message: { content: "Wish you were here ♡", sender: "Him" },
    daily_question: { text: "What is your favorite memory of us?", both_answered: false },
    generated_at: new Date().toISOString(),
  };
}

// ------------------------------------------------------------------------------
// WIDGET BUILDERS: SMALL, MEDIUM, LARGE
// ------------------------------------------------------------------------------

async function createSmallWidget(data, photoImg) {
  const widget = new ListWidget();
  widget.backgroundColor = THEME.bgCream;
  widget.setPadding(12, 12, 12, 12);
  widget.url = `${CONFIG.appBaseUrl}/?tab=dashboard`;

  // Top Row: App Monogram + Distance
  const topRow = widget.addStack();
  topRow.layoutHorizontally();
  topRow.centerAlignContent();

  const title = topRow.addText("Us ♡");
  title.font = Font.boldSystemFont(11);
  title.textColor = THEME.blushDeep;

  topRow.addSpacer();

  const distVal = data.distance && data.distance.is_available && data.distance.km !== null
    ? `${data.distance.km} km`
    : "♡";
  const distText = topRow.addText(distVal);
  distText.font = Font.boldSystemFont(11);
  distText.textColor = data.distance && data.distance.trend === "getting_closer" ? THEME.emerald : THEME.blush;

  widget.addSpacer(6);

  // Center: Photo Thumbnail (or placeholder)
  const photoStack = widget.addStack();
  photoStack.centerAlignContent();
  if (photoImg) {
    const imgView = photoStack.addImage(photoImg);
    imgView.imageSize = new Size(130, 72);
    imgView.cornerRadius = 14;
    imgView.applyFillingContentMode();
  } else {
    photoStack.backgroundColor = THEME.bgSand;
    photoStack.size = new Size(130, 72);
    photoStack.cornerRadius = 14;
  }

  widget.addSpacer(6);

  // Bottom Row: Both Moods
  const moodRow = widget.addStack();
  moodRow.layoutHorizontally();
  moodRow.centerAlignContent();
  moodRow.backgroundColor = THEME.cardBg;
  moodRow.cornerRadius = 12;
  moodRow.setPadding(4, 8, 4, 8);

  const m1 = data.members?.user1?.mood?.emoji || "🥰";
  const m2 = data.members?.user2?.mood?.emoji || "🤍";

  const m1Text = moodRow.addText(m1);
  m1Text.font = Font.systemFont(14);

  moodRow.addSpacer();

  const heart = moodRow.addText("♡");
  heart.font = Font.systemFont(10);
  heart.textColor = THEME.blush;

  moodRow.addSpacer();

  const m2Text = moodRow.addText(m2);
  m2Text.font = Font.systemFont(14);

  return widget;
}

async function createMediumWidget(data, photoImg) {
  const widget = new ListWidget();
  widget.backgroundColor = THEME.bgCream;
  widget.setPadding(12, 14, 12, 14);
  widget.url = `${CONFIG.appBaseUrl}/?tab=dashboard`;

  const mainStack = widget.addStack();
  mainStack.layoutHorizontally();
  mainStack.centerAlignContent();

  // LEFT COLUMN: Photo Memory (45% width)
  const leftCol = mainStack.addStack();
  leftCol.layoutVertically();

  if (photoImg) {
    const imgView = leftCol.addImage(photoImg);
    imgView.imageSize = new Size(136, 126);
    imgView.cornerRadius = 18;
    imgView.applyFillingContentMode();
  } else {
    leftCol.backgroundColor = THEME.bgSand;
    leftCol.size = new Size(136, 126);
    leftCol.cornerRadius = 18;
  }

  mainStack.addSpacer(12);

  // RIGHT COLUMN: Distance, Moods, Latest Message (55% width)
  const rightCol = mainStack.addStack();
  rightCol.layoutVertically();

  // Header / Title
  const headerRow = rightCol.addStack();
  headerRow.layoutHorizontally();
  headerRow.centerAlignContent();

  const title = headerRow.addText("Our Little World");
  title.font = Font.boldSystemFont(11);
  title.textColor = THEME.blushDeep;

  headerRow.addSpacer();

  const heartIcon = headerRow.addText("♡");
  heartIcon.font = Font.systemFont(11);
  heartIcon.textColor = THEME.blush;

  rightCol.addSpacer(4);

  // Distance row
  const distStack = rightCol.addStack();
  distStack.layoutHorizontally();
  distStack.centerAlignContent();

  const kmText = data.distance && data.distance.is_available && data.distance.km !== null
    ? `${data.distance.km} km apart`
    : "Together in heart ♡";
  const distLabel = distStack.addText(kmText);
  distLabel.font = Font.boldSystemFont(13);
  distLabel.textColor = THEME.textDark;

  if (data.distance?.trend === "getting_closer") {
    distStack.addSpacer(4);
    const trendText = distStack.addText("↓ Closer");
    trendText.font = Font.boldSystemFont(9);
    trendText.textColor = THEME.emerald;
  }

  rightCol.addSpacer(6);

  // Moods pill
  const moodPill = rightCol.addStack();
  moodPill.layoutHorizontally();
  moodPill.centerAlignContent();
  moodPill.backgroundColor = THEME.cardBg;
  moodPill.cornerRadius = 10;
  moodPill.setPadding(4, 6, 4, 6);

  const u1Name = data.members?.user1?.name || "You";
  const u1Emoji = data.members?.user1?.mood?.emoji || "🥰";
  const u2Name = data.members?.user2?.name || "Him";
  const u2Emoji = data.members?.user2?.mood?.emoji || "😴";

  const moodDesc = moodPill.addText(`${u1Emoji} ${u1Name}  ♡  ${u2Emoji} ${u2Name}`);
  moodDesc.font = Font.systemFont(10);
  moodDesc.textColor = THEME.textDark;

  rightCol.addSpacer(6);

  // Latest message bubble
  if (data.latest_message && data.latest_message.content) {
    const msgBox = rightCol.addStack();
    msgBox.backgroundColor = THEME.blushSoft;
    msgBox.cornerRadius = 10;
    msgBox.setPadding(5, 8, 5, 8);

    const msgText = msgBox.addText(`"${data.latest_message.content}"`);
    msgText.font = Font.italicSystemFont(10);
    msgText.textColor = THEME.blushDeep;
    msgText.lineLimit = 2;
  } else {
    // Days together
    const daysBox = rightCol.addStack();
    const days = daysBox.addText(`Together for ${data.space?.days_together || 0} days ♡`);
    days.font = Font.systemFont(10);
    days.textColor = THEME.textMuted;
  }

  return widget;
}

async function createLargeWidget(data, photoImg) {
  const widget = new ListWidget();
  widget.backgroundColor = THEME.bgCream;
  widget.setPadding(14, 16, 14, 16);
  widget.url = `${CONFIG.appBaseUrl}/?tab=dashboard`;

  // TOP SECTION: Shared Photo (Panoramic)
  const topPhotoStack = widget.addStack();
  topPhotoStack.layoutVertically();
  if (photoImg) {
    const imgView = topPhotoStack.addImage(photoImg);
    imgView.imageSize = new Size(328, 145);
    imgView.cornerRadius = 20;
    imgView.applyFillingContentMode();
  } else {
    topPhotoStack.backgroundColor = THEME.bgSand;
    topPhotoStack.size = new Size(328, 145);
    topPhotoStack.cornerRadius = 20;
  }

  widget.addSpacer(10);

  // MIDDLE ROW: Title + Distance + Days Together
  const midRow = widget.addStack();
  midRow.layoutHorizontally();
  midRow.centerAlignContent();

  const distTitle = midRow.addText(
    data.distance && data.distance.is_available && data.distance.km !== null
      ? `${data.distance.km} km apart`
      : "Distance Paused"
  );
  distTitle.font = Font.boldSystemFont(15);
  distTitle.textColor = THEME.textDark;

  if (data.distance?.trend === "getting_closer") {
    midRow.addSpacer(6);
    const trendPill = midRow.addText("● Getting closer");
    trendPill.font = Font.boldSystemFont(10);
    trendPill.textColor = THEME.emerald;
  }

  midRow.addSpacer();

  const daysTogether = midRow.addText(`${data.space?.days_together || 0} days together ♡`);
  daysTogether.font = Font.systemFont(11);
  daysTogether.textColor = THEME.blushDeep;

  widget.addSpacer(8);

  // MOODS & LATEST NOTE ROW
  const moodCard = widget.addStack();
  moodCard.layoutHorizontally();
  moodCard.centerAlignContent();
  moodCard.backgroundColor = THEME.cardBg;
  moodCard.cornerRadius = 14;
  moodCard.setPadding(8, 10, 8, 10);

  const u1Emoji = data.members?.user1?.mood?.emoji || "🥰";
  const u1Note = data.members?.user1?.mood?.note || "Happy";
  const u2Emoji = data.members?.user2?.mood?.emoji || "😴";
  const u2Note = data.members?.user2?.mood?.note || "Resting";

  const m1Text = moodCard.addText(`${u1Emoji} ${u1Note}`);
  m1Text.font = Font.systemFont(11);
  m1Text.textColor = THEME.textDark;
  m1Text.lineLimit = 1;

  moodCard.addSpacer();

  const heartSep = moodCard.addText("♡");
  heartSep.font = Font.systemFont(11);
  heartSep.textColor = THEME.blush;

  moodCard.addSpacer();

  const m2Text = moodCard.addText(`${u2Emoji} ${u2Note}`);
  m2Text.font = Font.systemFont(11);
  m2Text.textColor = THEME.textDark;
  m2Text.lineLimit = 1;

  widget.addSpacer(8);

  // BOTTOM SECTION: Question of the Day or Latest Message
  const bottomCard = widget.addStack();
  bottomCard.layoutVertically();
  bottomCard.backgroundColor = THEME.blushSoft;
  bottomCard.cornerRadius = 14;
  bottomCard.setPadding(8, 10, 8, 10);

  if (data.latest_message && data.latest_message.content) {
    const msgSender = bottomCard.addText(`From ${data.latest_message.sender || "Love"}:`);
    msgSender.font = Font.boldSystemFont(10);
    msgSender.textColor = THEME.blushDeep;

    bottomCard.addSpacer(2);

    const msgBody = bottomCard.addText(`"${data.latest_message.content}"`);
    msgBody.font = Font.italicSystemFont(11);
    msgBody.textColor = THEME.textDark;
    msgBody.lineLimit = 2;
  } else if (data.daily_question) {
    const qLabel = bottomCard.addText("Question of the day:");
    qLabel.font = Font.boldSystemFont(10);
    qLabel.textColor = THEME.blushDeep;

    bottomCard.addSpacer(2);

    const qBody = bottomCard.addText(`"${data.daily_question.text}"`);
    qBody.font = Font.systemFont(11);
    qBody.textColor = THEME.textDark;
    qBody.lineLimit = 2;
  }

  return widget;
}

// ------------------------------------------------------------------------------
// SCRIPT ENTRY POINT
// ------------------------------------------------------------------------------
async function run() {
  const data = await fetchWidgetSnapshot();
  const photoUrl = data.photo?.signed_url || data.photo?.public_url;
  const photoImg = await loadPhoto(photoUrl);

  let widget;
  const family = config.widgetFamily || "medium";

  if (family === "small") {
    widget = await createSmallWidget(data, photoImg);
  } else if (family === "large") {
    widget = await createLargeWidget(data, photoImg);
  } else {
    widget = await createMediumWidget(data, photoImg);
  }

  // Request next refresh in approximately 1 hour (iOS manages exact execution)
  widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 60);

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    // In-app interactive preview inside Scriptable
    if (family === "small") widget.presentSmall();
    else if (family === "large") widget.presentLarge();
    else widget.presentMedium();
  }

  Script.complete();
}

await run();
