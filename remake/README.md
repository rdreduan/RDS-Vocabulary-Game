# RDS Vocabulary Game — Full Remake

React + Vite learning app packaged for Android with Capacitor.

## Included
- Solo English-to-Bangla multiple-choice quiz
- Points, streak, accuracy and recent practice
- Saved words and searchable vocabulary library
- Anonymous Firebase sign-in
- Two-player private rooms with shared rounds and live score updates
- Responsive dashboard, profile and mobile navigation
- Learning Academy: XP, levels, Dhaka-time daily goals and streaks, achievements, synonym/antonym practice and revision notebook
- Browser speech playback and optional speech recognition for pronunciation practice
- IELTS starter practice: academic vocabulary, Reading True/False/Not Given, Writing drafts and Speaking prompts
- Original vocabulary and Firebase web configuration extracted from the original project source ZIP during CI

## Firebase setup
1. In Firebase Console, enable **Authentication → Sign-in method → Anonymous**.
2. Create a Cloud Firestore database.
3. Publish the rules in `firestore.rules` after each rules update. The Learning Academy uses owner-only `users/{uid}` documents and `learningEvents` subcollection records.
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
Room membership is limited to two authenticated participants. Learning XP and profile fields are client-written in this starter build and are not cheat-proof. Random matchmaking and bracket tournaments require a trusted matchmaking backend; they are not represented as production-ready in this client-only build. IELTS speaking feedback is a browser speech-to-text word-match estimate, not an official IELTS band score.