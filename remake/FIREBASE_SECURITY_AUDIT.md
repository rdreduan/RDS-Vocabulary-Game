# Firebase Security Audit — Spark Plan

## Scope
Reviewed the Firestore rules and client writes in `remake/src/main.jsx` and `remake/src/academy.jsx`. This change is Spark-compatible and does not introduce Cloud Functions or paid services.

## Changes in this PR
- Validate room creation shape, room code/document ID consistency, host identity, and the first player record.
- Make room membership checks safe for missing or malformed player arrays.
- Limit joining a waiting room to a single second-player append; unrelated room fields cannot be changed during the join operation.
- Validate completed match document shape and require exactly two player IDs, including the creating user.
- Restrict leaderboard profile and per-match marker fields to the fields currently written by the app.
- Restrict user profile document keys to the profile, saved vocabulary, progress, and IELTS draft fields currently used by the app, while preserving owner-only reads and writes.
- Validate learning-event fields and keep events immutable after creation.
- Preserve participant-only access to match history.

## Important limitations (not solved by Firestore Rules alone)
- Authenticated users can still write their own XP, streak, achievements, and solo progress fields. Rules can validate shape and ownership, but cannot prove that a quiz answer was genuinely earned by the user.
- Existing battle participants still use client-side transactions to update the shared room's answers, player scores, and status. A participant may be able to forge those values. Strong anti-cheat scoring requires a trusted server (for example, Cloud Functions / another backend), which is outside the Spark-only implementation requested here.
- A six-character room code is effectively a bearer access code for a waiting room. Firestore Rules cannot conceal selected fields within a document; anyone who knows the code can read that waiting-room document. Do not store secrets in room documents.
- Match history and leaderboard writes remain client-originated. Their shape and ownership are restricted, but the result itself is not independently verified.

## Required validation before merge
1. Run the Android build workflow.
2. Test the rules in the Firebase Rules Playground or Emulator before publishing.
3. Test account creation/login, saved vocabulary add/delete and second-device sync, Academy progress, IELTS draft sync, leaderboard load, match history, and two-device room create/join/start/answer/next-round/finish.
4. Only publish these rules after the app regression tests pass.

## No production rules were published
This PR only changes the repository rules file. It does not modify the Firebase Console.
