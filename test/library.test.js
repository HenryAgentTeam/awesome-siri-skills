import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadLibrary } from '../src/library.js';
import { validateSkill } from '../src/validate.js';

const lib = loadLibrary();

test('every library skill passes the build rules and has metadata', () => {
  assert.ok(lib.length >= 40);
  for (const s of lib) {
    const r = validateSkill(s.skill, s.slug);
    assert.equal(r.ok, true, `${s.slug}: ${r.issues.map((i) => i.message).join('; ')}`);
    assert.equal(r.warnings, 0, `${s.slug} has warnings`);
    for (const k of ['title', 'category', 'appType', 'summary']) assert.ok(s[k], `${s.slug} missing ${k}`);
    assert.ok(s.tools.length, `${s.slug} lists no tools`);
  }
});

test('library skills never name real brands in the frontmatter', () => {
  const brands = /\b(uber|doordash|starbucks|notion|spotify|airbnb|amazon|netflix|instacart|venmo)\b/i;
  for (const s of lib) assert.doesNotMatch(s.skill, brands, s.slug);
});
