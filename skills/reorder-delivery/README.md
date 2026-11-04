---
title: "Reorder a past delivery"
category: Food & Drink
appType: food delivery app
summary: "Let people say \"order the usual\" and get last week's order back in the cart, without Siri ever checking out on its own."
tools: ["Find Past Orders","Add to Cart","Show Cart"]
icon: utensils-crossed
updated: 2026-11-04
---

## Why this works

**The description carries the phrasing.** "Reorder", "order again", "the usual" and "repeat a previous order" are the words people actually say. Siri reads only the description when deciding whether this skill applies, so every common phrasing has to be there.

**The boundary is explicit.** "Not for browsing menus" keeps this skill from being picked when someone wants to explore, which a separate skill should handle.

**Checkout stays in code, not in the skill.** The "Don't place the order" line is guidance, not enforcement. Apple is clear that skills can't guarantee deterministic behavior. If paying must never happen through Siri, don't expose a checkout tool at all, or protect it with an authentication policy.

## Adapt it

- Rename the tools to match the titles of your own App Intents.
- If your app has saved favorites, mention the favorites tool in step 1 and say when to prefer it over order history.
