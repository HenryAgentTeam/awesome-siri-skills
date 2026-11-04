import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSkill } from '../src/validate.js';

const good = `---
name: book-table
description: Book a table at a restaurant for the user. Use when the user asks to book, reserve, or get a table. Not for changing a booking.
---

Use the Find Restaurants tool. If more than one matches, ask which one.
`;

test('a well-formed skill passes with a full routing score', () => {
  const r = validateSkill(good, 'book-table');
  assert.equal(r.ok, true);
  assert.equal(r.routingScore, 100);
});

test('mirrors the Xcode build diagnostics', () => {
  const cases = [
    ['no frontmatter', 'hello', 'error', /open with ---/],
    ['unclosed frontmatter', '---\nname: a\n', 'error', /close with ---/],
    ['unquoted colon', '---\nname: a\ndescription: Plan: meals\n---\nx', 'error', /YAML syntax error/],
    ['bad name', '---\nname: Bad_Name\ndescription: x\n---\nx', 'error', /Invalid name/],
    ['double hyphen', '---\nname: a--b\ndescription: x\n---\nx', 'error', /Invalid name/],
    ['missing description', '---\nname: a\n---\nx', 'error', /Missing or empty description/],
    ['long description', `---\nname: a\ndescription: ${'x'.repeat(1025)}\n---\nx`, 'error', /1,024/],
    ['extra field', '---\nname: a\ndescription: x\nlicense: MIT\n---\nx', 'warning', /Unrecognized field "license"/],
    ['empty body', '---\nname: a\ndescription: x\n---\n', 'warning', /Empty body/],
  ];
  for (const [label, src, level, re] of cases) {
    const hit = validateSkill(src, 'a').issues.find((i) => re.test(i.message));
    assert.ok(hit, `${label}: expected ${re}`);
    assert.equal(hit.level, level, label);
  }
});

test('name must match the folder', () => {
  const r = validateSkill(good, 'other-folder');
  assert.equal(r.ok, false);
  assert.match(r.issues[0].message, /must match the folder name/);
});

test('flags Swift type names and placeholders in the body', () => {
  const src = good.replace('Find Restaurants tool', 'FindRestaurantsIntent') + 'Use the <Tool Title> tool.\n';
  const msgs = validateSkill(src, 'book-table').issues.map((i) => i.message).join('\n');
  assert.match(msgs, /Swift types \(FindRestaurantsIntent\)/);
  assert.match(msgs, /Placeholder text/);
});
