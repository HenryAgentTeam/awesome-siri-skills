---
name: passport-check
description: Check the user's passport expiry before a trip and warn if it runs out within six months of travelling or needs renewal. Use when the user asks whether their passport is still valid for a trip, when it expires, or whether they need to renew it. Not for visa rules or booking travel.
---

# Check your passport before a trip

1. Use the Get Passport tool to read the expiry date. If the user has no passport saved, say so and stop.
2. Use the Get Upcoming Trips tool to find the next trip and its return date. If there is no upcoming trip, just report the expiry date and how many months are left.
3. If the passport expires within six months after the return date, say it needs renewal before travelling and suggest starting the renewal now.
4. Otherwise, confirm the passport is valid for the trip and give the expiry date.

## Don't

- Don't give visa advice. Expiry is not the same as a visa requirement.
- Don't guess the expiry date if the passport is not on file.
