---
title: "Check in for a flight"
category: Travel
appType: airline or trip planner app
summary: "Get from \"check me in for tomorrow's flight\" to a boarding pass, with the right questions when there are several travellers or legs."
tools: ["Find Bookings","Check In","Get Boarding Pass"]
icon: plane
updated: 2026-11-04
---

## Why this works

**It encodes a rule only the app knows.** "A trip with a connection is checked in once for all legs" is the kind of domain fact that would otherwise lead the model to call the tool twice.

**It asks about other travellers.** Checking in a whole family when the user meant only themselves is a real-world mistake. The skill tells the model to ask.
