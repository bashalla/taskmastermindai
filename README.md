# Instructions

### In order to get the procject running locally you would need to do the following preparations.

#### Setting up Firebase Backend System

##### Set up a firebase account and add a firebase.js file on the root folder of the project and fill out the XXX Placeholders with the information from firebase

import { initializeApp } from "firebase/app";
import {
getAuth,
initializeAuth,
getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
apiKey: "XXX",
authDomain: "XXX",
projectId: "XXX",
storageBucket: "XXX",
messagingSenderId: "XXX",
appId: "XXX",
measurementId: "XXX",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
persistence: getReactNativePersistence(AsyncStorage),
});
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };

#### Setting up API Keys in .env File

##### Additionally you will need to create a .env file also on the root folder of the project with the following API information. In order to to do so you would also need to set up a

Google Cloud Account (GOOGLE_API_KEY and GOOGLE_CLOUD_API_KEY can be the same)
Open AI Developer Account
Open Weather Account

The .evn file need to look like (Fill out the XXX with your API Keys):

GOOGLE_API_KEY=XXX
OPEN_WEATHER=XXXX
GOOGLE_CLOUD_API_KEY=XXX
OPENAI_API_KEY=XXX

#### Starting the project locally

##### After setting up firebasee and .env file, in the root folder of the project run:

npm install
npx expo start

In order to run unit test you can also run

npm test

#### Deploying it on Expo Dev

##### In case you want to deploy it directly on expo dev you will need to do the following:

##### Create Expo Account and adjust app.json file with your information in the XXX Placeholders and afterwards run run eas update

{
"expo": {
"name": "CCC",
"slug": "XXX",
"description": "XXX",
"version": "1.0.0",
"orientation": "portrait",
"icon": "./assets/logo.png",
"userInterfaceStyle": "light",
"splash": {
"image": "./assets/logo.png",
"resizeMode": "contain",
"backgroundColor": "#ffffff"
},
"assetBundlePatterns": ["**/*"],
"ios": {
"supportsTablet": true,
"infoPlist": {
"NSCalendarsFullAccessUsageDescription": "This app requires access to your calendar to manage tasks.",
"NSRemindersFullAccessUsageDescription": "This app requires access to your reminders to manage task reminders."
},
"bundleIdentifier": "com.bashalla.unifinaltaskmanager"
},
"android": {
"permissions": ["READ_CALENDAR", "WRITE_CALENDAR"],
"adaptiveIcon": {
"foregroundImage": "./assets/adaptive-icon.png",
"backgroundColor": "#ffffff"
},
"package": "XXX"
},
"web": {
"favicon": "./assets/favicon.png"
},
"extra": {
"eas": {
"projectId": "XXX
}
},
"owner": "XXX",
"runtimeVersion": {
"policy": "appVersion"
},
"updates": {
"url": "XXX"
},
"scheme": "XXX"
}
}
