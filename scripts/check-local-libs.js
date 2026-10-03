#!/usr/bin/env node
// Guards against the classic monorepo trap: a local @myrmidon/<lib> library
// resolving to a stale published npm copy under node_modules instead of the
// workspace's own dist/ build. Local libraries are wired through
// tsconfig.json's compilerOptions.paths -> ./dist/myrmidon/<lib>; if a real
// (non-symlinked) copy also exists under node_modules/@myrmidon, plain
// Node module resolution (used by anything that isn't compiled through the
// Angular/TS pipeline) can silently shadow the local source with outdated
// published code.
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const libsDir = path.join(repoRoot, 'projects', 'myrmidon');

// the local libraries are those with a package.json under projects/myrmidon
const localLibs = fs
  .readdirSync(libsDir)
  .map((dir) => path.join(libsDir, dir, 'package.json'))
  .filter((file) => fs.existsSync(file))
  .map((file) => JSON.parse(fs.readFileSync(file, 'utf8')).name);

// tsconfig.json may contain comments, so parse it with TypeScript itself
const ts = require('typescript');
const tsconfigPath = path.join(repoRoot, 'tsconfig.json');
const { config: tsconfig, error } = ts.parseConfigFileTextToJson(
  tsconfigPath,
  fs.readFileSync(tsconfigPath, 'utf8')
);
if (error) {
  console.error('[check-local-libs] cannot parse tsconfig.json');
  process.exit(1);
}
const paths = tsconfig.compilerOptions.paths || {};

let failed = false;

// every local library must resolve through tsconfig paths into dist/
for (const name of localLibs) {
  const scopedName = name.slice('@myrmidon/'.length);
  const mapped = (paths[name] || []).map((p) => path.resolve(repoRoot, p));
  const expectedDist = path.join(repoRoot, 'dist', 'myrmidon', scopedName);
  if (!mapped.includes(path.resolve(expectedDist))) {
    console.error(
      `[check-local-libs] tsconfig.json paths do not map ${name} to ` +
        `./dist/myrmidon/${scopedName}.`
    );
    failed = true;
  }
}

for (const name of localLibs) {
  const scopedName = name.slice('@myrmidon/'.length);
  const nodeModulesPath = path.join(
    repoRoot,
    'node_modules',
    '@myrmidon',
    scopedName
  );

  if (!fs.existsSync(nodeModulesPath)) {
    continue;
  }

  const stat = fs.lstatSync(nodeModulesPath);
  if (!stat.isSymbolicLink()) {
    console.error(
      `[check-local-libs] node_modules/@myrmidon/${scopedName} is a real ` +
        'directory, not a symlink. This means a published npm copy of a ' +
        'local workspace library exists and may shadow the local dist/ ' +
        'build. Remove it (e.g. pnpm remove, or delete the directory and ' +
        'reinstall) so resolution stays uniform via tsconfig paths.'
    );
    failed = true;
    continue;
  }

  const target = fs.realpathSync(nodeModulesPath);
  const expectedDist = path.join(repoRoot, 'dist', 'myrmidon', scopedName);
  if (path.resolve(target) !== path.resolve(expectedDist)) {
    console.error(
      `[check-local-libs] node_modules/@myrmidon/${scopedName} is a ` +
        `symlink, but points to ${target} instead of ${expectedDist}. ` +
        'Fix the link so it resolves into this workspace\'s own dist/ ' +
        'build.'
    );
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log(
  `[check-local-libs] OK: ${localLibs.length} local libraries resolve ` +
    'uniformly via tsconfig paths (no shadowing copies in node_modules).'
);
