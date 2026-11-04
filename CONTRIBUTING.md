# Contributing

Thanks for helping. Three kinds of contributions are welcome:

1. **A new example skill**: the most useful kind.
2. **A fix**: to a skill, the CLI, or the MCP server.
3. **A resource**: an official doc, tool, or article for the README. Real, working links only.

## Add a skill

```bash
npm ci
mkdir skills/<name>            # kebab-case, same as the name field
```

Each skill folder has up to three files:

| File | Required | What it is |
|---|---|---|
| `SKILL.md` | yes | Exactly what ships in an app's bundle |
| `README.md` | yes | Metadata frontmatter plus optional notes |
| `icon.webp` | no | 256×256 [Fluent Emoji 3D](https://github.com/microsoft/fluentui-emoji) icon (`cwebp -q 85`) |

`README.md` frontmatter:

```yaml
---
title: "Reorder a past delivery"
category: Food & Drink            # reuse an existing category
appType: food delivery app        # "written for a hypothetical <appType>"
summary: "One sentence: what a person can say and what happens."
tools: ["Find Past Orders", "Add to Cart"]   # App Intents titles the skill uses
icon: utensils-crossed            # lucide.dev icon name, fallback when there's no icon.webp
updated: 2026-11-04
---

## Why this works

Optional notes, shown on siriskills.com.
```

Then run:

```bash
npm run validate   # every skill passes, zero warnings
npm test
npm run readme     # regenerate the index in README.md
```

## What makes a good skill

- **The description routes.** It says what the skill does, the words people actually use ("reorder", "the usual"), and a `Not for …` boundary.
- **The body orchestrates.** Which tools, in what order, what to pass along, when to ask instead of guessing, and a `## Don't` list.
- **Tools by title**, never Swift type names.
- **It adds something tools can't.** Don't write a skill that's just a manual for one tool.

## Rules

- **Hypothetical apps only.** Don't present a skill as belonging to a real app or brand.
- Facts about the format must come from Apple's documentation. Don't invent fields or limits.
- No personal data, secrets, or tracking in any file.

## Pull requests

One skill or one fix per PR. CI runs the tests, validates every skill, and checks that the README index is current.
