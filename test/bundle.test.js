import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateProject, checkBuild } from '../src/bundle.js';
import { writeSkill } from '../src/scaffold.js';
import { getSkill } from '../src/library.js';

test('finds bundles, catches cross-target duplicates and layout problems', () => {
  const root = mkdtempSync(join(tmpdir(), 'siriskills-'));
  const s = getSkill('reorder-delivery').skill;
  writeSkill(join(root, 'App/Skills.skillsbundle'), 'reorder-delivery', s);
  writeSkill(join(root, 'Widget/Skills.skillsbundle'), 'reorder-delivery', s);
  mkdirSync(join(root, 'App/Skills.skillsbundle/Skills/no-file'));
  mkdirSync(join(root, 'App/Skills.skillsbundle/Resources'));
  mkdirSync(join(root, 'node_modules/ignored.skillsbundle'), { recursive: true });

  const r = validateProject([root]);
  assert.equal(r.bundles.length, 2);
  assert.deepEqual(r.duplicates.map((d) => d.name), ['reorder-delivery']);
  assert.equal(r.errors, 1); // missing SKILL.md
  const app = r.bundles.find((b) => b.bundle.includes('/App/'));
  assert.match(app.issues[0].message, /Unexpected "Resources"/);
});

test('reports a bundle without Skills/', () => {
  const root = mkdtempSync(join(tmpdir(), 'siriskills-'));
  mkdirSync(join(root, 'Skills.skillsbundle'));
  assert.equal(validateProject([root]).errors, 1);
});

test('check_build looks for .skillsc in both app layouts', () => {
  const root = mkdtempSync(join(tmpdir(), 'siriskills-'));
  const ios = join(root, 'A.app/Metadata.appintents');
  const mac = join(root, 'B.app/Contents/Resources/Metadata.appintents');
  mkdirSync(ios, { recursive: true });
  mkdirSync(mac, { recursive: true });
  assert.equal(checkBuild(join(root, 'A.app')).ok, false);
  writeFileSync(join(ios, 'Skills.skillsc'), '');
  writeFileSync(join(mac, 'MySkills.skillsc'), '');
  assert.equal(checkBuild(join(root, 'A.app')).ok, true);
  assert.equal(checkBuild(join(root, 'B.app')).ok, true);
});

test('refuses invalid names and silent overwrites', () => {
  const root = mkdtempSync(join(tmpdir(), 'siriskills-'));
  assert.throws(() => writeSkill(root, 'Bad Name', 'x'), /Invalid skill name/);
  writeSkill(root, 'a-skill', '---\nname: a-skill\n---\n');
  assert.throws(() => writeSkill(root, 'a-skill', 'x'), /already exists/);
});
