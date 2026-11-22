# Student homework platform

This repository contains a permanent React application and one immutable package per lesson.

## Add a lesson

1. Add `public/homeworks/YYYY-MM-DD-meeting-id/homework.json`.
2. Run `npm run homeworks:index`.
3. Run `npm run build`.

## Authoring standard for new lessons

Packages dated 21 November 2026 or later must declare `"authoringStandardVersion": "contextual-practice@1"` and follow these rules across every learner-facing activity:

- Use a clear, plausible daily-life, school, community, or work situation. Vocabulary, reading, listening, sorting, ordering, matching, gap-fill, dialogue, and assessment items all follow the same standard.
- Give enough context for one defensible answer. Keep options distinct, avoid vague references, and make open-response model answers traceable to the supplied text or audio.
- Do not ask the learner to name, identify, or explain a grammar rule. Put the grammar inside a useful sentence, message, short dialogue, or practical choice.
- Every scored item includes a brief `explanation`. For a grammar item, the explanation appears after the learner answers and may then name the relevant rule in context.
- Prefer natural meaning checks over abstract true/false rule statements. Use true/false only when the statement describes an unambiguous real situation supported by the activity.
- Never include meeting identifiers, transcript excerpts, private notes, filesystem paths, or other source evidence in a public homework package.

`npm run validate:content` enforces the version marker, explanations, unique multiple-choice answers, matching references, and a basic guard against abstract grammar-identification prompts while leaving archived packages unchanged.

The app opens the newest lesson by default. Progress is stored in the learner's browser and is namespaced by student and lesson, so adding a lesson does not overwrite previous work.
