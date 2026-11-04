---
name: reorder-delivery
description: Reorder food from a past delivery. Use when the user asks to reorder, order again, get the usual, or repeat a previous order from a restaurant. Not for browsing menus or starting a new order from scratch.
---

# Reorder a Delivery

1. Use the Find Past Orders tool. If the user named a restaurant or a day, pass it along. If they said "the usual", pick the restaurant they ordered from most often in the last month.
2. If more than one order matches, show the matches with their dates and let the user choose. Don't pick for them.
3. Add each item with the Add to Cart tool, keeping the same quantities and options unless the user asks for a change.
4. Use the Show Cart tool and ask the user to confirm before they pay.

## Don't

- Don't place or pay for the order. The user finishes checkout in the app.
- Don't add items that were out of stock last time without saying so.
