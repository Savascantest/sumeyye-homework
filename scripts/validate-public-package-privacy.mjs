import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { assertPublicHomeworkPackagePrivacy } from './lib/public-package-privacy.mjs';

const PUBLIC_ROOT = path.resolve('public/homeworks');

function gitLines(args, { required = false } = {}) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    if (required) throw new Error(`Unable to determine changed public packages: ${result.stderr.trim()}`);
    return [];
  }
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function addPackagePath(files, candidate) {
  const renamedPath = candidate.split(' -> ').at(-1);
  if (!renamedPath.replaceAll('\\', '/').match(/^public\/homeworks\/.+\/homework\.json$/)) return;
  const absolute = path.resolve(renamedPath);
  if (absolute !== PUBLIC_ROOT && !absolute.startsWith(`${PUBLIC_ROOT}${path.sep}`)) {
    throw new Error(`Refusing to validate a package outside ${PUBLIC_ROOT}: ${candidate}`);
  }
  files.add(absolute);
}

export function changedPublicHomeworkPackages({ base = process.env.PUBLIC_PACKAGE_PRIVACY_BASE } = {}) {
  const files = new Set();

  for (const line of gitLines(['status', '--porcelain=v1', '--untracked-files=all', '--', 'public/homeworks'])) {
    addPackagePath(files, line.slice(3));
  }

  const requestedBase = base?.trim();
  const usableBase = requestedBase && !/^0+$/.test(requestedBase)
    ? requestedBase
    : process.env.CI
      ? 'HEAD^'
      : undefined;
  if (usableBase) {
    for (const candidate of gitLines(
      ['diff', '--name-only', '--diff-filter=AMR', usableBase, 'HEAD', '--', 'public/homeworks'],
      { required: true },
    )) addPackagePath(files, candidate);
  }

  return [...files].sort();
}

const explicit = process.argv.slice(2);
const targets = explicit.length ? explicit.map((value) => path.resolve(value)) : changedPublicHomeworkPackages();

for (const file of targets) {
  if (file !== PUBLIC_ROOT && !file.startsWith(`${PUBLIC_ROOT}${path.sep}`)) {
    throw new Error(`Refusing to validate a package outside ${PUBLIC_ROOT}: ${file}`);
  }
  const homework = JSON.parse(await readFile(file, 'utf8'));
  assertPublicHomeworkPackagePrivacy(homework, { source: path.relative(process.cwd(), file) });
}

console.log(
  targets.length
    ? `Validated public-package privacy for ${targets.length} new or modified package(s).`
    : 'No new or modified public homework packages require privacy validation.',
);
