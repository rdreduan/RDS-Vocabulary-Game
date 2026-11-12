import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';

const projectId = 'demo-rds-vocabulary-game';
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8')
    }
  });
});

after(async () => {
  await env?.cleanup();
});

const player = (uid, name = 'Player') => ({
  uid, name, score: 0, correct: 0, wrong: 0
});

test('users can read and write only their own profile', async () => {
  const alice = env.authenticatedContext('alice').firestore();
  const bob = env.authenticatedContext('bob').firestore();
  const profile = doc(alice, 'users/alice');
  await assertSucceeds(setDoc(profile, {
    displayName: 'Alice',
    savedWords: [{ word: 'abandon', meaning: 'ত্যাগ করা' }],
    xp: 10,
    totalCorrect: 1,
    totalAnswered: 1,
    currentStreak: 1,
    bestStreak: 1,
    lastActiveDay: '2026-11-13',
    dailyKey: '2026-11-13',
    dailyDone: 1,
    dailyGoal: 10,
    achievements: ['first'],
    soloScore: 10,
    soloTotal: 1,
    soloCorrect: 1,
    updatedAt: Date.now()
  }));
  await assertSucceeds(getDoc(profile));
  await assertFails(getDoc(doc(bob, 'users/alice')));
  await assertFails(setDoc(doc(bob, 'users/alice'), { xp: 999999 }));
});

test('learning events are owner-readable, create-only, and schema checked', async () => {
  const alice = env.authenticatedContext('alice').firestore();
  const bob = env.authenticatedContext('bob').firestore();
  const event = doc(alice, 'users/alice/learningEvents/event-1');
  await assertSucceeds(setDoc(event, {
    kind: 'solo-quiz', word: 'abandon', correct: true, createdAt: serverTimestamp()
  }));
  await assertSucceeds(getDoc(event));
  await assertFails(getDoc(doc(bob, 'users/alice/learningEvents/event-1')));
  await assertFails(updateDoc(event, { correct: false }));
  await assertFails(deleteDoc(event));
  await assertFails(setDoc(doc(alice, 'users/alice/learningEvents/bad'), {
    kind: 'solo-quiz', word: 'abandon', correct: 'yes'
  }));
});

test('waiting rooms can be joined once and are hidden after the match starts', async () => {
  const host = env.authenticatedContext('host').firestore();
  const guest = env.authenticatedContext('guest').firestore();
  const outsider = env.authenticatedContext('outsider').firestore();
  const room = doc(host, 'rooms/ABC123');
  await assertSucceeds(setDoc(room, {
    code: 'ABC123',
    host: 'host',
    status: 'waiting',
    round: 1,
    question: 'abandon',
    options: ['ত্যাগ করা', 'গ্রহণ করা'],
    answer: 'ত্যাগ করা',
    players: [player('host', 'Host')],
    answers: {},
    createdAt: serverTimestamp()
  }));
  await assertSucceeds(getDoc(doc(guest, 'rooms/ABC123')));
  await assertSucceeds(updateDoc(doc(guest, 'rooms/ABC123'), {
    players: [player('host', 'Host'), player('guest', 'Guest')]
  }));
  await assertFails(updateDoc(doc(outsider, 'rooms/ABC123'), {
    status: 'playing'
  }));
  await assertSucceeds(updateDoc(room, {
    status: 'playing',
    round: 1,
    question: 'bright',
    options: ['উজ্জ্বল', 'অন্ধকার'],
    answer: 'উজ্জ্বল',
    answers: {},
    endsAt: Date.now() + 15000
  }));
  await assertFails(getDoc(doc(outsider, 'rooms/ABC123')));
});

test('match history is readable only by listed participants', async () => {
  const alice = env.authenticatedContext('alice').firestore();
  const bob = env.authenticatedContext('bob').firestore();
  const outsider = env.authenticatedContext('outsider').firestore();
  const match = {
    roomCode: 'ABC123',
    rounds: 3,
    players: [player('alice'), player('bob')],
    playerIds: ['alice', 'bob'],
    winnerUid: 'alice',
    completedAt: Date.now()
  };
  await assertSucceeds(setDoc(doc(alice, 'matches/ABC123-3'), match));
  await assertSucceeds(getDoc(doc(bob, 'matches/ABC123-3')));
  await assertFails(getDoc(doc(outsider, 'matches/ABC123-3')));
  await assertFails(updateDoc(doc(alice, 'matches/ABC123-3'), { winnerUid: 'bob' }));
});

test('leaderboard writes are restricted to the signed-in owner and schema', async () => {
  const alice = env.authenticatedContext('alice').firestore();
  const bob = env.authenticatedContext('bob').firestore();
  await assertSucceeds(setDoc(doc(alice, 'leaderboard/alice'), {
    uid: 'alice', name: 'Alice', totalScore: 30, wins: 1, matches: 2, updatedAt: Date.now()
  }));
  await assertFails(setDoc(doc(bob, 'leaderboard/alice'), {
    uid: 'alice', name: 'Alice', totalScore: 9999, wins: 99, matches: 99, updatedAt: Date.now()
  }));
  await assertFails(setDoc(doc(alice, 'leaderboard/alice'), {
    uid: 'alice', name: 'Alice', totalScore: '9999', wins: 1, matches: 2, updatedAt: Date.now()
  }));
});
