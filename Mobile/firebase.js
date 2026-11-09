// firebase.js — Conexión de PostresYa Móvil con Firebase (Etapa 3, Foro 2)
// Las llaves NO van escritas aquí: se leen del archivo .env (que no se sube a GitHub).
import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FB_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FB_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FB_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FB_APP_ID,
};

// Evita inicializar Firebase dos veces cuando Expo recarga la app.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// En el celular la sesión se guarda con AsyncStorage (no se cierra al reabrir la app).
// En la versión web, Firebase guarda la sesión en el navegador automáticamente.
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  const { getReactNativePersistence } = require('firebase/auth');
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  try {
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch (e) {
    auth = getAuth(app); // ya estaba inicializado (recarga rápida)
  }
}

export { auth };
export const db = getFirestore(app);
