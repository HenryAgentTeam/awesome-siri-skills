---
title: "Split an expense with friends"
category: Finance
appType: shared expenses app
summary: "Handle \"split dinner with Sam and Alex, 90 dollars\" end to end, including the cases where a name matches two people."
tools: ["Find Contacts","Find Groups","Add Expense"]
icon: wallet
updated: 2026-11-04
---

## Why this works

**The boundary separates two close tasks.** "Split" and "settle up" sound similar but are different actions. Putting "Not for settling up" in the description makes sure a settle-up skill gets picked for those requests.

**Defaults are spelled out.** Even split unless told otherwise, the user as payer when they say "I paid". These are the app's opinions, and the skill is where you state them.

## Adapt it

- If amounts are sensitive in your app, protect the expense entity with an authentication policy in code. The skill can't enforce that.
