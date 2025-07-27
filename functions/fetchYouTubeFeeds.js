const axios = require("axios");
const admin = require("firebase-admin");
const keywords = require("./Keywords");

module.exports = async (req, res) => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("❌ Missing YOUTUBE_API_KEY.");
    }

    const db = admin.firestore();
    let totalVideos = 0;

    const BENGALURU_LAT = 12.9716;
    const BENGALURU_LON = 77.5946;
    const SEARCH_RADIUS_KM = 100;

    for (const keyword of keywords) {
      const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
        params: {
          part: "snippet",
          type: "video",
          maxResults: 5,
          q: keyword,
          key: apiKey,
          location: `${BENGALURU_LAT},${BENGALURU_LON}`,
          locationRadius: `${SEARCH_RADIUS_KM}km`,
          regionCode: "IN",
        },
      });

      const videos = response.data.items || [];

      for (const video of videos) {
        const videoId = video.id.videoId;
        let location = null;
        let area = null;

        try {
          const videoDetailsRes = await axios.get(
            "https://www.googleapis.com/youtube/v3/videos",
            {
              params: {
                part: "recordingDetails",
                id: videoId,
                key: apiKey,
              },
            }
          );

          const recordingDetails = videoDetailsRes.data.items?.[0]?.recordingDetails;

          if (recordingDetails?.location) {
            location = {
              latitude: recordingDetails.location.latitude,
              longitude: recordingDetails.location.longitude,
            };
          }

          if (recordingDetails?.locationDescription) {
            area = recordingDetails.locationDescription;
          }
        } catch (err) {
          console.warn(`⚠️ No recordingDetails for video ID ${videoId}.`);
        }

        // Fallback
        if (!location) {
          location = { latitude: BENGALURU_LAT, longitude: BENGALURU_LON };
        }
        if (!area) {
          area = "Bengaluru";
        }

        await db.collection("youtubeFeeds").add({
          keyword,
          title: video.snippet.title,
          description: video.snippet.description,
          publishedAt: video.snippet.publishedAt,
          videoId,
          location,
          area,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      totalVideos += videos.length;
    }

    res
      .status(200)
      .send(`✅ Fetched and stored ${totalVideos} Bengaluru-local videos from ${keywords.length} keywords.`);
  } catch (err) {
    console.error("❌ Main handler error:", err);
    res.status(500).send("❌ Something went wrong: " + err.message);
  }
};