// SKILL.md validator for Siri app skills.
// Format checks mirror the build diagnostics in Apple's Skills Bundle docs.
// Routing checks are heuristics of ours, labeled as such in the UI.
import { parse } from 'yaml';

const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ALLOWED = new Set(['name', 'description']);
const SWIFT_TYPE_RE = /\b[A-Z][A-Za-z0-9]*(Intent|Entity|Query|AppEnum)\b/g;
const VAGUE_RE = /\b(stuff|things|various|etc\.?|misc|everything|anything)\b/gi;

/** @typedef {{ level: 'error'|'warning'|'tip', message: string, line?: number }} Issue */

/**
 * @param {string} source contents of SKILL.md
 * @param {string} [dirName] the skill's folder name, if known
 */
export function validateSkill(source, dirName = '') {
  /** @type {Issue[]} */
  const issues = [];
  const text = source.replace(/\r\n/g, '\n');
  const lines = text.split('\n');

  if (lines[0]?.trim() !== '---') {
    issues.push({ level: 'error', line: 1, message: 'Frontmatter must open with --- on its own line.' });
    return result(issues, null, '');
  }
  const close = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
  if (close === -1) {
    issues.push({ level: 'error', line: 1, message: 'Frontmatter must close with --- on its own line.' });
    return result(issues, null, '');
  }

  const yamlText = lines.slice(1, close).join('\n');
  const body = lines.slice(close + 1).join('\n').trim();
  let fm;
  try {
    fm = parse(yamlText) ?? {};
  } catch (e) {
    const hint = /:\s/.test(yamlText.split('\n').find((l) => l.startsWith('description:'))?.slice(13) ?? '')
      ? ' An unquoted ": " inside the description is the usual cause. Wrap the description in quotes.'
      : '';
    issues.push({ level: 'error', line: 2, message: `YAML syntax error.${hint}` });
    return result(issues, null, body);
  }
  if (typeof fm !== 'object' || Array.isArray(fm)) fm = {};

  const lineOf = (key) => {
    const i = lines.slice(1, close).findIndex((l) => l.startsWith(`${key}:`));
    return i === -1 ? undefined : i + 2;
  };

  for (const key of Object.keys(fm)) {
    if (!ALLOWED.has(key)) {
      issues.push({ level: 'warning', line: lineOf(key), message: `Unrecognized field "${key}" is ignored. Siri skills only support name and description.` });
    }
  }

  const name = fm.name == null ? '' : String(fm.name);
  if (!name.trim()) {
    issues.push({ level: 'error', line: lineOf('name'), message: 'Missing or empty name.' });
  } else if (name.length > 64 || !NAME_RE.test(name)) {
    issues.push({ level: 'error', line: lineOf('name'), message: 'Invalid name. Use 1–64 lowercase letters, digits and single hyphens, not starting or ending with a hyphen.' });
  } else if (dirName && dirName !== name) {
    issues.push({ level: 'error', line: lineOf('name'), message: `name "${name}" must match the folder name "${dirName}".` });
  }

  const desc = fm.description == null ? '' : String(fm.description).trim();
  if (!desc) {
    issues.push({ level: 'error', line: lineOf('description'), message: 'Missing or empty description.' });
  } else if (desc.length > 1024) {
    issues.push({ level: 'error', line: lineOf('description'), message: `description is ${desc.length} characters. The limit is 1,024.` });
  }

  if (/<[A-Z][^<>]{2,60}>/.test(text)) {
    issues.push({ level: 'warning', message: 'Placeholder text like <Tool Title> is still in the file. Replace it before shipping.' });
  }

  if (!body) {
    issues.push({ level: 'warning', line: close + 2, message: 'Empty body. The model gets nothing beyond the description.' });
  }

  return result(issues, desc, body);
}

function result(issues, desc, body) {
  const tips = desc ? routingTips(desc) : [];
  const bodyTips = body ? bodyChecks(body) : [];
  const all = [...issues, ...tips.issues ?? [], ...bodyTips];
  const errors = all.filter((i) => i.level === 'error').length;
  return {
    ok: errors === 0,
    errors,
    warnings: all.filter((i) => i.level === 'warning').length,
    issues: all,
    routingScore: desc ? tips.score : null,
  };
}

// Heuristic: the description alone decides whether Siri picks the skill.
function routingTips(desc) {
  const issues = [];
  let score = 100;
  const len = desc.length;
  if (len < 60) {
    score -= 35;
    issues.push({ level: 'tip', message: 'Description is very short. Name the requests it handles in the words people use.' });
  } else if (len < 110) {
    score -= 15;
    issues.push({ level: 'tip', message: 'Description could list more phrasings people might use.' });
  }
  if (!/\b(use when|use it when|when the (user|person)|asks? to|asks? for)\b/i.test(desc)) {
    score -= 25;
    issues.push({ level: 'tip', message: 'Say when to use the skill, e.g. "Use when the user asks to …".' });
  }
  if (!/\b(not for|doesn't cover|does not cover|don't use|do not use|not used for)\b/i.test(desc)) {
    score -= 15;
    issues.push({ level: 'tip', message: 'Add a boundary such as "Not for …" so a related skill is not picked by mistake.' });
  }
  const vague = desc.match(VAGUE_RE);
  if (vague) {
    score -= 15;
    issues.push({ level: 'tip', message: `Vague wording (${[...new Set(vague.map((v) => v.toLowerCase()))].join(', ')}). Be specific about the task.` });
  }
  return { score: Math.max(0, score), issues };
}

function bodyChecks(body) {
  const issues = [];
  const types = [...new Set(body.match(SWIFT_TYPE_RE) ?? [])];
  if (types.length) {
    issues.push({ level: 'warning', message: `Body names Swift types (${types.slice(0, 3).join(', ')}). Refer to tools by title instead, e.g. "the Plan Meal tool".` });
  }
  if (!/\btool\b/i.test(body)) {
    issues.push({ level: 'tip', message: 'Body never mentions a tool. Skills work best when they say which tools to use and in what order.' });
  }
  if (!/\b(ask|confirm)\b/i.test(body)) {
    issues.push({ level: 'tip', message: 'Say when the model should ask the person instead of guessing.' });
  }
  return issues;
}
