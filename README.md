# RDS Vocabulary Game — Development project

## Included
- React + Vite mobile-first UI
- Solo four-choice English → Bangla quiz
- Correct-answer highlight, score/streak, saved words
- Firebase room creation/join and room-player listener **when Firebase is configured**
- Capacitor config for Android packaging

## Important status
This is a development starter, not a deployed production service. The bundled vocabulary is a starter set (not 5,000 verified entries). Multiplayer needs your own Firebase project config, Authentication (Anonymous), Firestore, and deployed security rules. Current example Firestore rules are permissive and must be hardened before public launch.

## Run locally
1. Install Node.js 20+.
2. In this folder run `npm install`
3. Run `npm run dev`

## Configure Firebase
- Create a Firebase project and add a Web app.
- Enable Authentication → Anonymous.
- Create Firestore database.
- Replace `firebaseConfig` in `src/main.jsx` (currently blank).
- Deploy rules after tightening room membership, host and score validation.

## Build website
`npm run build` produces `dist/`. Deploy `dist/` to Firebase Hosting or another static host.

## Android APK
Install Android Studio + Android SDK, then:
`npm install @capacitor/core @capacitor/cli @capacitor/android`
`npx cap add android`
`npm run build`
`npx cap sync android`
`npx cap open android`
Build a signed APK from Android Studio (Build > Generate Signed Bundle/APK).

## Production milestones
1. Expand and review vocabulary to 5,000 unique, level-tagged entries with definitions, parts of speech, examples, audio and reliable Bangla meanings.
2. Implement real multiplayer match lifecycle: ready state, synchronized question IDs/timers, server-authoritative scoring, reconnect, tie-breaks and anti-cheat.
3. Harden Firestore rules / use trusted server functions for scores.
4. Test on Android devices and publish hosting + APK.
