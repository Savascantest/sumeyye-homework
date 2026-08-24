import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('public/homeworks');
const index = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'));
const gameKey = { learn: 'learn', read: 'read', listen: 'listening', sort: 'sort', order: 'order', quiz: 'quizzes' };
const errors = [];

function requireValue(value, message) {
  if (!value || (Array.isArray(value) && value.length === 0)) errors.push(message);
}

for (const lesson of index.lessons || []) {
  const file = path.join(root, lesson.path);
  if (!fs.existsSync(file)) {
    errors.push(`${lesson.id}: package file is missing`);
    continue;
  }
  const homework = JSON.parse(fs.readFileSync(file, 'utf8'));
  const sections = (homework.sections || []).map((section) => typeof section === 'string' ? section : section.id);
  requireValue(homework.id, `${lesson.id}: id is missing`);
  requireValue(homework.game, `${lesson.id}: game data is missing`);
  for (const section of sections) {
    if (!gameKey[section]) errors.push(`${lesson.id}: unknown tab ${section}`);
    else requireValue(homework.game?.[gameKey[section]], `${lesson.id}: ${section} tab has no data`);
  }
  if (sections.includes('read')) {
    requireValue(homework.game.read.tokens, `${lesson.id}: reading tokens are missing`);
    requireValue(homework.game.read.questions, `${lesson.id}: reading questions are missing`);
    if (homework.game.read.extra) {
      requireValue(homework.game.read.extra.paragraphs, `${lesson.id}: long reading paragraphs are missing`);
      requireValue(homework.game.read.extra.questions, `${lesson.id}: long reading questions are missing`);
    }
  }
  if (sections.includes('listen')) {
    requireValue(homework.game.listening.url, `${lesson.id}: listening URL is missing`);
    requireValue(homework.game.listening.questions, `${lesson.id}: listening questions are missing`);
  }
}

if (errors.length) {
  console.error(`Homework validation failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Validated ${index.lessons.length} homework packages and all declared tabs.`);
