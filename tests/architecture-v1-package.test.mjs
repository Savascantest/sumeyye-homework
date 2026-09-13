import assert from 'node:assert/strict';
import test from 'node:test';
import { assertArchitectureV1Package, collectArchitectureV1PackageErrors, APPROVED_ASSESSMENT_POLICY_VERSION, APPROVED_POLICY_VERSION, APPROVED_TEMPLATE_VERSION } from '../scripts/lib/architecture-v1-package.mjs';

const future = () => ({ date: '2026-09-21', policyVersion: APPROVED_POLICY_VERSION, templateContractVersion: APPROVED_TEMPLATE_VERSION, assessmentPolicyVersion: APPROVED_ASSESSMENT_POLICY_VERSION, game: { learn: [] } });

test('historical package does not require Architecture v1 metadata', () => assert.deepEqual(collectArchitectureV1PackageErrors({ date: '2026-09-12' }), []));
test('future package requires policyVersion', () => { const value = future(); delete value.policyVersion; assert.throws(() => assertArchitectureV1Package(value), /policyVersion/); });
test('future package requires templateContractVersion', () => { const value = future(); delete value.templateContractVersion; assert.throws(() => assertArchitectureV1Package(value), /templateContractVersion/); });
test('unknown policy version fails', () => assert.throws(() => assertArchitectureV1Package({ ...future(), policyVersion: 'other@1' }), /policyVersion/));
test('future package requires assessment policy coherence', () => assert.throws(() => assertArchitectureV1Package({ ...future(), assessmentPolicyVersion: 'other@1' }), /assessmentPolicyVersion/));
test('future package belongs to the Monday weekly cycle', () => assert.throws(() => assertArchitectureV1Package({ ...future(), date: '2026-09-20' }), /Monday/));
test('existing six-tab package shape remains compatible with metadata', () => assert.equal(assertArchitectureV1Package({ ...future(), sections: ['learn', 'read', 'listen', 'sort', 'order', 'quiz'] }).date, '2026-09-21'));
