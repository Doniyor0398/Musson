import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyC-VhTbZoWvey7Va5DsHri_G8T0YgQNNcc',
  authDomain: 'musson-restaurant.firebaseapp.com',
  projectId: 'musson-restaurant',
  storageBucket: 'musson-restaurant.firebasestorage.app',
  messagingSenderId: '383325178602',
  appId: '1:383325178602:web:0406d8186f2857904d2593',
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
  experimentalAutoDetectLongPolling: true,
});
