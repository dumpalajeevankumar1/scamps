const admin = require("firebase-admin");
const fs = require("fs");

if (!admin.apps.length) {
  if (fs.existsSync("./serviceAccountKey.json")) {
    const serviceAccount = require("./serviceAccountKey.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Initialized Firebase Admin with serviceAccountKey.json (local)");
  } else {
    admin.initializeApp(); // Use default credentials (in Cloud Functions)
    console.log("✅ Initialized Firebase Admin with default credentials (Cloud Functions)");
  }
}

const db = admin.firestore();
module.exports = db;