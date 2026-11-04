---
title: "Log a workout from a sentence"
category: Health & Fitness
appType: workout tracking app
summary: "Turn \"I just ran 5K in 28 minutes\" into a logged session, and know when to ask instead of guessing the activity."
tools: ["Find Activity Types","Log Workout","Get Recent Workouts"]
icon: dumbbell
updated: 2026-11-04
---

## Why this works

**It defines the app's vocabulary.** "Just now" and "this morning" mean specific things in this app. That kind of context can't live in any single tool's metadata, which is exactly what Apple says skills are for.

**It prevents duplicates.** Step 2 makes the model check before writing. A tool description can say what the tool does; it can't say "check another tool first". That's orchestration, and it belongs in a skill.

**It says when to ask.** Ambiguous words like "training" get a question, not a guess.

## Adapt it

- If your app reads workouts from HealthKit automatically, add a line telling the model to check for an imported session first.
