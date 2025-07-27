const axios = require('axios');
const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

const Keywords = ["traffic"];
const apiKey = process.env.YOUTUBE_API_KEY;

(async () => {
  try {
    if (!apiKey) throw new Error("Missing YOUTUBE_API_KEY");

    for (const keyword of Keywords) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(keyword)}&key=${apiKey}`;
      const response = await axios.get(url);
      const items = response.data.items;

      console.log("✅ Total videos:", items.length);

      for (const item of items) {
        const video = item.snippet;
        const payload = {
          summary: `${video.title} - ${video.description}`,
          lat: 12.9716,
          lng: 77.5946,
          location: 'Bengaluru',
          severity: 'high',
          source: 'youtube',
          timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          type: 'traffic',
        };

        const ref = await db.collection("youtubeLogs").add(payload);
        console.log("✅ Saved:", ref.id);
      }
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();