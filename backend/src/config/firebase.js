import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let app;

if (admin.apps.length === 0) {
  // Check for local serviceAccountKey.json file first (most user-friendly local setup)
  const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    console.log('🔥 Initializing Firebase Admin SDK via local serviceAccountKey.json...');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      console.log('🔥 Initializing Firebase Admin SDK via Environment Variables...');
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        })
      });
    } else {
      console.log('🔥 Initializing Firebase Admin SDK with default application credentials...');
      app = admin.initializeApp();
    }
  }
} else {
  app = admin.app();
}

const db = admin.firestore();

db.settings({
  ignoreUndefinedProperties: true
});

export { admin, db };
export default db;
