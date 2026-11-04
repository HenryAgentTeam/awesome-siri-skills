#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { validateSkill } from '../src/validate.js';
import { findBundles, validateProject, checkBuild } from '../src/bundle.js';
import { loadLibrary, getSkill } from '../src/library.js';
import { skeleton, writeSkill } from '../src/scaffold.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const [cmd, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter((a) => a.startsWith('--')));
const args = rest.filter((a) => !a.startsWith('--'));
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i !== -1 && rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[i + 1] : fallback;
};
const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s);
const red = (s) => c(31, s), yellow = (s) => c(33, s), green = (s) => c(32, s), dim = (s) => c(2, s), bold = (s) => c(1, s);

const HELP = `${bold('siriskills')} ${pkg.version} — tools for Siri app skills (SKILL.md in Skills.skillsbundle)

${bold('Usage')}
  siriskills validate [path…]        Validate bundles under path (default .), a skill folder, or a SKILL.md
      --strict                       Treat warnings as errors
      --tips                         Also show description routing tips
      --json                         Machine-readable output
  siriskills check-build <App.app>   Confirm Xcode compiled your skills (.skillsc) into a built app
  siriskills new <name>              Scaffold Skills/<name>/SKILL.md   [--bundle path] [--force]
  siriskills list [category]         List the ${loadLibrary().length} example skills in this library
  siriskills show <name>             Print an example skill
  siriskills add <name>              Copy an example skill into your bundle   [--bundle path] [--force]
  siriskills mcp                     Run the MCP server over stdio

${bold('Examples')}
  npx siriskills validate .
  npx siriskills add reorder-delivery --bundle MyApp/Skills.skillsbundle
  claude mcp add siriskills -- npx -y siriskills mcp

Docs and generator: https://siriskills.com`;

function printIssue(file, i, name) {
  const where = `${file}${i.line ? `:${i.line}` : ''}`;
  const lvl = i.level === 'error' ? red('error') : i.level === 'warning' ? yellow('warning') : dim('tip');
  console.log(`${where}: ${lvl}: ${name ? `'${name}': ` : ''}${i.message}`);
}

function validate() {
  const targets = args.length ? args : ['.'];
  // A single SKILL.md or skill folder outside any bundle.
  const isSkill = (t) => existsSync(t) && (t.endsWith('.md') || existsSync(resolve(t, 'SKILL.md')));
  const singles = targets.filter(isSkill);
  const bundlesIn = [];
  for (const t of targets.filter((x) => !isSkill(x))) {
    // A plain folder of skill folders (like this repo's skills/) rather than a bundle.
    const children = existsSync(t) && !findBundles(t).length ? readdirSync(t).map((n) => join(t, n)).filter((p) => existsSync(join(p, 'SKILL.md'))) : [];
    if (children.length) singles.push(...children);
    else bundlesIn.push(t);
  }
  const showTips = flags.has('--tips');
  let errors = 0, warnings = 0;
  const json = { skills: [], bundles: [], duplicates: [] };

  for (const t of singles) {
    const file = t.endsWith('.md') ? t : resolve(t, 'SKILL.md');
    const r = validateSkill(readFileSync(file, 'utf8'), basename(dirname(resolve(file))));
    errors += r.errors; warnings += r.warnings;
    json.skills.push({ file, ...r });
    if (!flags.has('--json')) r.issues.filter((i) => showTips || i.level !== 'tip').forEach((i) => printIssue(relative('.', file), i));
  }
  if (singles.length && !flags.has('--json')) {
    const bad = json.skills.filter((r) => !r.ok).length;
    console.log(`${bad ? red('✗') : green('✓')} ${singles.length} skill${singles.length === 1 ? '' : 's'} checked${bad ? `, ${bad} with errors` : ''}`);
  }

  if (bundlesIn.length) {
    const p = validateProject(bundlesIn);
    errors += p.errors; warnings += p.warnings;
    json.bundles = p.bundles; json.duplicates = p.duplicates;
    if (!flags.has('--json')) {
      if (!p.bundles.length && !singles.length) {
        console.log(`No .skillsbundle found under ${bundlesIn.join(', ')}.`);
        process.exit(1);
      }
      for (const b of p.bundles) {
        const rel = relative('.', b.bundle) || b.bundle;
        b.issues.forEach((i) => printIssue(rel, i));
        for (const s of b.skills) s.result.issues.filter((i) => showTips || i.level !== 'tip').forEach((i) => printIssue(relative('.', s.file), i, s.name));
        const bad = b.skills.filter((s) => !s.result.ok).length;
        console.log(`${bad || b.issues.some((i) => i.level === 'error') ? red('✗') : green('✓')} ${rel} ${dim(`— ${b.skills.length} skill${b.skills.length === 1 ? '' : 's'}`)}`);
      }
      for (const d of p.duplicates) {
        console.log(`${yellow('warning')}: skill name '${d.name}' is used twice; only one is kept and which one is undefined:\n  ${d.files.map((f) => relative('.', f)).join('\n  ')}`);
      }
    }
  }

  if (flags.has('--json')) console.log(JSON.stringify(json, null, 2));
  else {
    console.log(errors ? red(`\n${errors} error${errors > 1 ? 's' : ''}: the app will ship with no skills at all.`) : green(`\nNo errors.${warnings ? ` ${warnings} warning${warnings > 1 ? 's' : ''}.` : ''}`));
  }
  process.exit(errors || (flags.has('--strict') && warnings) ? 1 : 0);
}

