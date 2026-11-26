/**
 * Generator for the full iOS Scriptable Widget code with active couple credentials
 */
export function generateFullWidgetScript(options: {
  supabaseUrl: string
  supabaseAnonKey: string
  widgetToken: string
  appBaseUrl: string
}): string {
  return `// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: heart;

/**
 * ==============================================================================
 * SCRIPTABLE iOS WIDGET: Our Little World ♡ ("Us ♡")
 * Production-Ready iOS Home Screen Widget
 * ==============================================================================
 */

const DEFAULT_CONFIG = {
  supabaseUrl: "${options.supabaseUrl}",
  supabaseAnonKey: "${options.supabaseAnonKey}",
  widgetToken: "${options.widgetToken}",
  appBaseUrl: "${options.appBaseUrl}",
};

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

const THEME = {
  bgCream: new Color("#FAF7F2"),
  bgSand: new Color("#F5F0E6"),
  cardBg: new Color("#FFFFFF", 0.94),
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

const fm = FileManager.local();
const CACHE_DIR = fm.joinPath(fm.documentsDirectory(), "our_little_world_cache");
if (!fm.fileExists(CACHE_DIR)) {
  fm.createDirectory(CACHE_DIR);
}
const DATA_CACHE_PATH = fm.joinPath(CACHE_DIR, "snapshot.json");
const PHOTO_CACHE_PATH = fm.joinPath(CACHE_DIR, "current_photo.jpg");

async function fetchWidgetSnapshot() {
  try {
    const endpoint = \`\${CONFIG.supabaseUrl}/rest/v1/rpc/get_widget_snapshot\`;
    const req = new Request(endpoint);
    req.method = "POST";
    req.headers = {
      "Content-Type": "application/json",
      "apikey": CONFIG.supabaseAnonKey,
      "Authorization": \`Bearer \${CONFIG.supabaseAnonKey}\`,
    };
    req.body = JSON.stringify({ p_widget_token: CONFIG.widgetToken });
    req.timeoutInterval = 8;

    const res = await req.loadJSON();
    if (res && !res.error && res.space) {
      fm.writeString(DATA_CACHE_PATH, JSON.stringify(res));
      return res;
    }
  } catch (err) {
    console.log("Supabase fetch notice: " + err);
  }

  if (fm.fileExists(DATA_CACHE_PATH)) {
    try {
      const cachedStr = fm.readString(DATA_CACHE_PATH);
      const parsed = JSON.parse(cachedStr);
      if (parsed && parsed.space) return parsed;
    } catch (e) {
      console.log("Failed reading cache: " + e);
    }
  }

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
    req.headers = {
      "apikey": CONFIG.supabaseAnonKey,
      "Authorization": \`Bearer \${CONFIG.supabaseAnonKey}\`,
    };
    req.timeoutInterval = 12;
    const img = await req.loadImage();
    if (img) {
      fm.writeImage(PHOTO_CACHE_PATH, img);
      return img;
    }
  } catch (err) {
    console.log("Photo fetch notice: " + err);
  }

  if (fm.fileExists(PHOTO_CACHE_PATH)) {
    return fm.readImage(PHOTO_CACHE_PATH);
  }
  return null;
}

function getOfflineFallback() {
  return {
    space: { name: "Our Little World ♡", days_together: 500, next_anniversary_days: 230 },
    members: {
      user1: { name: "Aaryaaa", mood: { emoji: "🥰", label: "Happy", note: "Missing you!" } },
      user2: { name: "Him", mood: { emoji: "😴", label: "Tired", note: "Need a hug" } },
    },
    distance: { km: null, trend: "unknown", is_available: false },
    latest_message: { content: "Forever and always ♡", sender: "Him" },
    daily_question: { text: "What is your favorite memory of us together?", both_answered: false },
    generated_at: new Date().toISOString(),
  };
}

async function createSmallWidget(data, photoImg) {
  const widget = new ListWidget();
  widget.backgroundColor = THEME.bgCream;
  widget.setPadding(12, 12, 12, 12);
  widget.url = \`\${CONFIG.appBaseUrl}/\`;

  const topRow = widget.addStack();
  topRow.layoutHorizontally();
  topRow.centerAlignContent();

  const title = topRow.addText("Us ♡");
  title.font = Font.boldSystemFont(11);
  title.textColor = THEME.blushDeep;

  topRow.addSpacer();

  const distVal = data.distance && data.distance.is_available && data.distance.km !== null
    ? \`\${data.distance.km} km\`
    : "Together ♡";
  const distText = topRow.addText(distVal);
  distText.font = Font.boldSystemFont(10);
  distText.textColor = data.distance && data.distance.trend === "getting_closer" ? THEME.emerald : THEME.blush;

  widget.addSpacer(6);

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
    photoStack.layoutVertically();
    photoStack.centerAlignContent();
    photoStack.setPadding(4, 4, 4, 4);

    photoStack.addSpacer();
    const heartText = photoStack.addText("♡");
    heartText.font = Font.systemFont(20);
    heartText.textColor = THEME.blush;
    heartText.centerAlignText();

    const daysText = photoStack.addText(\`\${data.space?.days_together || 0} days\`);
    daysText.font = Font.boldSystemFont(11);
    daysText.textColor = THEME.textDark;
    daysText.centerAlignText();
    photoStack.addSpacer();
  }

  widget.addSpacer(6);

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
  widget.url = \`\${CONFIG.appBaseUrl}/\`;

  const mainStack = widget.addStack();
  mainStack.layoutHorizontally();
  mainStack.centerAlignContent();

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
    leftCol.centerAlignContent();
    leftCol.setPadding(8, 8, 8, 8);

    leftCol.addSpacer();
    const heartText = leftCol.addText("♡");
    heartText.font = Font.systemFont(28);
    heartText.textColor = THEME.blush;
    heartText.centerAlignText();

    leftCol.addSpacer(4);
    const monogram = leftCol.addText(\`\${data.space?.days_together || 0} Days\`);
    monogram.font = Font.boldSystemFont(13);
    monogram.textColor = THEME.textDark;
    monogram.centerAlignText();

    const subMonogram = leftCol.addText("Together");
    subMonogram.font = Font.systemFont(10);
    subMonogram.textColor = THEME.textMuted;
    subMonogram.centerAlignText();
    leftCol.addSpacer();
  }

  mainStack.addSpacer(12);

  const rightCol = mainStack.addStack();
  rightCol.layoutVertically();

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

  const distStack = rightCol.addStack();
  distStack.layoutHorizontally();
  distStack.centerAlignContent();

  const kmText = data.distance && data.distance.is_available && data.distance.km !== null
    ? \`\${data.distance.km} km apart\`
    : "Together in heart ♡";
  const distLabel = distStack.addText(kmText);
  distLabel.font = Font.boldSystemFont(12);
  distLabel.textColor = THEME.textDark;

  if (data.distance?.trend === "getting_closer") {
    distStack.addSpacer(4);
    const trendText = distStack.addText("↓ Closer");
    trendText.font = Font.boldSystemFont(9);
    trendText.textColor = THEME.emerald;
  }

  rightCol.addSpacer(6);

  const moodPill = rightCol.addStack();
  moodPill.layoutHorizontally();
  moodPill.centerAlignContent();
  moodPill.backgroundColor = THEME.cardBg;
  moodPill.cornerRadius = 10;
  moodPill.setPadding(4, 6, 4, 6);

  const u1Name = data.members?.user1?.name || "Aarya";
  const u1Emoji = data.members?.user1?.mood?.emoji || "🥰";
  const u2Name = data.members?.user2?.name || "Him";
  const u2Emoji = data.members?.user2?.mood?.emoji || "🤍";

  const moodDesc = moodPill.addText(\`\${u1Emoji} \${u1Name}  ♡  \${u2Emoji} \${u2Name}\`);
  moodDesc.font = Font.systemFont(10);
  moodDesc.textColor = THEME.textDark;

  rightCol.addSpacer(6);

  if (data.latest_message && data.latest_message.content) {
    const msgBox = rightCol.addStack();
    msgBox.backgroundColor = THEME.blushSoft;
    msgBox.cornerRadius = 10;
    msgBox.setPadding(5, 8, 5, 8);

    const msgText = msgBox.addText(\`"\${data.latest_message.content}"\`);
    msgText.font = Font.italicSystemFont(10);
    msgText.textColor = THEME.blushDeep;
    msgText.lineLimit = 2;
  } else if (data.daily_question && data.daily_question.text) {
    const qBox = rightCol.addStack();
    qBox.backgroundColor = THEME.blushSoft;
    qBox.cornerRadius = 10;
    qBox.setPadding(5, 8, 5, 8);

    const qText = qBox.addText(\`Q: \${data.daily_question.text}\`);
    qText.font = Font.systemFont(9);
    qText.textColor = THEME.blushDeep;
    qText.lineLimit = 2;
  } else {
    const daysBox = rightCol.addStack();
    const days = daysBox.addText(\`Together for \${data.space?.days_together || 0} days ♡\`);
    days.font = Font.systemFont(10);
    days.textColor = THEME.textMuted;
  }

  return widget;
}

async function createLargeWidget(data, photoImg) {
  const widget = new ListWidget();
  widget.backgroundColor = THEME.bgCream;
  widget.setPadding(14, 16, 14, 16);
  widget.url = \`\${CONFIG.appBaseUrl}/\`;

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
    topPhotoStack.centerAlignContent();
    topPhotoStack.setPadding(12, 12, 12, 12);

    topPhotoStack.addSpacer();
    const heartText = topPhotoStack.addText("♡");
    heartText.font = Font.systemFont(32);
    heartText.textColor = THEME.blush;
    heartText.centerAlignText();

    topPhotoStack.addSpacer(4);
    const monogram = topPhotoStack.addText(\`\${data.space?.days_together || 0} Days of Love\`);
    monogram.font = Font.boldSystemFont(15);
    monogram.textColor = THEME.textDark;
    monogram.centerAlignText();
    topPhotoStack.addSpacer();
  }

  widget.addSpacer(10);

  const midRow = widget.addStack();
  midRow.layoutHorizontally();
  midRow.centerAlignContent();

  const distTitle = midRow.addText(
    data.distance && data.distance.is_available && data.distance.km !== null
      ? \`\${data.distance.km} km apart\`
      : "Connected in Heart ♡"
  );
  distTitle.font = Font.boldSystemFont(14);
  distTitle.textColor = THEME.textDark;

  if (data.distance?.trend === "getting_closer") {
    midRow.addSpacer(6);
    const trendPill = midRow.addText("● Closer");
    trendPill.font = Font.boldSystemFont(10);
    trendPill.textColor = THEME.emerald;
  }

  midRow.addSpacer();

  const daysTogether = midRow.addText(\`\${data.space?.days_together || 0} days ♡\`);
  daysTogether.font = Font.systemFont(11);
  daysTogether.textColor = THEME.blushDeep;

  widget.addSpacer(8);

  const moodCard = widget.addStack();
  moodCard.layoutHorizontally();
  moodCard.centerAlignContent();
  moodCard.backgroundColor = THEME.cardBg;
  moodCard.cornerRadius = 14;
  moodCard.setPadding(8, 10, 8, 10);

  const u1Emoji = data.members?.user1?.mood?.emoji || "🥰";
  const u1Note = data.members?.user1?.mood?.note || "Excited";
  const u2Emoji = data.members?.user2?.mood?.emoji || "🤍";
  const u2Note = data.members?.user2?.mood?.note || "Together";

  const m1Text = moodCard.addText(\`\${u1Emoji} \${u1Note}\`);
  m1Text.font = Font.systemFont(11);
  m1Text.textColor = THEME.textDark;
  m1Text.lineLimit = 1;

  moodCard.addSpacer();

  const heartSep = moodCard.addText("♡");
  heartSep.font = Font.systemFont(11);
  heartSep.textColor = THEME.blush;

  moodCard.addSpacer();

  const m2Text = moodCard.addText(\`\${u2Emoji} \${u2Note}\`);
  m2Text.font = Font.systemFont(11);
  m2Text.textColor = THEME.textDark;
  m2Text.lineLimit = 1;

  widget.addSpacer(8);

  const bottomCard = widget.addStack();
  bottomCard.layoutVertically();
  bottomCard.backgroundColor = THEME.blushSoft;
  bottomCard.cornerRadius = 14;
  bottomCard.setPadding(8, 10, 8, 10);

  if (data.latest_message && data.latest_message.content) {
    const msgSender = bottomCard.addText(\`From \${data.latest_message.sender || "Love"}:\`);
    msgSender.font = Font.boldSystemFont(10);
    msgSender.textColor = THEME.blushDeep;

    bottomCard.addSpacer(2);

    const msgBody = bottomCard.addText(\`"\${data.latest_message.content}"\`);
    msgBody.font = Font.italicSystemFont(11);
    msgBody.textColor = THEME.textDark;
    msgBody.lineLimit = 2;
  } else if (data.daily_question) {
    const qLabel = bottomCard.addText("Question of the day:");
    qLabel.font = Font.boldSystemFont(10);
    qLabel.textColor = THEME.blushDeep;

    bottomCard.addSpacer(2);

    const qBody = bottomCard.addText(\`"\${data.daily_question.text}"\`);
    qBody.font = Font.systemFont(11);
    qBody.textColor = THEME.textDark;
    qBody.lineLimit = 2;
  }

  return widget;
}

async function run() {
  try {
    const data = await fetchWidgetSnapshot();
    let photoUrl = data.photo?.signed_url || data.photo?.public_url;
    if (!photoUrl && data.photo?.storage_path) {
      photoUrl = \`\${CONFIG.supabaseUrl}/storage/v1/object/authenticated/photos/\${data.photo.storage_path}\`;
    }
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

    // 5-Minute Background Timeline Reload (Aggressive iOS WidgetKit budget)
    widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 5);

    Script.setWidget(widget);

    if (!config.runsInWidget) {
      if (family === "small") await widget.presentSmall();
      else if (family === "large") await widget.presentLarge();
      else await widget.presentMedium();
    }
  } catch (err) {
    console.error("Widget render error: " + err);
    try {
      const fallbackData = getOfflineFallback();
      const fallbackWidget = await createMediumWidget(fallbackData, null);
      fallbackWidget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 5);
      Script.setWidget(fallbackWidget);
    } catch (fallbackErr) {
      console.error("Critical fallback error: " + fallbackErr);
    }
  } finally {
    // Guarantees iOS receives completion signal so WidgetKit never freezes or disables reloads
    Script.complete();
  }
}

await run();
`
}
