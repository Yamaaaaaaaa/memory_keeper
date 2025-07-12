import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";

import AsyncStorage from '@react-native-async-storage/async-storage';

// Optionally import the services that you want to use
// import {...} from 'firebase/auth';
// import {...} from 'firebase/database';
// import {...} from 'firebase/firestore';
// import {...} from 'firebase/functions';
// import {...} from 'firebase/storage';

// Initialize Firebase
const firebaseConfig = {
    // databaseURL: 'https://project-id.firebaseio.com',
    apiKey: "AIzaSyCc3kdzQq8dOEC6yuulzC5ix46q13K_1rI",
    authDomain: "black-function-454609-h3.firebaseapp.com",
    projectId: "black-function-454609-h3",
    storageBucket: "black-function-454609-h3.appspot.com", // ✅ Sửa lỗi domain
    messagingSenderId: "446696233819",
    appId: "1:446696233819:web:2c0b64eb701c207c49187e",
    measurementId: "G-6VG89EERMH",
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // 👈 Thêm dòng này
export const storage = getStorage(app);

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});