function bundlePath() {
  return resolve(opt('bundle', 'Skills.skillsbundle'));
}

try {
switch (cmd) {
  case 'validate':
    validate();
    break;
  case 'check-build': {
    if (!args[0]) { console.error('Usage: siriskills check-build <path/to/MyApp.app>'); process.exit(2); }
    if (!existsSync(args[0]) || !statSync(args[0]).isDirectory()) { console.error(`${args[0]} is not an .app folder.`); process.exit(2); }
    const r = checkBuild(resolve(args[0]));
    console.log(`${r.ok ? green('✓') : red('✗')} ${r.message}`);
    process.exit(r.ok ? 0 : 1);
  }
  case 'new': {
    if (!args[0]) { console.error('Usage: siriskills new <name> [--bundle path]'); process.exit(2); }
    const file = writeSkill(bundlePath(), args[0], skeleton(args[0]), { force: flags.has('--force') });
    console.log(`${green('✓')} Created ${relative('.', file)}\n${dim('Make sure the bundle is in your target\'s Copy Bundle Resources phase.')}`);
    break;
  }
  case 'list': {
    const cat = args[0]?.toLowerCase();
    const items = loadLibrary().filter((s) => !cat || s.category.toLowerCase().includes(cat));
    if (flags.has('--json')) { console.log(JSON.stringify(items.map(({ skill, notes, ...m }) => m), null, 2)); break; }
    const w = Math.max(...items.map((s) => s.slug.length));
    for (const s of items) console.log(`${bold(s.slug.padEnd(w))}  ${dim(s.category.padEnd(17))} ${s.summary ?? ''}`);
    break;
  }
  case 'show': {
    const s = getSkill(args[0]);
    if (!s) { console.error(`No example skill "${args[0]}". Run: siriskills list`); process.exit(1); }
    process.stdout.write(s.skill);
    break;
  }
  case 'add': {
    const s = getSkill(args[0]);
    if (!s) { console.error(`No example skill "${args[0]}". Run: siriskills list`); process.exit(1); }
    const file = writeSkill(bundlePath(), opt('as', s.slug), s.skill, { force: flags.has('--force') });
    console.log(`${green('✓')} Added ${relative('.', file)}\n${dim(`Tools it expects: ${s.tools.join(', ')}. Rename them to your App Intents titles.`)}`);
    break;
  }
  case 'mcp': {
    const { runStdio } = await import('../src/mcp.js');
    await runStdio();
    break;
  }
  case '--version':
  case '-v':
    console.log(pkg.version);
    break;
  default:
    console.log(HELP);
    process.exit(cmd && cmd !== 'help' && cmd !== '--help' && cmd !== '-h' ? 2 : 0);
}
} catch (e) {
  console.error(red(e.message));
  process.exit(1);
}
