import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  PublicPackagePrivacyError,
  assertPublicHomeworkPackagePrivacy,
  collectPublicPackagePrivacyViolations,
} from '../scripts/lib/public-package-privacy.mjs';

const validPackage = () => ({
  id: 'public-homework-2026-09-10-a1b2c3',
  policyVersion: 'sumeyye-v1',
  title: 'Everyday English',
  lessonNotes: ['Use in for months and on for days.'],
  grammar: { explanation: 'Use at for clock times.' },
  exercises: [{ prompt: 'Choose the correct preposition.', options: ['in', 'on', 'at'] }],
});

test('a learner-facing package with public IDs and semantic notes passes', () => {
  assert.equal(assertPublicHomeworkPackagePrivacy(validPackage()).id, 'public-homework-2026-09-10-a1b2c3');
});

test('a raw UUID embedded in an otherwise public package ID is rejected', () => {
  const homework = validPackage();
  homework.id = 'homework-2026-09-12-9f6ff8bd-e57d-4182-acd2-681a9ecae9aa';
  assert.throws(
    () => assertPublicHomeworkPackagePrivacy(homework),
    /raw UUID-like identifier in public value/,
  );
});

for (const [name, field, value] of [
  ['meeting UUID', 'meetingUuid', 'raw-uuid'],
  ['meeting UUID variant', 'meeting_uuid', 'raw-uuid'],
  ['raw meeting ID', 'rawMeetingId', '123456789'],
  ['raw meeting ID variant', 'zoom_meeting_id', '123456789'],
  ['compound meeting UUID variant', 'zoom_raw_meeting_uuid', 'raw-uuid'],
  ['transcript content', 'transcript', 'private lesson words'],
  ['transcript items', 'transcriptItems', [{ text: 'private item' }]],
  ['transcript path', 'exported_transcript_path', 'C:/private/lesson.txt'],
  ['transcript hash', 'transcriptHash', 'abc123'],
  ['compound transcript hash variant', 'source_transcript_sha_256', 'abc123'],
  ['teacher note', 'teacherNote', 'private teacher evidence'],
  ['private source evidence', 'privateSourceEvidence', { checked: true }],
  ['compound teacher evidence variant', 'private_teacher_source_evidence', { checked: true }],
]) {
  test(`${name} is rejected`, () => {
    const packageWithPrivateField = { ...validPackage(), [field]: value };
    assert.throws(
      () => assertPublicHomeworkPackagePrivacy(packageWithPrivateField),
      PublicPackagePrivacyError,
    );
  });
}

test('nested prohibited fields are rejected with their object path', () => {
  const homework = validPackage();
  homework.exercises[0].debug = { source: { transcript_path: 'C:/private/source.txt' } };
  const violations = collectPublicPackagePrivacyViolations(homework);
  assert.ok(violations.some((value) => value.includes('$.exercises[0].debug.source.transcript_path')));
});

test('normal lesson content, grammar notes, explanations, and archive IDs remain allowed', () => {
  const homework = {
    ...validPackage(),
    archiveId: 'archive-homework-4',
    lessonId: 'public-lesson-4',
    packageId: 'package-4',
    sections: [{ id: 'notes', explanation: 'This explanation is safe learner-facing material.' }],
  };
  assert.deepEqual(collectPublicPackagePrivacyViolations(homework), []);
});

test('the public index builder neither requires nor republishes raw meeting UUIDs', async () => {
  const source = await readFile(
    new URL('../scripts/build-homework-index.mjs', import.meta.url),
    'utf8',
  );

  assert.doesNotMatch(source, /meetingUuid/);
});
