const PROHIBITED_FIELD_REASONS = new Map([
  ['meetinguuid', 'raw meeting UUID'],
  ['rawmeetinguuid', 'raw meeting UUID'],
  ['zoommeetinguuid', 'raw meeting UUID'],
  ['meetingid', 'raw meeting ID'],
  ['rawmeetingid', 'raw meeting ID'],
  ['zoommeetingid', 'raw meeting ID'],
  ['meetingnumber', 'raw meeting ID'],
  ['transcript', 'transcript content'],
  ['zoomtranscript', 'transcript content'],
  ['transcriptitems', 'transcript items'],
  ['meetingtranscript', 'transcript content'],
  ['transcriptpath', 'private transcript path'],
  ['sourcetranscriptpath', 'private transcript path'],
  ['exportedtranscriptpath', 'private transcript path'],
  ['transcripthash', 'transcript hash'],
  ['transcriptsha256', 'transcript hash'],
  ['privatesourceevidence', 'private source evidence'],
  ['sourceevidence', 'private source evidence'],
  ['privateteacherevidence', 'private teacher evidence'],
  ['teachersourceevidence', 'private teacher/source evidence'],
  ['teachernote', 'private teacher note'],
  ['teachernotes', 'private teacher notes'],
  ['privateevidence', 'private execution evidence'],
  ['executionreceipt', 'private execution evidence'],
  ['executionreceiptid', 'private execution evidence'],
  ['validationreport', 'private execution evidence'],
  ['lessonrecord', 'private LessonRecord reference'],
  ['lessonrecordid', 'private LessonRecord reference'],
  ['lessonrecordref', 'private LessonRecord reference'],
  ['lessonrecords', 'private LessonRecord reference'],
  ['router', 'private router state'],
  ['routerstate', 'private router state'],
  ['routerrun', 'private router state'],
  ['routerrunid', 'private router state'],
  ['routingstate', 'private router state'],
  ['privateplanning', 'private planning metadata'],
  ['planningnotes', 'private planning metadata'],
  ['planningrecord', 'private planning metadata'],
  ['internalplanning', 'private planning metadata'],
  ['sourcehash', 'private source hash'],
  ['sourcehashes', 'private source hash'],
  ['privatesourcehash', 'private source hash'],
  ['sourceevidencehash', 'private source hash'],
  ['privatefilesystempath', 'private filesystem path'],
]);

// Public homework identifiers must not carry a raw meeting UUID.  A UUID in a
// package ID, directory-derived path, or any nested public value is still a
// disclosure even when the key is innocuously named `id`.
const UUID_LIKE_VALUE_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

export class PublicPackagePrivacyError extends Error {
  constructor(source, violations) {
    super(`${source}: public homework privacy validation failed:\n- ${violations.join('\n- ')}`);
    this.name = 'PublicPackagePrivacyError';
    this.source = source;
    this.violations = violations;
  }
}

export function normalizeFieldName(value) {
  return String(value).toLocaleLowerCase('en-US').replace(/[^a-z0-9]/g, '');
}

function prohibitedReason(field, value) {
  const normalized = normalizeFieldName(field);
  const exact = PROHIBITED_FIELD_REASONS.get(normalized);
  if (exact) return exact;
  if (/meeting(?:uuid|id|number)$/.test(normalized)) return 'raw meeting identifier';
  if (normalized.includes('transcript')) return 'transcript content or source metadata';
  if (/teacher(?:source)?notes?$/.test(normalized)) return 'private teacher note';
  if (normalized.includes('evidence') && /(private|source|teacher|execution)/.test(normalized)) {
    return 'private source, teacher, or execution evidence';
  }
  if (normalized === 'receipt' && value && typeof value === 'object') {
    return 'private execution evidence';
  }
  return undefined;
}

export function collectPublicPackagePrivacyViolations(value, location = '$') {
  const violations = [];

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      violations.push(...collectPublicPackagePrivacyViolations(item, `${location}[${index}]`));
    });
    return violations;
  }

  if (value && typeof value === 'object') {
    for (const [field, item] of Object.entries(value)) {
      const child = `${location}.${field}`;
      const reason = prohibitedReason(field, item);
      if (reason) violations.push(`${child}: prohibited ${reason} field`);
      violations.push(...collectPublicPackagePrivacyViolations(item, child));
    }
    return violations;
  }

  if (typeof value === 'string') {
    const normalized = value.toLocaleLowerCase('en-US').replaceAll('\\', '/');
    if (UUID_LIKE_VALUE_RE.test(value)) {
      violations.push(`${location}: raw UUID-like identifier in public value`);
    }
    if (
      normalized.includes('/private/')
      || normalized.includes('private-transcript')
      || /^[a-z]:\/users\//.test(normalized)
      || /^\/home\//.test(normalized)
    ) {
      violations.push(`${location}: private source path/value`);
    }
  }

  return violations;
}

export function assertPublicHomeworkPackagePrivacy(homework, { source = 'HomeworkPackage' } = {}) {
  const violations = collectPublicPackagePrivacyViolations(homework);
  if (violations.length) throw new PublicPackagePrivacyError(source, violations);
  return homework;
}

export const prohibitedPublicPackageFields = Object.freeze([...PROHIBITED_FIELD_REASONS.keys()]);
