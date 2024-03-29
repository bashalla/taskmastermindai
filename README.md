# Instructions

### In order to get the project running locally, you need to follow these preparations:

#### On the first page of the university report, you will also find QR Codes to start the project directly in Expo Go on your smartphone. No local setup is needed in this case.

#### Setting up Firebase Backend System

1. **Set up a Firebase account** and add a `firebase.js` file in the root folder of the project. Fill out the "XXX" placeholders with information from Firebase.

   ```javascript
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

   const app = initializeApp(firebaseConfig);
   const auth = initializeAuth(app, {
     persistence: getReactNativePersistence(AsyncStorage),
   });
   const db = getFirestore(app);
   const storage = getStorage(app);

   export { auth, db, storage };
   ```

#### Setting up API Keys in .env File

2. **Create a `.env` file** in the root folder with API information for a Google Cloud Account, Open AI Developer Account, and Open Weather Account. The `.env` file should look like this (fill out the "XXX" with your API Keys) :

   ```
   GOOGLE_API_KEY=XXX
   OPEN_WEATHER=XXX
   GOOGLE_CLOUD_API_KEY=XXX
   OPENAI_API_KEY=XXX   -> can be the same as GOOGLE_API_KEY
   ```

#### Starting the project locally

- After setting up Firebase and the `.env` file, in the root folder of the project run:

  ```bash
  npm install
  npx expo start
  ```

- To run unit tests:

  ```bash
  npm test
  ```

#### Deploying it on Expo Dev

- To deploy directly on Expo Dev, create an Expo Account and adjust the `app.json` file and `notofications.js` with your information in the "XXX" placeholders and afterward run `eas update`.

  ```javascript

  {
  "expo": {
    "name": "XXX",
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
      "bundleIdentifier": "XXX"
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
        "projectId": "XXXX" //same as in updated URL only the ID
      }
    },
    "owner": "XXX",
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/XXXX"
    },
    "scheme": "XXX"
  }
  }

  ```

  ```javascript
  // Function to request permission for push notifications
  export const registerForPushNotificationsAsync = async () => {
    let token;
    if (Constants.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return;
      }

      // Add here your expo id
      token = (
        await Notifications.getExpoPushTokenAsync({
          experienceId: "XXX",
          projectId: "XXX",
        })
      ).data;
    } else {
      alert("Must use physical device for Push Notifications");
    }

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  };
  ```
