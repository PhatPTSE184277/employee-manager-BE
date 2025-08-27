import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

const serviceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';

if (!admin.apps.length) {
    try {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase admin initialized');
    } catch (err) {
        console.error(
            'Failed to initialize firebase-admin. Put serviceAccountKey.json in project root or set FIREBASE_SERVICE_ACCOUNT_PATH.',
            err
        );
        process.exit(1);
    }
}

const db = admin.firestore();

export { admin, db };
