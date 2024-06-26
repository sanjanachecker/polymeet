import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const ENV = {
    FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
};

const firebaseConfig = {
    apiKey: ENV.FIREBASE_API_KEY,
    authDomain: ENV.FIREBASE_AUTH_DOMAIN,
    databaseURL: ENV.FIREBASE_DATABASE_URL,
    projectId: ENV.FIREBASE_PROJECT_ID,
    storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
    appId: ENV.FIREBASE_APP_ID,
    measurementId: ENV.FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
};
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;

export async function getLocalStream(video: boolean, audio: boolean): Promise<MediaStream> {
    localStream = await navigator.mediaDevices.getUserMedia({
        video: video,
        audio: audio,
    });
    return localStream;
}

export async function getRemoteStream(): Promise<MediaStream> {
    remoteStream = new MediaStream();
    return remoteStream; // Add this line to fix the error
}

export interface VideoConfig {
    video: boolean;
    audio: boolean;
}

export const fetchUserData = async (email: string) => {
    console.log('Fetching user data:', email);
    console.log(`"/api/users/${email}"`);
    try {
        const response = await fetch(`/api/users/${email}`);
        const data = await response.json();
        if (data.success) {
            const user = data.data;
            console.log('User data:', user);
            return user;
        } else {
            console.error('User not found:', data.error);
        }
    } catch (error) {
        console.error('Failed to fetch user data:', error);
    }
};
