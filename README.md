# Student homework platform

This repository contains a permanent React application and one immutable package per lesson.

## Add a lesson

1. Add `public/homeworks/YYYY-MM-DD-meeting-id/homework.json`.
2. Run `npm run homeworks:index`.
3. Run `npm run build`.

The app opens the newest lesson by default. Progress is stored in the learner's browser and is namespaced by student and lesson, so adding a lesson does not overwrite previous work.
