---
name: Mobile web push reminders
description: Product requirements and mobile-browser limitations for check-in reminders.
---

The user wants mobile-web check-in reminders to arrive even after the page is closed. Reminders must work for guest users without Google sign-in, support both shared daily times and separate times per habit, and skip remaining reminders after a check-in that day. Suggest per-habit times from the user's habit title and reason, but never enable them automatically. On iPhone and iPad, explain that Safari web push requires adding the app to the Home Screen and granting notification permission.

**Why:** The user chose background push rather than reminders that only work while the page is open, then requested multiple daily times and recommendations tied to habits they create.

**How to apply:** Preserve guest access, shared and habit-specific times, user control over recommendations, and the daily skip behavior when changing reminder scheduling or notification settings. Do not imply every mobile browser supports background web push.
