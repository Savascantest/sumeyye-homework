export const CONTEXTUAL_PRACTICE_EFFECTIVE_DATE = '2026-11-21';
export const APPROVED_AUTHORING_STANDARD_VERSION = 'contextual-practice@1';

const abstractGrammarPrompt = /(?:name|identify|explain)\s+(?:the\s+)?(?:grammar\s+)?(?:rule|tense)|what does .+ (?:signal|introduce)|which (?:form|sentence) is (?:past|present)|choose the correct (?:negative|question|tense)/i;

function activityDate(homework) {
  return homework?.lessonDate || homework?.date || '';
}

function validateChoice(item, path, errors) {
  if (!item?.prompt || !Array.isArray(item.options) || !item.answer) return;
  if (!item.explanation?.trim()) errors.push(`${path}: explanation is required`);
  if (!item.options.includes(item.answer)) errors.push(`${path}: answer must match exactly one option`);
  if (new Set(item.options).size !== item.options.length) errors.push(`${path}: options must be unique`);
  if (abstractGrammarPrompt.test(item.prompt)) errors.push(`${path}: prompt asks for an abstract grammar rule instead of using context`);
}

export function collectContextualPracticeErrors(homework) {
  if (activityDate(homework) < CONTEXTUAL_PRACTICE_EFFECTIVE_DATE) return [];
  const errors = [];
  if (homework.authoringStandardVersion !== APPROVED_AUTHORING_STANDARD_VERSION) {
    errors.push(`authoringStandardVersion must equal ${APPROVED_AUTHORING_STANDARD_VERSION}`);
  }

  const game = homework.game || {};
  (game.read?.questions || []).forEach((item, index) => validateChoice(item, `read.questions[${index}]`, errors));
  (game.read?.extra?.questions || []).forEach((item, index) => validateChoice(item, `read.extra.questions[${index}]`, errors));
  (game.listening?.questions || []).forEach((item, index) => validateChoice(item, `listening.questions[${index}]`, errors));
  Object.entries(game.quizzes || {}).forEach(([group, items]) => items.forEach((item, index) => validateChoice(item, `quizzes.${group}[${index}]`, errors)));

  (game.sort || []).forEach((item, index) => {
    if (!item.explanation?.trim()) errors.push(`sort[${index}]: explanation is required`);
    if (!item.choices?.includes(item.type)) errors.push(`sort[${index}]: type must match one available choice`);
  });
  (game.order || []).forEach((item, index) => {
    if (!item.explanation?.trim()) errors.push(`order[${index}]: explanation is required`);
  });
  (game.exam?.formats || []).forEach((format, formatIndex) => {
    const optionIds = new Set((format.options || []).map((option) => option.id));
    (format.items || []).forEach((item, itemIndex) => {
      const path = `exam.formats[${formatIndex}].items[${itemIndex}]`;
      if (!item.prompt?.trim() || !item.answer) errors.push(`${path}: prompt and answer are required`);
      if (!item.explanation?.trim()) errors.push(`${path}: explanation is required`);
      if (abstractGrammarPrompt.test(item.prompt || '')) errors.push(`${path}: prompt asks for an abstract grammar rule instead of using context`);
      if (format.type === 'match-halves' && !optionIds.has(item.answer)) errors.push(`${path}: answer must reference a matching option`);
    });
  });
  return errors;
}

export function assertContextualPractice(homework, source = 'HomeworkPackage') {
  const errors = collectContextualPracticeErrors(homework);
  if (errors.length) throw new Error(`${source}: contextual practice validation failed:\n- ${errors.join('\n- ')}`);
  return homework;
}
