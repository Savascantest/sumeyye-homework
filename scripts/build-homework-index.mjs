import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('public/homeworks');
const entries = await readdir(root, { withFileTypes: true });
const lessons = [];

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const file = path.join(root, entry.name, 'homework.json');
  const homework = JSON.parse(await readFile(file, 'utf8'));
  for (const key of ['id', 'date', 'student', 'meetingUuid', 'title', 'sections']) {
    if (!homework[key]) throw new Error(`${file}: missing ${key}`);
  }
  if (!Array.isArray(homework.sections) || homework.sections.length === 0) {
    throw new Error(`${file}: sections must be a non-empty array`);
  }
  lessons.push({
    id: homework.id,
    date: homework.date,
    title: homework.title,
    path: `${entry.name}/homework.json`,
    meetingUuid: homework.meetingUuid,
  });
}

lessons.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
await writeFile(path.join(root, 'index.json'), `${JSON.stringify({ lessons }, null, 2)}\n`);
console.log(`Indexed ${lessons.length} homework package(s).`);
