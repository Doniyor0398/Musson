import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

//конфиг из Firebase Console
const firebaseConfig = {
  apiKey: 'AIzaSyC-VhTbZoWvey7Va5DsHri_G8T0YgQNNcc',
  authDomain: 'musson-restaurant.firebaseapp.com',
  projectId: 'musson-restaurant',
  storageBucket: 'musson-restaurant.firebasestorage.app',
  messagingSenderId: '383325178602',
  appId: '1:383325178602:web:0406d8186f2857904d2593',
  measurementId: 'G-W7SF0Q6M09',
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Экспортируем базу данных Firestore
export const db = getFirestore(app);
