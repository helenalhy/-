---
name: Mobile web push reminders
description: Product requirements and mobile-browser limitations for check-in reminders.
---

The user wants mobile-web check-in reminders to arrive even after the page is closed. Reminders must work for guest users without Google sign-in, allow multiple user-selected local times, and skip the remaining reminders on days they have already checked in. On iPhone and iPad, explain that Safari web push requires adding the app to the Home Screen and granting notification permission.

**Why:** The user chose background push rather than reminders that only work while the page is open, then requested more than one daily reminder.

**How to apply:** Preserve guest access, all configured times, and the daily skip behavior when changing reminder scheduling or notification settings. Do not imply every mobile browser supports background web push.
