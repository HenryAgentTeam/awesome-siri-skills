// Bundle-level checks that a single SKILL.md can't catch: folder layout,
// stray files, and skill names that collide across targets.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { validateSkill } from './validate.js';

const SKIP = new Set(['node_modules', '.git', 'DerivedData', 'build', '.build', 'Pods', 'Carthage', '.swiftpm']);

/** Every *.skillsbundle under `root` (or `root` itself). */
export function findBundles(root) {
  root = resolve(root);
  if (root.endsWith('.skillsbundle')) return [root];
  const out = [];
  const walk = (dir, depth) => {
    if (depth > 12) return;
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory() || SKIP.has(e.name) || e.name.startsWith('.')) continue;
      const p = join(dir, e.name);
      if (e.name.endsWith('.skillsbundle')) out.push(p);
      else walk(p, depth + 1);
    }
  };
  walk(root, 0);
  return out.sort();
}

/**
 * Validate one bundle. Returns { bundle, skills: [{ name, file, result }], issues }.
 * `issues` are bundle-level; per-skill issues live in each skill's result.
 */
export function validateBundle(bundlePath) {
  const issues = [];
  const skills = [];
  const skillsDir = join(bundlePath, 'Skills');
  if (!existsSync(skillsDir) || !statSync(skillsDir).isDirectory()) {
    issues.push({ level: 'error', message: 'Missing required directory "Skills".' });
    return { bundle: bundlePath, skills, issues };
  }
  for (const e of readdirSync(bundlePath, { withFileTypes: true })) {
    if (e.name === 'Skills' || e.name.startsWith('.')) continue;
    issues.push({ level: 'warning', message: `Unexpected "${e.name}" at the top of the bundle is ignored. Only Skills/ is read.` });
  }
  for (const e of readdirSync(skillsDir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    if (!e.isDirectory()) {
      issues.push({ level: 'warning', message: `"Skills/${e.name}" is not a folder and is ignored. Each skill is a folder with a SKILL.md.` });
      continue;
    }
    const file = join(skillsDir, e.name, 'SKILL.md');
    if (!existsSync(file)) {
      skills.push({ name: e.name, file, result: { ok: false, errors: 1, warnings: 0, routingScore: null, issues: [{ level: 'error', message: 'Missing SKILL.md in this skill folder.' }] } });
      continue;
    }
    skills.push({ name: e.name, file, result: validateSkill(readFileSync(file, 'utf8'), e.name) });
  }
  return { bundle: bundlePath, skills, issues };
}

/** Validate several bundles together and flag names shared between them. */
export function validateProject(paths) {
  const bundles = paths.flatMap((p) => findBundles(p)).map(validateBundle);
  const seen = new Map();
  const duplicates = [];
  for (const b of bundles) {
    for (const s of b.skills) {
      if (seen.has(s.name)) duplicates.push({ name: s.name, files: [seen.get(s.name), s.file] });
      else seen.set(s.name, s.file);
    }
  }
  const count = (lvl) =>
    bundles.reduce((n, b) => n + b.issues.filter((i) => i.level === lvl).length + b.skills.reduce((m, s) => m + s.result.issues.filter((i) => i.level === lvl).length, 0), 0);
  return { bundles, duplicates, errors: count('error'), warnings: count('warning') + duplicates.length };
}

/** Where Xcode puts the compiled skills inside a built .app. */
export function checkBuild(appPath) {
  const candidates = [join(appPath, 'Contents/Resources/Metadata.appintents'), join(appPath, 'Metadata.appintents')];
  const dir = candidates.find((d) => existsSync(d));
  if (!dir) return { ok: false, message: `No Metadata.appintents in ${basename(appPath)}. The app has no App Intents metadata at all.` };
  const compiled = readdirSync(dir).filter((f) => f.endsWith('.skillsc'));
  if (!compiled.length) {
    return { ok: false, message: 'No .skillsc found. Your Skills.skillsbundle was not compiled: add it to the target\'s Copy Bundle Resources build phase.' };
  }
  return { ok: true, message: `Found ${compiled.map((f) => relative(appPath, join(dir, f))).join(', ')}. Skills were compiled into the app.` };
}
