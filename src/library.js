// The skill library shipped in skills/<name>/ (SKILL.md + README.md metadata).
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export const LIBRARY_DIR = fileURLToPath(new URL('../skills/', import.meta.url));

function splitFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return m ? { data: parse(m[1]) ?? {}, body: m[2].trim() } : { data: {}, body: text.trim() };
}

/** @returns {{ slug, title, category, appType, summary, tools, icon, updated, skill, notes, hasIcon }[]} */
export function loadLibrary(dir = LIBRARY_DIR) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, 'SKILL.md')))
    .map((e) => {
      const base = join(dir, e.name);
      const readme = existsSync(join(base, 'README.md')) ? splitFrontmatter(readFileSync(join(base, 'README.md'), 'utf8')) : { data: {}, body: '' };
      return {
        slug: e.name,
        title: e.name,
        category: 'Other',
        tools: [],
        ...readme.data,
        updated: readme.data.updated ? String(readme.data.updated).slice(0, 10) : undefined,
        skill: readFileSync(join(base, 'SKILL.md'), 'utf8'),
        notes: readme.body,
        hasIcon: existsSync(join(base, 'icon.webp')),
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function getSkill(slug, dir = LIBRARY_DIR) {
  return loadLibrary(dir).find((s) => s.slug === slug);
}
