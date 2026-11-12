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

test('user profiles reject malformed progress values and unexpected fields', async () => {
  const alice = env.authenticatedContext('alice').firestore();
  const profile = doc(alice, 'users/alice');

  await assertSucceeds(setDoc(profile, {
    displayName: 'Alice',
    savedWords: [{ word: 'abandon', meaning: 'ত্যাগ করা' }],
    xp: 10,
    totalCorrect: 1,
    totalAnswered: 1,
    currentStreak: 1,
    bestStreak: 1,
    dailyKey: '2026-11-13',
    dailyDone: 1,
    dailyGoal: 10,
    achievements: ['first'],
    soloScore: 10,
    soloTotal: 1,
    soloCorrect: 1,
    updatedAt: Date.now()
  }));

  await assertFails(updateDoc(profile, { xp: -1 }));
  await assertFails(updateDoc(profile, { dailyGoal: 0 }));
  await assertFails(updateDoc(profile, { displayName: 'A'.repeat(21) }));
  await assertFails(updateDoc(profile, { savedWords: 'not-an-array' }));
  await assertFails(updateDoc(profile, { isAdmin: true }));
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

  // A participant may not rewrite the question, answer, or the other player's score.
  await assertFails(updateDoc(doc(guest, 'rooms/ABC123'), { answer: 'অন্ধকার' }));
  await assertFails(updateDoc(doc(guest, 'rooms/ABC123'), {
    answers: { guest: { option: 'উজ্জ্বল', correct: true } },
    players: [player('host', 'Host'), { ...player('guest', 'Guest'), score: 999, correct: 99 }],
    status: 'playing'
  }));

  // A legitimate answer can update only the submitting player's derived score.
  await assertSucceeds(updateDoc(doc(guest, 'rooms/ABC123'), {
    answers: { guest: { option: 'উজ্জ্বল', correct: true } },
    players: [player('host', 'Host'), { ...player('guest', 'Guest'), score: 10, correct: 1 }],
    status: 'playing'
  }));
  await assertSucceeds(updateDoc(room, {
    answers: { guest: { option: 'উজ্জ্বল', correct: true }, host: { option: 'উজ্জ্বল', correct: true } },
    players: [{ ...player('host', 'Host'), score: 10, correct: 1 }, { ...player('guest', 'Guest'), score: 10, correct: 1 }],
    status: 'round-complete'
  }));
  await assertSucceeds(updateDoc(room, { status: 'finished', finishedAt: Date.now() }));
  await assertFails(updateDoc(doc(guest, 'rooms/ABC123'), { status: 'finished' }));
});

test('match history must match a finished room and remain participant-only', async () => {
  const alice = env.authenticatedContext('alice').firestore();
  const bob = env.authenticatedContext('bob').firestore();
  const outsider = env.authenticatedContext('outsider').firestore();
  const room = doc(alice, 'rooms/MATCH1');
  await assertSucceeds(setDoc(room, {
    code: 'MATCH1', host: 'alice', status: 'waiting', round: 1,
    question: 'bright', options: ['উজ্জ্বল', 'অন্ধকার'], answer: 'উজ্জ্বল',
    players: [player('alice', 'Alice')], answers: {}, createdAt: serverTimestamp()
  }));
  await assertSucceeds(updateDoc(doc(bob, 'rooms/MATCH1'), {
    players: [player('alice', 'Alice'), player('bob', 'Bob')]
  }));
  await assertSucceeds(updateDoc(room, {
    status: 'playing', round: 1, answers: {}, endsAt: Date.now() + 15000
  }));
  await assertSucceeds(updateDoc(doc(bob, 'rooms/MATCH1'), {
    answers: { bob: { option: 'উজ্জ্বল', correct: true } },
    players: [player('alice', 'Alice'), { ...player('bob', 'Bob'), score: 10, correct: 1 }],
    status: 'playing'
  }));
  await assertSucceeds(updateDoc(room, {
    answers: {
      bob: { option: 'উজ্জ্বল', correct: true },
      alice: { option: 'উজ্জ্বল', correct: true }
    },
    players: [
      { ...player('alice', 'Alice'), score: 10, correct: 1 },
      { ...player('bob', 'Bob'), score: 10, correct: 1 }
    ],
    status: 'round-complete'
  }));
  await assertSucceeds(updateDoc(room, { status: 'finished', finishedAt: Date.now() }));

  const match = {
    roomCode: 'MATCH1',
    rounds: 1,
    players: [
      { ...player('alice', 'Alice'), score: 10, correct: 1 },
      { ...player('bob', 'Bob'), score: 10, correct: 1 }
    ],
    playerIds: ['alice', 'bob'],
    winnerUid: null,
    completedAt: Date.now()
  };
  await assertSucceeds(setDoc(doc(alice, 'matches/MATCH1-1'), match));
  await assertSucceeds(getDoc(doc(bob, 'matches/MATCH1-1')));
  await assertFails(getDoc(doc(outsider, 'matches/MATCH1-1')));
  await assertFails(updateDoc(doc(alice, 'matches/MATCH1-1'), { winnerUid: 'bob' }));
  await assertFails(setDoc(doc(alice, 'matches/FORGED-1'), { ...match, roomCode: 'FORGED' }));

  const marker = doc(alice, 'leaderboard/alice/matches/MATCH1-1');
  await assertSucceeds(setDoc(marker, { matchId: 'MATCH1-1', completedAt: Date.now() }));
  await assertFails(updateDoc(marker, { completedAt: Date.now() + 1 }));
});

test('leaderboard writes enforce owner, integer bounds, and wins not exceeding matches', async () => {
  const alice = env.authenticatedContext('alice').firestore();
  const bob = env.authenticatedContext('bob').firestore();
  const ref = doc(alice, 'leaderboard/alice');
  await assertSucceeds(setDoc(ref, {
    uid: 'alice', name: 'Alice', totalScore: 30, wins: 1, matches: 2, updatedAt: Date.now()
  }));
  await assertFails(setDoc(doc(bob, 'leaderboard/alice'), {
    uid: 'alice', name: 'Alice', totalScore: 9999, wins: 99, matches: 99, updatedAt: Date.now()
  }));
  await assertFails(updateDoc(ref, { totalScore: -1 }));
  await assertFails(updateDoc(ref, { wins: 1.5 }));
  await assertFails(updateDoc(ref, { wins: 4 }));
  await assertFails(updateDoc(ref, { totalScore: '9999' }));
});
