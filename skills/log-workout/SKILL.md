---
name: log-workout
description: Log a workout the user just finished or did earlier. Use when the user says they ran, walked, cycled, swam, lifted, or trained, or asks to log, record, or add a workout. Not for planning future workouts or reading stats.
---

# Log a Workout

Work out the activity, duration, and distance from what the user said. "Just now" means it ended a few minutes ago. "This morning" means before noon today.

1. Use the Find Activity Types tool to match the activity. If the user's word fits more than one type, for example "training", ask which one.
2. Before logging, use the Get Recent Workouts tool for today. If a workout of the same type already exists within the same hour, ask whether this is a new one or the same session.
3. Use the Log Workout tool. Leave distance empty if the user didn't give one; don't estimate it.

## Don't

- Don't convert units the user didn't ask to convert.
- Don't log more than one workout from a single request unless the user listed several.
