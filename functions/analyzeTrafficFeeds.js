// --- Civic Incident Analyzer with Frontend-Ready Enhancements ---

/**
 * 🧠 PURPOSE:
 * Analyze real-time YouTube feeds of civic issues using Gemini AI.
 * For each category (Traffic, Floods, etc), generate grouped incidents with rich UI metadata
 * and store them in Firestore (`Final_Agent/<category>/items`).
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

// --- Firebase Initialization ---
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// --- Gemini API Setup ---
const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAv8YwI1N1DoQy0qtZIrsDGDNzUB228IPo";
if (!apiKey || apiKey.includes("PASTE_YOUR")) {
  console.error("❌ Please provide a valid Gemini API key.");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

// --- Helper Enrichers for Frontend Metadata ---
function getCategoryIcon(category) {
  const icons = {
    "Traffic": "🚦",
    "Floods": "🌧️",
    "Power Outages": "💡",
    "Tree Incidents": "🌳",
    "Events": "🎉",
    "Civic Issues": "⚠️"
  };
  return icons[category] || "❓";
}

function getUrgencyScore(severity) {
  return { low: 1, medium: 3, high: 5 }[severity] || 2;
}

function getDistrictZone(location) {
  if (!location) return "Unknown";
  const l = location.toLowerCase();
  if (l.includes("koramangala") || l.includes("btm") || l.includes("jayanagar")) return "South-East Bengaluru";
  if (l.includes("whitefield") || l.includes("marathahalli")) return "East Bengaluru";
  if (l.includes("hebbal") || l.includes("yelahanka")) return "North Bengaluru";
  return "Central Bengaluru";
}

function generateIncidentId(category) {
  const short = category.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${short}-${date}-${rand}`;
}

function generateFeedSummary(incident) {
  return `${incident.issue_type || "Issue"} at ${incident.location || "unknown"} due to ${incident.cause || "unknown cause"}.`;
}

// --- JSON Cleanup ---
function fixCommonJsonIssues(jsonString) {
  return jsonString
    .replace(/,\s*([\]}])/g, '$1')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');
}

// --- Prompt Base ---
const baseInstructions = `
You are part of a team of expert agents analyzing real-time feeds about civic issues in Bengaluru.
Your specific role is to specialize in ONE category only (e.g., Traffic, Floods, Power Outage, etc).

Translate, clean (remove emojis, special characters like ,./$#@), and analyze based on your category.
Group similar feeds (same issue, different wording). For each grouped incident, generate:
{
  "category": "...",
  "location": "...",
  "nearby_hotspots": ["..."],
  "issue_type": "...",
  "cause": "...",
  "time": "...",
  "severity": "low|medium|high",
  "note": "...",
  "alternative_solutions": ["..."],
  "source_count": 0,
  "geolocation": {"lat": ..., "lon": ...} | null
}
Return final result as:
{ "analyzed_incidents": [ ... ] }
`;

// --- Main Execution Logic ---
async function processLiveDataFromFirestore() {
  console.log("🔄 Fetching live data from Firestore (last 30 days)...");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const feedsSnapshot = await db.collection("youtubeFeeds")
    .where("timestamp", ">=", thirtyDaysAgo)
    .get();

  if (feedsSnapshot.empty) {
    console.log("⚠️ No recent feeds found.");
    return;
  }

  const feeds = feedsSnapshot.docs.map(doc => doc.data());
  console.log(`📥 Fetched ${feeds.length} feeds.`);

  const categories = [
    "Traffic",
    "Floods",
    "Power Outages",
    "Tree Incidents",
    "Events",
    "Civic Issues"
  ];

  for (const category of categories) {
    console.log(`\n🔍 Analyzing category: ${category}`);

    const prompt = `
${baseInstructions}
Your assigned category: ${category}.
Raw feeds (array of reports):
${JSON.stringify(feeds)}
`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No valid JSON block found in response.");

      const parsed = JSON.parse(fixCommonJsonIssues(jsonMatch[0]));
      const incidents = parsed.analyzed_incidents || [];
      if (!Array.isArray(incidents)) throw new Error("'analyzed_incidents' is not an array.");

      const batch = db.batch();
      const categoryDocRef = db.collection("Final_Agent").doc(category);

      incidents.forEach((incident) => {
        const docRef = categoryDocRef.collection("items").doc();
        batch.set(docRef, {
          ...incident,
          analysisTimestamp: new Date(),
          reported_by: "YouTube",
          confidence_score: Math.random().toFixed(2),
          trend_label: "rising",
          visual_icon: getCategoryIcon(category),
          urgency_index: getUrgencyScore(incident.severity),
          district_zone: getDistrictZone(incident.location),
          incident_id: generateIncidentId(category),
          duration_estimate: "30–45 mins",
          feed_summary: generateFeedSummary(incident)
        });
      });

      batch.set(categoryDocRef, {
        category_name: category,
        total_incidents: FieldValue.increment(incidents.length),
        last_updated: new Date()
      }, { merge: true });

      await batch.commit();
      console.log(`✅ Saved ${incidents.length} incidents for ${category}.`);

    } catch (error) {
      console.error(`❌ Error analyzing category '${category}': ${error.message}`);
    }
  }

  console.log("\n✅ Multi-agent Gemini analysis completed.");
}

// --- Run It ---
processLiveDataFromFirestore();