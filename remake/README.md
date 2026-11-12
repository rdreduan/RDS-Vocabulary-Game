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
1. In Firebase Console, enable **Authentication → Sign-in method → Anonymous** and **Email/Password**. Guest sessions can be upgraded to an email/password account from My Profile; sign in with that account on another device to load the same cloud progress.
2. Create a Cloud Firestore database.
3. Review and test `firestore.rules` before publishing. User profile documents are owner-only, match records are participant-only, and active battle rooms are readable only by participants. A waiting-room code acts as its access code: anyone who knows it and is signed in can read that waiting-room document.
4. Keep service-account credentials out of the Android/client app. The Firebase web config is public client configuration, not a server secret.

## Firestore rules tests
The rules test suite uses the local Firestore Emulator and does not connect to or modify production Firebase data:
```bash
npm install
npx firebase-tools@14.22.0 emulators:exec --only firestore --project demo-rds-vocabulary-game "npm run test:rules"
```
The GitHub Actions workflow `.github/workflows/firestore-rules.yml` runs these tests for relevant pull-request changes.

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
Room membership is limited to two authenticated participants. Learning XP and profile fields are client-written in this starter build and are not cheat-proof. Battle score and winner calculations are also client-trusted. Firestore Rules can restrict access and validate data shape, but cannot prove that a user genuinely earned a score. Strong anti-cheat validation requires a trusted backend. Random matchmaking and bracket tournaments require a trusted matchmaking backend; they are not represented as production-ready in this client-only build. IELTS speaking feedback is a browser speech-to-text word-match estimate, not an official IELTS band score.
