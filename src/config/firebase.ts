import admin from 'firebase-admin';
import path from 'path';

const serviceAccount = require(path.resolve(__dirname, '../../serviceAccountKey.json'));

// Usa la variable de entorno para apuntar al bucket correcto (debe existir en Firebase).
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
if (!storageBucket) {
  throw new Error('FIREBASE_STORAGE_BUCKET env var is required and must point to an existing bucket');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket,
});

export const bucket = admin.storage().bucket(storageBucket);
export default admin;