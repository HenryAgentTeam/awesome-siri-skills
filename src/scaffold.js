// Writes a skill into a Skills.skillsbundle, creating the bundle if needed.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function skeleton(name) {
  const title = name.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  return `---
name: ${name}
description: <What it does>. Use when the user asks to <the words people use>. Not for <a related task another skill handles>.
---

# ${title}

1. Use the <Tool Title> tool first. Say what to pass along.
2. If more than one result matches, show them and ask which one.
3. Use the <Tool Title> tool to finish.

## Don't

- Don't <something no single tool description can say>.
`;
}

/** @returns {string} path of the written SKILL.md */
export function writeSkill(bundlePath, name, content, { force = false } = {}) {
  if (!NAME_RE.test(name) || name.length > 64) throw new Error(`Invalid skill name "${name}". Use kebab-case, 1–64 characters.`);
  const dir = join(bundlePath, 'Skills', name);
  const file = join(dir, 'SKILL.md');
  if (existsSync(file) && !force) throw new Error(`${file} already exists. Pass --force to overwrite.`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, content.replace(/^name:\s*.+$/m, `name: ${name}`));
  return file;
}
