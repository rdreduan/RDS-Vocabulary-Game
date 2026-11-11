# RDS Vocabulary Game — Full Remake

React + Vite learning app packaged for Android with Capacitor.

## Included
- Solo English-to-Bangla multiple-choice quiz
- Points, streak, accuracy and recent practice
- Saved words and searchable vocabulary library
- Anonymous Firebase sign-in
- Two-player private rooms with shared rounds and live score updates
- Responsive dashboard, profile and mobile navigation
- Original vocabulary and Firebase web configuration extracted from the original project source ZIP during CI

## Firebase setup
1. In Firebase Console, enable **Authentication → Sign-in method → Anonymous**.
2. Create a Cloud Firestore database.
3. Publish the rules in `firestore.rules`.
4. Keep service-account credentials out of the Android/client app. The Firebase web config is public client configuration, not a server secret.

## Local build
Extract the original project ZIP, copy this remake folder's contents over the project root, then run:
```bash
npm install
node scripts/prepare-project.mjs
npm run build
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
```

## Security note
Room membership is limited to two authenticated participants. Client-side score submissions are still not cheat-proof: for a public competitive release, move answer validation and score updates into trusted Cloud Functions.