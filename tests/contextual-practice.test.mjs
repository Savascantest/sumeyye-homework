import test from 'node:test';
import assert from 'node:assert/strict';
import { assertContextualPractice } from '../scripts/lib/contextual-practice.mjs';

const valid = () => ({
  lessonDate: '2026-11-21',
  authoringStandardVersion: 'contextual-practice@1',
  game: {
    quizzes: { Daily: [{ prompt: 'Did ___ call reception?', options: ['anyone', 'nothing', 'no one did'], answer: 'anyone', explanation: 'Anyone is used in this general question.' }] },
    sort: [{ text: 'Someone called.', type: 'PERSON', choices: ['PERSON', 'THING'], explanation: 'Someone refers to a person.' }],
    order: [{ parts: ['Someone', 'called'], answer: 'Someone called', explanation: 'Someone suits this positive statement.' }],
    exam: { formats: [{ id: 'gaps', type: 'written-answer', items: [{ prompt: '___ left a parcel.', answer: 'someone', explanation: 'Someone is used in a positive statement.' }] }] }
  }
});

test('archived packages remain unchanged by the contextual standard', () => assert.doesNotThrow(() => assertContextualPractice({ lessonDate: '2026-11-15' })));
test('current and future packages require the authoring standard version', () => { const value = valid(); delete value.authoringStandardVersion; assert.throws(() => assertContextualPractice(value), /authoringStandardVersion/); });
test('contextual questions require a post-answer explanation', () => { const value = valid(); delete value.game.quizzes.Daily[0].explanation; assert.throws(() => assertContextualPractice(value), /explanation is required/); });
test('multiple-choice answers must be present and unique', () => { const value = valid(); value.game.quizzes.Daily[0].answer = 'someone'; assert.throws(() => assertContextualPractice(value), /answer must match/); });
test('abstract grammar-identification prompts are rejected', () => { const value = valid(); value.game.quizzes.Daily[0].prompt = 'Identify the grammar rule.'; assert.throws(() => assertContextualPractice(value), /abstract grammar rule/); });
test('a contextual package passes', () => assert.equal(assertContextualPractice(valid()).lessonDate, '2026-11-21'));
