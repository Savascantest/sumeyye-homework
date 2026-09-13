export const ARCHITECTURE_V1_EFFECTIVE_DATE = '2026-09-14';
export const APPROVED_POLICY_VERSION = 'sumeyye-weekend-monday@1';
export const APPROVED_TEMPLATE_VERSION = 'sumeyye-six-tab-interactive@1';
export const APPROVED_ASSESSMENT_POLICY_VERSION = 'sumeyye-section-and-final-checks@1';

export function collectArchitectureV1PackageErrors(homework) {
  if (!homework?.date || homework.date < ARCHITECTURE_V1_EFFECTIVE_DATE) return [];
  const errors = [];
  if (homework.date.slice(0, 10) !== homework.date || new Date(`${homework.date}T12:00:00Z`).getUTCDay() !== 1) errors.push('future Architecture v1 package date must be a Monday');
  if (homework.policyVersion !== APPROVED_POLICY_VERSION) errors.push(`policyVersion must equal ${APPROVED_POLICY_VERSION}`);
  if (homework.templateContractVersion !== APPROVED_TEMPLATE_VERSION) errors.push(`templateContractVersion must equal ${APPROVED_TEMPLATE_VERSION}`);
  if (homework.assessmentPolicyVersion !== APPROVED_ASSESSMENT_POLICY_VERSION) errors.push(`assessmentPolicyVersion must equal ${APPROVED_ASSESSMENT_POLICY_VERSION}`);
  return errors;
}

export function assertArchitectureV1Package(homework, source = 'HomeworkPackage') {
  const errors = collectArchitectureV1PackageErrors(homework);
  if (errors.length) throw new Error(`${source}: Architecture v1 package validation failed:\n- ${errors.join('\n- ')}`);
  return homework;
}
