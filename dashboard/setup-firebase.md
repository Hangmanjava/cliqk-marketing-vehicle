# Firebase Dashboard Setup

## Step 1: Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select **cliqk-social-vehicle** project
3. Click **Build** > **Firestore Database** in the sidebar
4. Click **Create database**
5. Select **Start in production mode**
6. Choose a location (e.g., `us-central1`)
7. Click **Enable**

## Step 2: Get Web App Config

1. In Firebase Console, click the gear icon > **Project Settings**
2. Scroll down to **Your apps**
3. Click **Add app** > Web icon (</>)
4. Register app name: `cliqk-dashboard`
5. Copy the `firebaseConfig` object
6. Update `public/app.js` with your config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "cliqk-social-vehicle.firebaseapp.com",
  projectId: "cliqk-social-vehicle",
  storageBucket: "cliqk-social-vehicle.appspot.com",
  messagingSenderId: "424036189290",
  appId: "YOUR_APP_ID"
};
```

## Step 3: Download Service Account Key (for backend)

1. In Project Settings > **Service Accounts** tab
2. Click **Generate new private key**
3. Save to `social-media-tracker/firebase-service-account.json`

## Step 4: Deploy Firestore Rules

```bash
cd dashboard
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

## Step 5: Deploy Dashboard

```bash
firebase deploy --only hosting
```

Your dashboard will be live at: `https://cliqk-social-vehicle.web.app`

## Step 6: Run the Scraper

Go back to the main project and run:

```bash
cd ..
npm start
```

This will:
1. Scrape all social media accounts
2. Analyze sentiment
3. Push data to Firestore
4. The dashboard will update automatically!
