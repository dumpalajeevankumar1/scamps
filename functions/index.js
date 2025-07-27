// ✅ Use v2 Functions SDK for Gen 2 deployment
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const functions = require("firebase-functions/v1"); // <-- FIXED: use /v1
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const dotenv = require("dotenv");
dotenv.config();

const serviceAccount = require("./serviceAccountKey.json");
const fetchYouTubeFeedsHandler = require("./fetchYouTubeFeeds");
const analyzeTrafficData = require("./analyzeTrafficFeeds");

// ✅ Define secret
const YOUTUBE_API_KEY = defineSecret("YOUTUBE_API_KEY");

// ✅ Initialize Firebase Admin with service account (once only)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// ✅ Gen 1: Firestore test function
exports.testFirestore = functions.https.onRequest(async (req, res) => {
  try {
    const result = await db.collection("testConnection").add({
      status: "success",
      time: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Test document written with ID:", result.id);
    res.status(200).send("✅ Firestore write successful!");
  } catch (err) {
    console.error("❌ Firestore write failed:", err);
    res.status(500).send("❌ Firestore write failed");
  }
});

// Gen 2 function (can use cpu, memory, etc.)
exports.fetchYouTubeFeeds = onRequest(
  {
    region: "asia-south2",
    cpu: 1,
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: [YOUTUBE_API_KEY],
  },
  fetchYouTubeFeedsHandler
);

// Gen 2 function (DO NOT use cpu, memory, etc.)
exports.getYouTubeFeeds = onRequest(
  {
    region: "asia-south2",
    cpu: 1,
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  async (req, res) => {
    cors(req, res, async () => {
      try {
        const snapshot = await db
          .collection("youtubeFeeds")
          .orderBy("timestamp", "asc")
          .limit(20)
          .get();

        const feed = snapshot.docs.map((doc) => doc.data());
        res.status(200).json(feed);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        res.status(500).json({ error: "Failed to fetch feed" });
      }
    });
  }
);

// New Gen 2 function to analyze last 5 days of data
exports.analyzeLast5DaysTraffic = onRequest(
  {
    region: "asia-south2", // Specify your region
    // Configure CPU, memory, and timeout based on your needs
    // cpu: 1,
    // memory: "256MiB",
    // timeoutSeconds: 60,
  },
  async (req, res) => {
    cors(req, res, async () => {
      try {
        await analyzeTrafficData(5); // Analyze data for the last 5 days
        res.status(200).send("✅ Successfully analyzed traffic data for the last 5 days!");
      } catch (error) {
        console.error("❌ Error analyzing traffic data:", error);
        res.status(500).send("❌ Failed to analyze traffic data");
      }
    });
  }
);