// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate that all required environment variables are present
if (!firebaseConfig.apiKey) {
  throw new Error('VITE_FIREBASE_API_KEY environment variable is not set');
}
if (!firebaseConfig.authDomain) {
  throw new Error('VITE_FIREBASE_AUTH_DOMAIN environment variable is not set');
}
if (!firebaseConfig.projectId) {
  throw new Error('VITE_FIREBASE_PROJECT_ID environment variable is not set');
}
if (!firebaseConfig.storageBucket) {
  throw new Error('VITE_FIREBASE_STORAGE_BUCKET environment variable is not set');
}
if (!firebaseConfig.messagingSenderId) {
  throw new Error('VITE_FIREBASE_MESSAGING_SENDER_ID environment variable is not set');
}
if (!firebaseConfig.appId) {
  throw new Error('VITE_FIREBASE_APP_ID environment variable is not set');
}

export default firebaseConfig;
